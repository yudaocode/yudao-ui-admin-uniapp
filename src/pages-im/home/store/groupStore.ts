import type { ImGroupRespVO } from '@/api/im/group'
import {
  dissolveGroup as dissolveGroupApi,
  getGroup as getGroupApi,
  getMyGroupList,
} from '@/api/im/group'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import {
  getGroupMember,
  getGroupMemberList,
  quitGroup as quitGroupApi,
  updateGroupMember,
} from '@/api/im/group/member'
import type { ImDbClient } from '@/pages-im/utils/db'
import { getClientConversationId, getDb, initDb } from '@/pages-im/utils/db'
import type { GroupNotificationPayload } from '@/pages-im/utils/message'
import type { Group, GroupDO, GroupMember, GroupMemberDO, Message } from '../types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getGroupDisplayName } from '@/pages-im/utils/user'
import {
  CommonStatusEnum,
  ImConversationType,
  ImGroupMemberRole,
  ImMessageStatus,
  ImMessageType,
} from '@/pages-im/utils/constants'
import { useConversationStore } from './conversationStore'
import { useGroupRequestStore } from './groupRequestStore'
import {
  isResourceRequestPending,
  ResourceRequestKey,
  ResourceRequestMode,
  runResourceRequest,
} from '@/pages-im/utils/resourceRequest'
import {
  enqueueConversationWrite,
  enqueueConversationWrites,
  isRelationTerminated,
  markRelationTerminated,
  reopenRelation,
} from '@/pages-im/utils/messageSync'

/** IM 群聊 Store */
export const useGroupStore = defineStore('imGroupStore', () => {
  const groups = ref<Group[]>([]) // 当前账号群聊列表
  let loaded = false // 是否已从服务端加载群列表
  const loading = ref(false) // 群聊加载状态
  const memberLoadTasks = new Map<number, Promise<GroupMember[]>>() // 群成员加载任务
  const singleMemberLoadTasks = new Map<string, Promise<GroupMember | undefined>>() // 单个群成员加载任务
  const detailLoadTasks = new Map<number, Promise<Group | undefined>>() // 群详情加载任务
  const detailLoadedGroupIds = new Set<number>() // 已加载详情的群编号
  const groupRelationVersions = new Map<number, number>() // 群关系代际，阻断退出后重入的旧响应
  let groupRelationVersionSequence = 0 // 群关系递增序列
  const memberReloadQueued = new Set<number>() // 当前成员加载完成后需刷新的群
  const detailReloadQueued = new Set<number>() // 当前详情加载完成后需刷新的群
  let groupMembersExpired = false // 进入 IM / 重连后置位，成员桶下次访问时刷新

  /** 获取当前群关系代际，首次访问时创建 */
  function ensureGroupRelationVersion(groupId: number): number {
    const current = groupRelationVersions.get(groupId)
    if (current !== undefined) {
      return current
    }
    const next = ++groupRelationVersionSequence
    groupRelationVersions.set(groupId, next)
    return next
  }

  /** 从本地库恢复群列表 */
  async function loadGroupList(): Promise<void> {
    try {
      const db = await initDb()
      const cached = await db.getAll<GroupDO>('groups')
      if (cached.length === 0) {
        return
      }
      const conversationIds = cached.map(group => getClientConversationId(
        ImConversationType.GROUP,
        group.id,
      ))
      await enqueueConversationWrites(conversationIds, async () => {
        const activeGroups = cached.filter(group => !isRelationTerminated(getClientConversationId(ImConversationType.GROUP, group.id),
        ))
        groups.value = activeGroups
      })
    } catch (error) {
      console.warn('[IM groupStore] 本地群缓存读取失败', error)
    }
  }

  /** 保存群列表 */
  async function saveGroupList(
    rows: Group[],
    db: ImDbClient,
  ): Promise<void> {
    await db.clearStore('groups')
    await db.bulkPut<GroupDO>('groups', rows.map(buildGroupDO))
  }

  /** 保存单个群 */
  async function saveGroupRecord(
    group: Group | undefined,
    db: ImDbClient,
  ): Promise<void> {
    if (!group) {
      return
    }
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, group.id)
    if (isRelationTerminated(clientConversationId)) {
      return
    }
    await db.put('groups', buildGroupDO(group))
  }

  /** 异步保存单个群 */
  function saveGroup(
    group: Group | undefined,
    db: ImDbClient,
  ): void {
    if (!group) {
      return
    }
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, group.id)
    const snapshot = { ...group }
    void enqueueConversationWrite(clientConversationId, () =>
      saveGroupRecord(snapshot, db)).catch(error =>
      console.warn('[IM groupStore] 本地群写入失败', error))
  }

  /** 从本地库恢复指定群成员 */
  async function loadGroupMemberList(
    groupId: number,
  ): Promise<GroupMember[] | null> {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, groupId)
    if (isRelationTerminated(clientConversationId)) {
      return null
    }
    const cachedGroup = getGroup(groupId)
    if (cachedGroup?.members && cachedGroup.membersLoaded) {
      return cachedGroup.members
    }
    try {
      const relationVersion = ensureGroupRelationVersion(groupId)
      const isRelationCurrent = () =>
        groupRelationVersions.get(groupId) === relationVersion
        && !isRelationTerminated(clientConversationId)
      const db = await initDb()
      const cached = await db.filter<GroupMemberDO>(
        'groupMembers',
        member => member.groupId === groupId,
      )
      if (!cached || cached.length === 0) {
        return null
      }
      // TODO @AI：【done】直接返回会话写入结果
      return await enqueueConversationWrite(clientConversationId, async () => {
        if (!isRelationCurrent()) {
          return null
        }
        const members = cached
        const group = getGroup(groupId)
        if (!group) {
          groups.value.push({
            id: groupId,
            name: '',
            members,
            memberCount: members.length,
            membersLoaded: true,
            membersExpired: groupMembersExpired,
          })
        } else {
          group.members = members
          group.memberCount = members.length
          group.membersLoaded = true
          group.membersExpired = groupMembersExpired
        }
        return members
      })
    } catch (error) {
      console.warn('[IM groupStore] 本地群成员缓存读取失败', { groupId }, error)
      return null
    }
  }

  /** 加载群聊列表 */
  async function fetchGroupList(force = false): Promise<Group[]> {
    if (!force && loaded) {
      return groups.value
    }
    return runResourceRequest(ResourceRequestKey.GROUP_LIST, async () => {
      const db = await initDb()
      loading.value = true
      try {
        const rows = (await getMyGroupList()).map(group => convertGroup(group, db.userId))
        const conversationIds = Array.from(new Set([...groups.value, ...rows].map(group =>
          getClientConversationId(ImConversationType.GROUP, group.id))))
        return await enqueueConversationWrites(conversationIds, async () => {
          const visibleGroups = rows.filter(group => !isRelationTerminated(
            getClientConversationId(ImConversationType.GROUP, group.id),
          ))
          const previousGroups = new Map(groups.value.map(group => [group.id, group]))
          groups.value = visibleGroups.map((group) => {
            const previous = previousGroups.get(group.id)
            if (!previous) {
              return {
                ...group,
                activeCallExpired: true,
                infoLoaded: true,
              }
            }
            return {
              ...group,
              infoLoaded: true,
              activeCallExpired: previous.activeCallExpired,
              activeCallLoaded: previous.activeCallLoaded,
              members: previous.members,
              memberCount: previous.memberCount ?? group.memberCount,
              membersLoaded: previous.membersLoaded,
              membersExpired: previous.membersExpired,
            }
          })
          loaded = true
          groups.value.forEach(group => syncGroupConversation(group, db))
          await saveGroupList([...groups.value], db).catch(error =>
            console.warn('[IM groupStore] 本地群缓存写入失败', error))
          return groups.value
        })
      } finally {
        loading.value = false
      }
    }, { mode: ResourceRequestMode.SINGLE_FLIGHT, refreshAfterPending: force })
  }

  /** 按群编号获取群聊 */
  function getGroup(groupId: number) {
    return groups.value.find(group => group.id === groupId)
  }

  /** 是否为当前账号本次运行内已退出、被踢或已解散的群 */
  function isGroupUnavailable(groupId: number) {
    return isRelationTerminated(getClientConversationId(ImConversationType.GROUP, groupId))
  }

  /** 加载指定群详情 */
  function fetchGroupInfo(
    groupId: number,
    force = false,
    db: ImDbClient = getDb(),
  ): Promise<Group | undefined> {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, groupId)
    if (groupId <= 0 || isRelationTerminated(clientConversationId)) {
      return Promise.resolve(undefined)
    }
    const cachedGroup = getGroup(groupId)
    if (!force && detailLoadedGroupIds.has(groupId) && cachedGroup) {
      return Promise.resolve(cachedGroup)
    }
    const pending = detailLoadTasks.get(groupId)
    if (pending) {
      if (force) {
        detailReloadQueued.add(groupId)
      }
      return pending
    }
    const relationVersion = ensureGroupRelationVersion(groupId)
    const isRelationCurrent = () =>
      groupRelationVersions.get(groupId) === relationVersion
      && !isRelationTerminated(clientConversationId)
    const task = (async () => {
      const group = convertGroup(await getGroupApi(groupId), db.userId)
      // TODO @AI：【done】直接返回会话写入结果
      return await enqueueConversationWrite(clientConversationId, async () => {
        if (!isRelationCurrent()) {
          return undefined
        }
        await upsertGroupAndSave({ ...group, infoLoaded: true }, db)
        detailLoadedGroupIds.add(groupId)
        return getGroup(groupId)
      })
    })().finally(() => {
      if (detailLoadTasks.get(groupId) === task) {
        const shouldReload = detailReloadQueued.has(groupId)
          && !isRelationTerminated(clientConversationId)
        detailLoadTasks.delete(groupId)
        detailReloadQueued.delete(groupId)
        if (shouldReload) {
          void fetchGroupInfo(groupId, true, db).catch(() => undefined)
        }
      }
    })
    detailLoadTasks.set(groupId, task)
    return task
  }

  /** 加载指定群成员 */
  function fetchGroupMemberList(
    groupId: number,
    force = false,
    db: ImDbClient = getDb(),
  ): Promise<GroupMember[]> {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, groupId)
    if (groupId <= 0 || isRelationTerminated(clientConversationId)) {
      return Promise.resolve([])
    }
    const cachedGroup = getGroup(groupId)
    if (cachedGroup?.members && cachedGroup.membersLoaded && !cachedGroup.membersExpired && !force) {
      return Promise.resolve(cachedGroup.members)
    }
    const pending = memberLoadTasks.get(groupId)
    if (pending) {
      if (force) {
        memberReloadQueued.add(groupId)
      }
      return pending
    }
    const relationVersion = ensureGroupRelationVersion(groupId)
    const isRelationCurrent = () =>
      groupRelationVersions.get(groupId) === relationVersion
      && !isRelationTerminated(clientConversationId)
    const task = (async () => {
      const rawRows = await getGroupMemberList(groupId)
      const rows = rawRows.map(member => convertGroupMember(member, groupId))
      const selfMember = rawRows.find(member => member.userId === db.userId)
      const silent = !!selfMember?.silent
      const groupRemark = selfMember?.groupRemark || ''
      // TODO @AI：【done】直接返回会话写入结果
      return await enqueueConversationWrite(clientConversationId, async () => {
        if (!isRelationCurrent()) {
          return []
        }
        const group = getGroup(groupId)
        const isPlaceholder = !group
        let groupFieldsChanged = false
        if (!group) {
          groups.value.push({
            id: groupId,
            name: '',
            members: rows,
            memberCount: rows.length,
            silent,
            groupRemark,
            membersLoaded: true,
            membersExpired: false,
          })
        } else {
          group.members = rows
          group.memberCount = rows.length
          group.membersLoaded = true
          group.membersExpired = false
          if (group.silent !== silent || group.groupRemark !== groupRemark) {
            group.silent = silent
            group.groupRemark = groupRemark
            groupFieldsChanged = true
            syncGroupConversation(group, db)
          }
        }
        await saveGroupMemberListRecord(groupId, db)
        if (!isPlaceholder && groupFieldsChanged) {
          await saveGroupRecord(group, db)
        }
        return rows
      })
    })().finally(() => {
      if (memberLoadTasks.get(groupId) === task) {
        const shouldReload = memberReloadQueued.has(groupId)
          && !isRelationTerminated(clientConversationId)
        memberLoadTasks.delete(groupId)
        memberReloadQueued.delete(groupId)
        if (shouldReload) {
          void fetchGroupMemberList(groupId, true, db).catch(() => undefined)
        }
      }
    })
    memberLoadTasks.set(groupId, task)
    return task
  }

  /** 按需补齐指定群成员，不改变整群成员缓存的完整状态 */
  function fetchGroupMember(
    groupId: number,
    memberUserId: number,
  ): Promise<GroupMember | undefined> {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, groupId)
    if (groupId <= 0
      || memberUserId <= 0
      || isRelationTerminated(clientConversationId)) {
      return Promise.resolve(undefined)
    }
    const cached = getGroup(groupId)?.members?.find(member => member.userId === memberUserId)
    if (cached) {
      return Promise.resolve(cached)
    }
    const relationVersion = ensureGroupRelationVersion(groupId)
    const key = `${groupId}:${relationVersion}:${memberUserId}`
    const pending = singleMemberLoadTasks.get(key)
    if (pending) {
      return pending
    }
    const isRelationCurrent = () =>
      groupRelationVersions.get(groupId) === relationVersion
      && !isRelationTerminated(clientConversationId)
    const task = (async () => {
      const rawMember = await getGroupMember(groupId, memberUserId)
      if (!rawMember) {
        return undefined
      }
      const member = convertGroupMember(rawMember, groupId)
      // TODO @AI：【done】直接返回会话写入结果
      return await enqueueConversationWrite(clientConversationId, async () => {
        if (!isRelationCurrent()) {
          return undefined
        }
        const group = getGroup(groupId)
        if (!group) {
          groups.value.push({ id: groupId, name: '', members: [member] })
          return member
        }
        const members = group.members || []
        const index = members.findIndex(item => item.userId === memberUserId)
        if (index >= 0) {
          members[index] = member
        } else {
          members.push(member)
        }
        group.members = members
        return member
      })
    })().finally(() => {
      if (singleMemberLoadTasks.get(key) === task) {
        singleMemberLoadTasks.delete(key)
      }
    })
    singleMemberLoadTasks.set(key, task)
    return task
  }

  /** 标记全部群成员缓存过期 */
  function markAllGroupMembersExpired() {
    groupMembersExpired = true
    groups.value.forEach((group) => {
      if (group.membersLoaded) {
        group.membersExpired = true
      }
    })
  }

  /** 标记全部群详情缓存过期 */
  function markAllGroupInfoExpired() {
    groups.value.forEach((group) => {
      group.infoLoaded = false
    })
  }

  /** 标记全部群通话探测缓存过期 */
  function markAllGroupActiveCallsExpired() {
    groups.value.forEach((group) => {
      group.activeCallExpired = true
    })
  }

  /** 标记群通话探测已加载 */
  function markGroupActiveCallLoaded(groupId: number) {
    const group = getGroup(groupId)
    if (!group) {
      return
    }
    group.activeCallLoaded = true
    group.activeCallExpired = false
  }

  /** 标记指定群成员缓存过期 */
  function markGroupMembersExpired(groupId: number) {
    const group = getGroup(groupId)
    if (group?.membersLoaded) {
      group.membersExpired = true
    }
  }

  /** 保存指定群成员缓存；调用方必须持有群会话写 lane */
  async function saveGroupMemberListRecord(
    groupId: number,
    db: ImDbClient,
  ): Promise<void> {
    const group = getGroup(groupId)
    if (!group?.members) {
      return
    }
    const records = JSON.parse(JSON.stringify(group.members)) as GroupMemberDO[]
    await db.removeWhere<GroupMemberDO>('groupMembers', member => member.groupId === groupId)
    await db.bulkPut('groupMembers', records)
  }

  /** 串行保存指定群成员缓存 */
  function saveGroupMemberList(
    groupId: number,
    db: ImDbClient = getDb(),
  ): void {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, groupId)
    void enqueueConversationWrite(clientConversationId, () =>
      saveGroupMemberListRecord(groupId, db)).catch(error =>
      console.warn(`[IM groupStore] 本地群成员缓存写入失败 (groupId=${groupId})`, error))
  }

  /** 同步群资料到已有会话 */
  function syncGroupConversation(group: Group, db: ImDbClient) {
    useConversationStore().updateConversation(ImConversationType.GROUP, group.id, {
      name: getGroupDisplayName(group),
      avatar: group.avatar || '',
      silent: group.silent,
    }, db)
  }

  /** 按群编号插入或合并群 */
  function upsertGroup(group: Group, db: ImDbClient = getDb()) {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, group.id)
    void enqueueConversationWrite(clientConversationId, () =>
      upsertGroupAndSave(group, db)).catch(error =>
      console.warn('[IM groupStore] 本地群写入失败', error))
  }

  /** 按群编号插入或合并群并保存 */
  async function upsertGroupAndSave(
    group: Group,
    db: ImDbClient,
  ): Promise<void> {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, group.id)
    if (isRelationTerminated(clientConversationId)) {
      return
    }
    const index = groups.value.findIndex(item => item.id === group.id)
    if (index >= 0) {
      groups.value[index] = { ...groups.value[index], ...group }
    } else {
      groups.value.push(group)
    }
    const merged = getGroup(group.id) || group
    syncGroupConversation(merged, db)
    await saveGroupRecord(merged, db)
  }

  /** 局部更新群字段并同步会话元数据 */
  function updateGroupFields(
    groupId: number,
    fields: Partial<Group>,
    db: ImDbClient = getDb(),
  ) {
    const group = getGroup(groupId)
    if (!group) {
      return
    }
    const changed = (Object.keys(fields) as Array<keyof Group>)
      .some(key => group[key] !== fields[key])
    if (!changed) {
      return
    }
    Object.assign(group, fields)
    saveGroup(group, db)
    syncGroupConversation(group, db)
  }

  /** 更新我在群里的个人设置 */
  async function updateMyGroupMember(
    groupId: number,
    fields: { displayUserName?: string, groupRemark?: string, silent?: boolean },
  ) {
    const db = await initDb()
    await updateGroupMember({ groupId, ...fields })
    if (fields.displayUserName !== undefined) {
      updateGroupMemberDisplayUserName(groupId, db.userId, fields.displayUserName, db)
    }
    const groupFields: Partial<Group> = {}
    if (fields.groupRemark !== undefined) {
      groupFields.groupRemark = fields.groupRemark
    }
    if (fields.silent !== undefined) {
      groupFields.silent = fields.silent
    }
    if (Object.keys(groupFields).length) {
      updateGroupFields(groupId, groupFields, db)
    }
    return true
  }

  /** 设置群消息免打扰 */
  async function setGroupSilent(groupId: number, silent: boolean) {
    const db = await initDb()
    await updateGroupMember({ groupId, silent })
    const group = getGroup(groupId)
    if (!group) {
      return
    }
    group.silent = silent
    syncGroupConversation(group, db)
    saveGroup(group, db)
  }

  /** 批量更新群成员角色 */
  function updateGroupMemberRoleList(
    groupId: number,
    userIds: number[],
    role: number,
    db: ImDbClient,
  ) {
    const group = getGroup(groupId)
    const members = group?.members
    if (!members?.length || !userIds.length) {
      return
    }
    const idSet = new Set(userIds)
    let changed = false
    const next = members.map((member) => {
      if (!idSet.has(member.userId) || member.role === role) {
        return member
      }
      changed = true
      return { ...member, role }
    })
    if (changed) {
      group!.members = next
      saveGroupMemberList(groupId, db)
    }
  }

  /** 转移本地群主与成员角色 */
  function transferGroupOwner(
    groupId: number,
    oldOwnerId: number,
    newOwnerId: number,
    db: ImDbClient,
  ) {
    const group = getGroup(groupId)
    if (!group) {
      return
    }
    if (group.ownerUserId !== newOwnerId) {
      group.ownerUserId = newOwnerId
    }
    updateGroupMemberRoleList(groupId, [oldOwnerId], ImGroupMemberRole.NORMAL, db)
    updateGroupMemberRoleList(groupId, [newOwnerId], ImGroupMemberRole.OWNER, db)
    saveGroup(group, db)
  }

  /** 从本地群成员列表移除成员 */
  function removeLocalGroupMemberList(
    groupId: number,
    userIds: number[],
    db: ImDbClient,
  ) {
    const group = getGroup(groupId)
    const members = group?.members
    if (!members?.length || !userIds.length) {
      return
    }
    const idSet = new Set(userIds)
    const next = members.filter(member => !idSet.has(member.userId))
    if (next.length === members.length) {
      return
    }
    group!.members = next
    updateGroupFields(groupId, { memberCount: next.length }, db)
    saveGroupMemberList(groupId, db)
  }

  /** 本地更新群成员状态 */
  function updateGroupMemberStatus(
    groupId: number,
    userId: number,
    status: number,
    db: ImDbClient,
  ) {
    const member = getGroup(groupId)?.members?.find(item => item.userId === userId)
    if (!member || member.status === status) {
      return
    }
    member.status = status
    saveGroupMemberList(groupId, db)
  }

  /** 本地更新群成员群昵称 */
  function updateGroupMemberDisplayUserName(
    groupId: number,
    userId: number,
    displayUserName: string,
    db: ImDbClient,
  ) {
    const member = getGroup(groupId)?.members?.find(item => item.userId === userId)
    if (!member || member.displayUserName === displayUserName) {
      return
    }
    member.displayUserName = displayUserName
    saveGroupMemberList(groupId, db)
  }

  /** 本地移除群及其会话 */
  function removeGroup(
    groupId: number,
    db: ImDbClient,
    expectedRelationVersion?: number,
  ) {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, groupId)
    return useConversationStore().removeGroupConversation(groupId, async () => {
      if (expectedRelationVersion !== undefined
        && groupRelationVersions.get(groupId) !== expectedRelationVersion) {
        return false
      }
      markRelationTerminated(clientConversationId)
      const relationVersion = ++groupRelationVersionSequence
      groupRelationVersions.set(groupId, relationVersion)
      groups.value = groups.value.filter(group => group.id !== groupId)
      detailLoadedGroupIds.delete(groupId)
      try {
        await Promise.all([
          db.delete('groups', groupId),
          db.removeWhere<GroupMemberDO>('groupMembers', member => member.groupId === groupId),
        ])
      } catch (error) {
        console.warn(`[IM groupStore] 群缓存删除失败 (groupId=${groupId})`, error)
      }
    }, db)
  }

  /** 退出群聊并清理本地数据 */
  async function quitGroup(groupId: number): Promise<void> {
    const db = getDb()
    const relationVersion = ensureGroupRelationVersion(groupId)
    await quitGroupApi(groupId)
    await removeGroup(groupId, db, relationVersion)
  }

  /** 解散群聊并清理本地数据 */
  async function dissolveGroup(groupId: number): Promise<void> {
    const db = getDb()
    const relationVersion = ensureGroupRelationVersion(groupId)
    await dissolveGroupApi(groupId)
    await removeGroup(groupId, db, relationVersion)
  }

  /** 在群会话 lane 内清除关系终态，仅显式创建、邀请或进群可调用 */
  async function reopenGroupRelation(
    groupId: number,
  ) {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, groupId)
    await enqueueConversationWrite(clientConversationId, async () => {
      groupRelationVersions.set(groupId, ++groupRelationVersionSequence)
      reopenRelation(clientConversationId)
    })
  }

  /** 判断当前用户是否在事件成员列表 */
  function isSelfInMembers(payload: GroupNotificationPayload, userId: number) {
    return !!payload.memberUserIds?.includes(userId)
  }

  /** 刷新当前用户可管理的入群申请 */
  function refreshGroupRequests() {
    void useGroupRequestStore().fetchUnhandledGroupRequestList().catch(() => undefined)
  }

  /** 在列表拉取期间收到群事件时合并为一次尾随刷新 */
  function queueGroupListRefreshAfterPending() {
    if (isResourceRequestPending(ResourceRequestKey.GROUP_LIST)) {
      void fetchGroupList(true).catch(() => undefined)
    }
  }

  /** 应用群消息置顶事件 */
  function applyGroupMessagePinNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
    currentUserId: number,
  ) {
    const group = getGroup(groupId)
    const message = payload.message
    if (!group || !message || group.pinnedMessages?.some(item => item.id === message.id)) {
      return
    }
    const pinnedMessage: Message = {
      ...message,
      clientMessageId: '',
      targetId: message.groupId || groupId,
      selfSend: message.senderId === currentUserId,
      status: ImMessageStatus.NORMAL,
      sendTime: new Date(message.sendTime).getTime(),
      atUserIds: message.atUserIds || [],
      receiverUserIds: message.receiverUserIds || [],
    }
    group.pinnedMessages = [...(group.pinnedMessages || []), pinnedMessage]
    saveGroup(group, db)
  }

  /** 应用群消息取消置顶事件 */
  function applyGroupMessageUnpinNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
  ) {
    const group = getGroup(groupId)
    const messageId = payload.messageId
    if (!group?.pinnedMessages?.length || !messageId) {
      return
    }
    const next = group.pinnedMessages.filter(message => message.id !== messageId)
    if (next.length === group.pinnedMessages.length) {
      return
    }
    group.pinnedMessages = next
    saveGroup(group, db)
  }

  /** 创建群广播 */
  async function applyGroupCreateNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
    currentUserId: number,
  ) {
    const includesSelf = isSelfInMembers(payload, currentUserId)
    if (includesSelf) {
      await reopenGroupRelation(groupId)
    }
    if (!includesSelf) {
      return
    }
    if (payload.operatorUserId === currentUserId && getGroup(groupId)) {
      return
    }
    await fetchGroupInfo(groupId, true, db)
  }

  /** 群名称变更 */
  function applyGroupNameUpdateNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
  ) {
    if (payload.newName) {
      updateGroupFields(groupId, { name: payload.newName }, db)
    }
  }

  /** 群公告变更 */
  function applyGroupNoticeUpdateNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
  ) {
    updateGroupFields(groupId, { notice: payload.newNotice ?? '' }, db)
  }

  /** 群资料变更 */
  function applyGroupInfoUpdateNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
  ) {
    const fields: Partial<Group> = {}
    if (payload.newAvatar) {
      fields.avatar = payload.newAvatar
    }
    if (payload.newJoinApproval != null) {
      fields.joinApproval = payload.newJoinApproval
    }
    if (Object.keys(fields).length > 0) {
      updateGroupFields(groupId, fields, db)
    }
  }

  /** 成员被邀请进群 */
  async function applyGroupMemberInviteNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
    currentUserId: number,
  ) {
    const includesSelf = isSelfInMembers(payload, currentUserId)
    if (includesSelf) {
      await reopenGroupRelation(groupId)
    }
    if (includesSelf && !getGroup(groupId)) {
      await fetchGroupInfo(groupId, true, db)
    }
    markGroupMembersExpired(groupId)
    void fetchGroupMemberList(groupId, true, db).catch(() => undefined)
  }

  /** 成员主动进群 */
  async function applyGroupMemberEnterNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
    currentUserId: number,
  ) {
    const isSelf = payload.entrantUserId === currentUserId
    if (isSelf) {
      await reopenGroupRelation(groupId)
    }
    if (isSelf && !getGroup(groupId)) {
      await fetchGroupInfo(groupId, true, db)
    }
    markGroupMembersExpired(groupId)
    void fetchGroupMemberList(groupId, true, db).catch(() => undefined)
  }

  /** 成员主动退群 */
  async function applyGroupMemberQuitNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
    currentUserId: number,
  ) {
    if (payload.operatorUserId === currentUserId) {
      updateGroupMemberStatus(groupId, payload.operatorUserId, CommonStatusEnum.DISABLE, db)
      await removeGroup(groupId, db)
    } else if (payload.operatorUserId) {
      removeLocalGroupMemberList(groupId, [payload.operatorUserId], db)
      markGroupMembersExpired(groupId)
    }
  }

  /** 成员被移出群 */
  async function applyGroupMemberKickNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
    currentUserId: number,
  ) {
    if (isSelfInMembers(payload, currentUserId)) {
      updateGroupMemberStatus(groupId, currentUserId, CommonStatusEnum.DISABLE, db)
      await removeGroup(groupId, db)
    } else {
      removeLocalGroupMemberList(groupId, payload.memberUserIds || [], db)
      markGroupMembersExpired(groupId)
    }
  }

  /** 群成员昵称变更 */
  function applyGroupMemberNicknameUpdateNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
  ) {
    if (!payload.operatorUserId) {
      return
    }
    updateGroupMemberDisplayUserName(
      groupId,
      payload.operatorUserId,
      payload.displayUserName ?? '',
      db,
    )
    markGroupMembersExpired(groupId)
  }

  /** 群主转让 */
  function applyGroupOwnerTransferNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    userId: number,
    db: ImDbClient,
  ) {
    if (payload.operatorUserId && payload.newOwnerUserId) {
      transferGroupOwner(groupId, payload.operatorUserId, payload.newOwnerUserId, db)
      markGroupMembersExpired(groupId)
    }
    if (payload.operatorUserId === userId || payload.newOwnerUserId === userId) {
      refreshGroupRequests()
    }
  }

  /** 单成员禁言 */
  function applyGroupMemberMutedNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
  ) {
    const member = getGroup(groupId)?.members?.find(item => item.userId === payload.mutedUserId)
    if (member && payload.muteEndTime) {
      member.muteEndTime = payload.muteEndTime
      saveGroupMemberList(groupId, db)
      markGroupMembersExpired(groupId)
    }
  }

  /** 取消单成员禁言 */
  function applyGroupMemberCancelMutedNotification(
    groupId: number,
    payload: GroupNotificationPayload,
    db: ImDbClient,
  ) {
    const member = getGroup(groupId)?.members?.find(item => item.userId === payload.mutedUserId)
    if (member) {
      member.muteEndTime = undefined
      saveGroupMemberList(groupId, db)
      markGroupMembersExpired(groupId)
    }
  }

  /** 接收并归约群广播事件 */
  async function applyGroupNotification(
    groupId: number,
    type: number,
    content?: string,
    db: ImDbClient = getDb(),
  ) {
    if (!groupId) {
      return
    }
    const currentUserId = db.userId
    let payload: GroupNotificationPayload
    try {
      payload = content ? JSON.parse(content) : {}
    } catch (error) {
      console.warn('[IM groupStore] 群事件内容解析失败', { groupId, type }, error)
      return
    }
    queueGroupListRefreshAfterPending()
    if (detailLoadTasks.has(groupId)) {
      detailReloadQueued.add(groupId)
    }
    switch (type) {
      case ImMessageType.GROUP_CREATE:
        await applyGroupCreateNotification(groupId, payload, db, currentUserId)
        break
      case ImMessageType.GROUP_NAME_UPDATE:
        applyGroupNameUpdateNotification(groupId, payload, db)
        break
      case ImMessageType.GROUP_NOTICE_UPDATE:
        applyGroupNoticeUpdateNotification(groupId, payload, db)
        break
      case ImMessageType.GROUP_INFO_UPDATE:
        applyGroupInfoUpdateNotification(groupId, payload, db)
        break
      case ImMessageType.GROUP_DISSOLVE:
        await removeGroup(groupId, db)
        break
      case ImMessageType.GROUP_MEMBER_INVITE:
        await applyGroupMemberInviteNotification(groupId, payload, db, currentUserId)
        break
      case ImMessageType.GROUP_MEMBER_ENTER:
        await applyGroupMemberEnterNotification(groupId, payload, db, currentUserId)
        break
      case ImMessageType.GROUP_MEMBER_QUIT:
        await applyGroupMemberQuitNotification(groupId, payload, db, currentUserId)
        break
      case ImMessageType.GROUP_MEMBER_KICK:
        await applyGroupMemberKickNotification(groupId, payload, db, currentUserId)
        break
      case ImMessageType.GROUP_MEMBER_NICKNAME_UPDATE:
        applyGroupMemberNicknameUpdateNotification(groupId, payload, db)
        break
      case ImMessageType.GROUP_ADMIN_ADD:
        updateGroupMemberRoleList(
          groupId,
          payload.memberUserIds || [],
          ImGroupMemberRole.ADMIN,
          db,
        )
        if (isSelfInMembers(payload, currentUserId)) {
          refreshGroupRequests()
        }
        markGroupMembersExpired(groupId)
        break
      case ImMessageType.GROUP_ADMIN_REMOVE:
        updateGroupMemberRoleList(
          groupId,
          payload.memberUserIds || [],
          ImGroupMemberRole.NORMAL,
          db,
        )
        if (isSelfInMembers(payload, currentUserId)) {
          refreshGroupRequests()
        }
        markGroupMembersExpired(groupId)
        break
      case ImMessageType.GROUP_OWNER_TRANSFER:
        applyGroupOwnerTransferNotification(groupId, payload, currentUserId, db)
        break
      case ImMessageType.GROUP_MESSAGE_PIN:
        applyGroupMessagePinNotification(groupId, payload, db, currentUserId)
        break
      case ImMessageType.GROUP_MESSAGE_UNPIN:
        applyGroupMessageUnpinNotification(groupId, payload, db)
        break
      case ImMessageType.GROUP_MEMBER_MUTED:
        applyGroupMemberMutedNotification(groupId, payload, db)
        break
      case ImMessageType.GROUP_MEMBER_CANCEL_MUTED:
        applyGroupMemberCancelMutedNotification(groupId, payload, db)
        break
      case ImMessageType.GROUP_MUTED:
        updateGroupFields(groupId, { mutedAll: true }, db)
        break
      case ImMessageType.GROUP_CANCEL_MUTED:
        updateGroupFields(groupId, { mutedAll: false }, db)
        break
      case ImMessageType.GROUP_BANNED:
        updateGroupFields(groupId, { banned: !!payload.banned }, db)
        break
    }
  }

  /** 清理群聊内存状态 */
  function clear() {
    groups.value = []
    loaded = false
    loading.value = false
    memberLoadTasks.clear()
    singleMemberLoadTasks.clear()
    detailLoadTasks.clear()
    detailLoadedGroupIds.clear()
    groupRelationVersions.clear()
    memberReloadQueued.clear()
    detailReloadQueued.clear()
    groupMembersExpired = false
  }

  return {
    groups,
    loading,
    loadGroupList,
    loadGroupMemberList,
    fetchGroupList,
    fetchGroupInfo,
    fetchGroupMemberList,
    fetchGroupMember,
    getGroup,
    isGroupUnavailable,
    markAllGroupInfoExpired,
    markAllGroupMembersExpired,
    markAllGroupActiveCallsExpired,
    markGroupActiveCallLoaded,
    upsertGroup,
    setGroupSilent,
    updateMyGroupMember,
    updateGroupFields,
    quitGroup,
    dissolveGroup,
    applyGroupNotification,
    clear,
  }
})

/** 后端群响应转换为本地域模型 */
function convertGroup(group: ImGroupRespVO, currentUserId: number): Group {
  return {
    id: group.id,
    name: group.name,
    avatar: group.avatar,
    notice: group.notice,
    ownerUserId: group.ownerUserId,
    pinnedMessages: group.pinnedMessages?.map(message =>
      convertGroupMessage(message, currentUserId)),
    mutedAll: group.mutedAll,
    banned: group.banned,
    status: group.status,
    joinApproval: group.joinApproval,
    joinStatus: group.joinStatus,
    groupRemark: group.groupRemark,
    silent: group.silent,
  }
}

/** 后端群消息响应转换为本地消息 */
function convertGroupMessage(message: ImGroupMessageRespVO, currentUserId: number): Message {
  return {
    id: message.id,
    clientMessageId: message.clientMessageId || '',
    type: message.type,
    content: message.content,
    status: message.status,
    sendTime: new Date(message.sendTime).getTime(),
    senderId: message.senderId,
    targetId: message.groupId,
    selfSend: !!currentUserId && message.senderId === currentUserId,
    atUserIds: message.atUserIds || [],
    receiverUserIds: message.receiverUserIds || [],
    receiptStatus: message.receiptStatus,
    readCount: message.readCount,
  }
}

/** 构建群本地存储记录 */
function buildGroupDO(group: Group): GroupDO {
  const {
    activeCallExpired: _activeCallExpired,
    activeCallLoaded: _activeCallLoaded,
    infoLoaded: _infoLoaded,
    members: _members,
    membersLoaded: _membersLoaded,
    membersExpired: _membersExpired,
    ...record
  } = group
  return JSON.parse(JSON.stringify(record)) as GroupDO
}

/** 后端群成员响应转换为本地域模型 */
function convertGroupMember(member: ImGroupMemberRespVO, groupId: number): GroupMember {
  return {
    id: member.id,
    groupId,
    userId: member.userId,
    nickname: member.nickname || String(member.userId),
    avatar: member.avatar,
    displayUserName: member.displayUserName,
    status: member.status,
    role: member.role,
    muteEndTime: member.muteEndTime,
  }
}
