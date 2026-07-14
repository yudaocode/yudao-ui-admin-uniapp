import type { ImGroupRespVO } from '@/api/im/group'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import type { GroupNotificationPayload } from '@/pages-im/utils/message'
import type { Group, GroupDO, GroupMember, GroupMemberDO, Message } from '../types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getGroup as getGroupApi, getMyGroupList } from '@/api/im/group'
import { getGroupMember, getGroupMemberList, updateGroupMember } from '@/api/im/group/member'
import { getDb, getDbSession, initDb, isCurrentDbSession } from '@/pages-im/utils/db'
import { getGroupDisplayName } from '@/pages-im/utils/user'
import { useUserStore } from '@/store/user'
import {
  CommonStatusEnum,
  ImConversationType,
  ImGroupMemberRole,
  ImMessageStatus,
  ImMessageType,
} from '@/pages-im/utils/constants'
import { useConversationStore } from './conversationStore'
import { useGroupRequestStore } from './groupRequestStore'

/** IM 群聊 Store */
export const useGroupStore = defineStore('imGroupStore', () => {
  const groups = ref<Group[]>([]) // 当前账号群聊列表
  const loaded = ref(false) // 是否已从服务端加载群列表
  const loading = ref(false) // 群聊加载状态
  let stateUserId = 0 // 当前内存数据所属用户
  let loadEpoch = 0 // 加载轮次
  let loadTask: Promise<Group[]> | undefined // 当前加载任务
  let loadTaskUserId = 0 // 当前加载任务所属用户
  const memberLoadTasks = new Map<number, Promise<GroupMember[]>>() // 群成员加载任务
  const singleMemberLoadTasks = new Map<string, Promise<GroupMember | undefined>>() // 单个群成员加载任务
  const detailLoadTasks = new Map<number, Promise<Group | undefined>>() // 群详情加载任务
  const detailLoadedGroupIds = new Set<number>() // 已加载详情的群编号
  let reloadQueued = false // 当前群聊加载完成后是否强制刷新
  const memberReloadQueued = new Set<number>() // 当前成员加载完成后需刷新的群
  const detailReloadQueued = new Set<number>() // 当前详情加载完成后需刷新的群
  let groupMembersExpired = false // 进入 IM / 重连后置位，成员桶下次访问时刷新

  /** 从本地库恢复群列表 */
  async function loadGroupList(): Promise<boolean> {
    try {
      const userId = useUserStore().userInfo.userId
      if (stateUserId !== userId) {
        clear()
        stateUserId = userId
      }
      const epoch = loadEpoch
      await initDb()
      if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
        return false
      }
      const session = getDbSession()
      const cached = await getDb().getAll<GroupDO>('groups')
      if (epoch !== loadEpoch
        || useUserStore().userInfo.userId !== userId
        || !isCurrentDbSession(session)) {
        return false
      }
      if (!cached || cached.length === 0) {
        return false
      }
      groups.value = cached
      return true
    } catch (error) {
      console.warn('[IM groupStore] 本地群缓存读取失败', error)
      return false
    }
  }

  /** 保存群列表 */
  function saveGroupList(): void {
    void (async () => {
      await initDb()
      const db = getDb()
      await db.clearStore('groups')
      await db.bulkPut<GroupDO>('groups', groups.value.map(buildGroupDO))
    })().catch(error => console.warn('[IM groupStore] 本地群缓存写入失败', error))
  }

  /** 保存单个群 */
  async function saveGroupRecord(group: Group | undefined): Promise<void> {
    if (!group) {
      return
    }
    const userId = stateUserId
    const epoch = loadEpoch
    await initDb()
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return
    }
    await getDb().put('groups', buildGroupDO(group))
  }

  /** 异步保存单个群 */
  function saveGroup(group: Group | undefined): void {
    void saveGroupRecord(group).catch(error =>
      console.warn('[IM groupStore] 本地群写入失败', error))
  }

  /** 从本地库恢复指定群成员 */
  async function loadGroupMemberList(groupId: number): Promise<GroupMember[] | null> {
    const cachedGroup = getGroup(groupId)
    if (cachedGroup?.members && cachedGroup.membersLoaded) {
      return cachedGroup.members
    }
    try {
      await initDb()
      const cached = await getDb().filter<GroupMemberDO>(
        'groupMembers',
        member => member.groupId === groupId,
      )
      if (!cached || cached.length === 0) {
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
    } catch (error) {
      console.warn('[IM groupStore] 本地群成员缓存读取失败', { groupId }, error)
      return null
    }
  }

  /** 加载群聊列表 */
  function fetchGroupList(force = false): Promise<Group[]> {
    const userId = useUserStore().userInfo.userId
    if (userId <= 0) {
      clear()
      return Promise.resolve([])
    }
    if (stateUserId !== userId) {
      clear()
      stateUserId = userId
    }
    if (!force && loaded.value) {
      return Promise.resolve(groups.value)
    }
    if (loadTask && loadTaskUserId === userId) {
      reloadQueued ||= force
      return loadTask
    }
    const epoch = loadEpoch
    const isActive = () => epoch === loadEpoch && useUserStore().userInfo.userId === userId
    loading.value = true
    const task = (async () => {
      const rows = (await getMyGroupList()).map(convertGroup)
      if (!isActive()) {
        return []
      }
      const previousGroups = new Map(groups.value.map(group => [group.id, group]))
      groups.value = rows.map((group) => {
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
      loaded.value = true
      groups.value.forEach(syncGroupConversation)
      saveGroupList()
      return groups.value
    })().finally(() => {
      if (loadTask === task) {
        const shouldReload = reloadQueued && useUserStore().userInfo.userId === userId
        loadTask = undefined
        loadTaskUserId = 0
        loading.value = false
        reloadQueued = false
        if (shouldReload) {
          void fetchGroupList(true).catch(() => undefined)
        }
      }
    })
    loadTask = task
    loadTaskUserId = userId
    return task
  }

  /** 按群编号获取群聊 */
  function getGroup(groupId: number) {
    return groups.value.find(group => group.id === groupId)
  }

  /** 加载指定群详情 */
  function fetchGroupInfo(groupId: number, force = false): Promise<Group | undefined> {
    const userId = useUserStore().userInfo.userId
    if (userId <= 0 || groupId <= 0) {
      return Promise.resolve(undefined)
    }
    if (stateUserId !== userId) {
      clear()
      stateUserId = userId
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
    const epoch = loadEpoch
    const isActive = () => epoch === loadEpoch && useUserStore().userInfo.userId === userId
    const task = (async () => {
      await initDb()
      const group = convertGroup(await getGroupApi(groupId))
      if (!isActive()) {
        return undefined
      }
      await upsertGroupAndSave({ ...group, infoLoaded: true })
      if (!isActive()) {
        return undefined
      }
      detailLoadedGroupIds.add(groupId)
      return getGroup(groupId)
    })().finally(() => {
      if (detailLoadTasks.get(groupId) === task) {
        const shouldReload = detailReloadQueued.has(groupId) && isActive()
        detailLoadTasks.delete(groupId)
        detailReloadQueued.delete(groupId)
        if (shouldReload) {
          void fetchGroupInfo(groupId, true).catch(() => undefined)
        }
      }
    })
    detailLoadTasks.set(groupId, task)
    return task
  }

  /** 加载指定群成员 */
  function fetchGroupMemberList(groupId: number, force = false): Promise<GroupMember[]> {
    const userId = useUserStore().userInfo.userId
    if (userId <= 0 || groupId <= 0) {
      return Promise.resolve([])
    }
    if (stateUserId !== userId) {
      clear()
      stateUserId = userId
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
    const epoch = loadEpoch
    const isActive = () => epoch === loadEpoch && useUserStore().userInfo.userId === userId
    const task = (async () => {
      const rawRows = await getGroupMemberList(groupId)
      if (!isActive()) {
        return []
      }
      const rows = rawRows.map(member => convertGroupMember(member, groupId))
      const selfMember = rawRows.find(member => member.userId === userId)
      const silent = !!selfMember?.silent
      const groupRemark = selfMember?.groupRemark || ''
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
          syncGroupConversation(group)
        }
      }
      saveGroupMemberList(groupId)
      if (!isPlaceholder && groupFieldsChanged) {
        saveGroup(group)
      }
      return rows
    })().finally(() => {
      if (memberLoadTasks.get(groupId) === task) {
        const shouldReload = memberReloadQueued.has(groupId) && isActive()
        memberLoadTasks.delete(groupId)
        memberReloadQueued.delete(groupId)
        if (shouldReload) {
          void fetchGroupMemberList(groupId, true).catch(() => undefined)
        }
      }
    })
    memberLoadTasks.set(groupId, task)
    return task
  }

  /** 按需补齐指定群成员，不改变整群成员缓存的完整状态 */
  function fetchGroupMember(groupId: number, memberUserId: number): Promise<GroupMember | undefined> {
    const userId = useUserStore().userInfo.userId
    if (userId <= 0 || groupId <= 0 || memberUserId <= 0) {
      return Promise.resolve(undefined)
    }
    if (stateUserId !== userId) {
      clear()
      stateUserId = userId
    }
    const cached = getGroup(groupId)?.members?.find(member => member.userId === memberUserId)
    if (cached) {
      return Promise.resolve(cached)
    }
    const key = `${userId}:${groupId}:${memberUserId}`
    const pending = singleMemberLoadTasks.get(key)
    if (pending) {
      return pending
    }
    const epoch = loadEpoch
    const isActive = () => epoch === loadEpoch && useUserStore().userInfo.userId === userId
    const task = (async () => {
      const rawMember = await getGroupMember(groupId, memberUserId)
      if (!isActive() || !rawMember) {
        return undefined
      }
      const member = convertGroupMember(rawMember, groupId)
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

  /** 保存指定群成员缓存 */
  function saveGroupMemberList(groupId: number): void {
    const group = getGroup(groupId)
    if (!group?.members) {
      return
    }
    const userId = stateUserId
    const epoch = loadEpoch
    void (async () => {
      const records = JSON.parse(JSON.stringify(group.members)) as GroupMemberDO[]
      await initDb()
      if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
        return
      }
      const db = getDb()
      await db.removeWhere<GroupMember>('groupMembers', member => member.groupId === groupId)
      await db.bulkPut('groupMembers', records)
    })().catch(error =>
      console.warn(`[IM groupStore] 本地群成员缓存写入失败 (groupId=${groupId})`, error))
  }

  /** 同步群资料到已有会话 */
  function syncGroupConversation(group: Group) {
    useConversationStore().updateConversation(ImConversationType.GROUP, group.id, {
      name: getGroupDisplayName(group),
      avatar: group.avatar || '',
      silent: group.silent,
    })
  }

  /** 按群编号插入或合并群 */
  function upsertGroup(group: Group) {
    void upsertGroupAndSave(group).catch(error =>
      console.warn('[IM groupStore] 本地群写入失败', error))
  }

  /** 按群编号插入或合并群并保存 */
  async function upsertGroupAndSave(group: Group): Promise<void> {
    const index = groups.value.findIndex(item => item.id === group.id)
    if (index >= 0) {
      groups.value[index] = { ...groups.value[index], ...group }
    } else {
      groups.value.push(group)
    }
    const merged = getGroup(group.id) || group
    syncGroupConversation(merged)
    await saveGroupRecord(merged)
  }

  /** 局部更新群字段并同步会话元数据 */
  function updateGroupFields(groupId: number, fields: Partial<Group>) {
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
    saveGroup(group)
    syncGroupConversation(group)
  }

  /** 更新我在群里的个人设置 */
  async function updateMyGroupMember(
    groupId: number,
    fields: { displayUserName?: string, groupRemark?: string, silent?: boolean },
  ) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    await updateGroupMember({ groupId, ...fields })
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return false
    }
    if (fields.displayUserName !== undefined) {
      updateGroupMemberDisplayUserName(groupId, userId, fields.displayUserName)
    }
    const groupFields: Partial<Group> = {}
    if (fields.groupRemark !== undefined) {
      groupFields.groupRemark = fields.groupRemark
    }
    if (fields.silent !== undefined) {
      groupFields.silent = fields.silent
    }
    if (Object.keys(groupFields).length) {
      updateGroupFields(groupId, groupFields)
    }
    return true
  }

  /** 设置群消息免打扰 */
  async function setGroupSilent(groupId: number, silent: boolean) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    await updateGroupMember({ groupId, silent })
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return
    }
    const group = getGroup(groupId)
    if (!group) {
      return
    }
    group.silent = silent
    syncGroupConversation(group)
    saveGroup(group)
  }

  /** 批量更新群成员角色 */
  function updateGroupMemberRoleList(groupId: number, userIds: number[], role: number) {
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
      saveGroupMemberList(groupId)
    }
  }

  /** 转移本地群主与成员角色 */
  function transferGroupOwner(groupId: number, oldOwnerId: number, newOwnerId: number) {
    const group = getGroup(groupId)
    if (!group) {
      return
    }
    if (group.ownerUserId !== newOwnerId) {
      group.ownerUserId = newOwnerId
    }
    updateGroupMemberRoleList(groupId, [oldOwnerId], ImGroupMemberRole.NORMAL)
    updateGroupMemberRoleList(groupId, [newOwnerId], ImGroupMemberRole.OWNER)
    saveGroup(group)
  }

  /** 从本地群成员列表移除成员 */
  function removeLocalGroupMemberList(groupId: number, userIds: number[]) {
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
    updateGroupFields(groupId, { memberCount: next.length })
    saveGroupMemberList(groupId)
  }

  /** 本地更新群成员状态 */
  function updateGroupMemberStatus(groupId: number, userId: number, status: number) {
    const member = getGroup(groupId)?.members?.find(item => item.userId === userId)
    if (!member || member.status === status) {
      return
    }
    member.status = status
    saveGroupMemberList(groupId)
  }

  /** 本地更新群成员群昵称 */
  function updateGroupMemberDisplayUserName(groupId: number, userId: number, displayUserName: string) {
    const member = getGroup(groupId)?.members?.find(item => item.userId === userId)
    if (!member || member.displayUserName === displayUserName) {
      return
    }
    member.displayUserName = displayUserName
    saveGroupMemberList(groupId)
  }

  /** 本地移除群及其会话 */
  function removeGroup(groupId: number) {
    groups.value = groups.value.filter(group => group.id !== groupId)
    detailLoadedGroupIds.delete(groupId)
    void (async () => {
      const userId = stateUserId
      const epoch = loadEpoch
      await initDb()
      if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
        return
      }
      const db = getDb()
      await Promise.all([
        db.delete('groups', groupId),
        db.removeWhere<GroupMemberDO>('groupMembers', member => member.groupId === groupId),
        useConversationStore().removeGroupConversation(groupId),
      ])
    })().catch(() => undefined)
  }

  /** 判断当前用户是否在事件成员列表 */
  function isSelfInMembers(payload: GroupNotificationPayload) {
    const userId = useUserStore().userInfo.userId
    return !!userId && !!payload.memberUserIds?.includes(userId)
  }

  /** 刷新当前用户可管理的入群申请 */
  function refreshGroupRequests() {
    void useGroupRequestStore().fetchUnhandledGroupRequestList().catch(() => undefined)
  }

  /** 应用群消息置顶事件 */
  function applyGroupMessagePinNotification(groupId: number, payload: GroupNotificationPayload) {
    const group = getGroup(groupId)
    const message = payload.message
    if (!group || !message || group.pinnedMessages?.some(item => item.id === message.id)) {
      return
    }
    const pinnedMessage: Message = {
      ...message,
      clientMessageId: '',
      targetId: message.groupId || groupId,
      selfSend: message.senderId === useUserStore().userInfo.userId,
      status: ImMessageStatus.NORMAL,
      sendTime: new Date(message.sendTime).getTime(),
      atUserIds: message.atUserIds || [],
      receiverUserIds: message.receiverUserIds || [],
    }
    group.pinnedMessages = [...(group.pinnedMessages || []), pinnedMessage]
    saveGroup(group)
  }

  /** 应用群消息取消置顶事件 */
  function applyGroupMessageUnpinNotification(groupId: number, payload: GroupNotificationPayload) {
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
    saveGroup(group)
  }

  /** 创建群广播 */
  async function applyGroupCreateNotification(groupId: number, payload: GroupNotificationPayload) {
    const selfUserId = useUserStore().userInfo.userId
    if (!isSelfInMembers(payload)) {
      return
    }
    if (payload.operatorUserId === selfUserId && getGroup(groupId)) {
      return
    }
    await fetchGroupInfo(groupId, true)
  }

  /** 群名称变更 */
  function applyGroupNameUpdateNotification(groupId: number, payload: GroupNotificationPayload) {
    if (payload.newName) {
      updateGroupFields(groupId, { name: payload.newName })
    }
  }

  /** 群公告变更 */
  function applyGroupNoticeUpdateNotification(groupId: number, payload: GroupNotificationPayload) {
    updateGroupFields(groupId, { notice: payload.newNotice ?? '' })
  }

  /** 群资料变更 */
  function applyGroupInfoUpdateNotification(groupId: number, payload: GroupNotificationPayload) {
    const fields: Partial<Group> = {}
    if (payload.newAvatar) {
      fields.avatar = payload.newAvatar
    }
    if (payload.newJoinApproval != null) {
      fields.joinApproval = payload.newJoinApproval
    }
    if (Object.keys(fields).length > 0) {
      updateGroupFields(groupId, fields)
    }
  }

  /** 成员被邀请进群 */
  async function applyGroupMemberInviteNotification(groupId: number, payload: GroupNotificationPayload) {
    if (isSelfInMembers(payload) && !getGroup(groupId)) {
      await fetchGroupInfo(groupId, true)
    }
    markGroupMembersExpired(groupId)
    void fetchGroupMemberList(groupId, true).catch(() => undefined)
  }

  /** 成员主动进群 */
  async function applyGroupMemberEnterNotification(groupId: number, payload: GroupNotificationPayload) {
    if (payload.entrantUserId === useUserStore().userInfo.userId && !getGroup(groupId)) {
      await fetchGroupInfo(groupId, true)
    }
    markGroupMembersExpired(groupId)
    void fetchGroupMemberList(groupId, true).catch(() => undefined)
  }

  /** 成员主动退群 */
  function applyGroupMemberQuitNotification(groupId: number, payload: GroupNotificationPayload) {
    if (payload.operatorUserId === useUserStore().userInfo.userId) {
      updateGroupMemberStatus(groupId, payload.operatorUserId, CommonStatusEnum.DISABLE)
      removeGroup(groupId)
    } else if (payload.operatorUserId) {
      removeLocalGroupMemberList(groupId, [payload.operatorUserId])
      markGroupMembersExpired(groupId)
    }
  }

  /** 成员被移出群 */
  function applyGroupMemberKickNotification(groupId: number, payload: GroupNotificationPayload) {
    if (isSelfInMembers(payload)) {
      const selfUserId = useUserStore().userInfo.userId
      if (selfUserId) {
        updateGroupMemberStatus(groupId, selfUserId, CommonStatusEnum.DISABLE)
      }
      removeGroup(groupId)
    } else {
      removeLocalGroupMemberList(groupId, payload.memberUserIds || [])
      markGroupMembersExpired(groupId)
    }
  }

  /** 群成员昵称变更 */
  function applyGroupMemberNicknameUpdateNotification(groupId: number, payload: GroupNotificationPayload) {
    if (!payload.operatorUserId) {
      return
    }
    updateGroupMemberDisplayUserName(groupId, payload.operatorUserId, payload.displayUserName ?? '')
    markGroupMembersExpired(groupId)
  }

  /** 群主转让 */
  function applyGroupOwnerTransferNotification(groupId: number, payload: GroupNotificationPayload) {
    if (payload.operatorUserId && payload.newOwnerUserId) {
      transferGroupOwner(groupId, payload.operatorUserId, payload.newOwnerUserId)
      markGroupMembersExpired(groupId)
    }
    const selfUserId = useUserStore().userInfo.userId
    if (payload.operatorUserId === selfUserId || payload.newOwnerUserId === selfUserId) {
      refreshGroupRequests()
    }
  }

  /** 单成员禁言 */
  function applyGroupMemberMutedNotification(groupId: number, payload: GroupNotificationPayload) {
    const member = getGroup(groupId)?.members?.find(item => item.userId === payload.mutedUserId)
    if (member && payload.muteEndTime) {
      member.muteEndTime = payload.muteEndTime
      saveGroupMemberList(groupId)
      markGroupMembersExpired(groupId)
    }
  }

  /** 取消单成员禁言 */
  function applyGroupMemberCancelMutedNotification(groupId: number, payload: GroupNotificationPayload) {
    const member = getGroup(groupId)?.members?.find(item => item.userId === payload.mutedUserId)
    if (member) {
      member.muteEndTime = undefined
      saveGroupMemberList(groupId)
      markGroupMembersExpired(groupId)
    }
  }

  /** 接收并归约群广播事件 */
  async function applyGroupNotification(groupId: number, type: number, content?: string) {
    if (!groupId) {
      return
    }
    let payload: GroupNotificationPayload
    try {
      payload = content ? JSON.parse(content) : {}
    } catch (error) {
      console.warn('[IM groupStore] 群事件内容解析失败', { groupId, type }, error)
      return
    }
    reloadQueued ||= !!loadTask
    if (detailLoadTasks.has(groupId)) {
      detailReloadQueued.add(groupId)
    }
    switch (type) {
      case ImMessageType.GROUP_CREATE:
        await applyGroupCreateNotification(groupId, payload)
        break
      case ImMessageType.GROUP_NAME_UPDATE:
        applyGroupNameUpdateNotification(groupId, payload)
        break
      case ImMessageType.GROUP_NOTICE_UPDATE:
        applyGroupNoticeUpdateNotification(groupId, payload)
        break
      case ImMessageType.GROUP_INFO_UPDATE:
        applyGroupInfoUpdateNotification(groupId, payload)
        break
      case ImMessageType.GROUP_DISSOLVE:
        removeGroup(groupId)
        break
      case ImMessageType.GROUP_MEMBER_INVITE:
        await applyGroupMemberInviteNotification(groupId, payload)
        break
      case ImMessageType.GROUP_MEMBER_ENTER:
        await applyGroupMemberEnterNotification(groupId, payload)
        break
      case ImMessageType.GROUP_MEMBER_QUIT:
        applyGroupMemberQuitNotification(groupId, payload)
        break
      case ImMessageType.GROUP_MEMBER_KICK:
        applyGroupMemberKickNotification(groupId, payload)
        break
      case ImMessageType.GROUP_MEMBER_NICKNAME_UPDATE:
        applyGroupMemberNicknameUpdateNotification(groupId, payload)
        break
      case ImMessageType.GROUP_ADMIN_ADD:
        updateGroupMemberRoleList(
          groupId,
          payload.memberUserIds || [],
          ImGroupMemberRole.ADMIN,
        )
        if (isSelfInMembers(payload)) {
          refreshGroupRequests()
        }
        markGroupMembersExpired(groupId)
        break
      case ImMessageType.GROUP_ADMIN_REMOVE:
        updateGroupMemberRoleList(
          groupId,
          payload.memberUserIds || [],
          ImGroupMemberRole.NORMAL,
        )
        if (isSelfInMembers(payload)) {
          refreshGroupRequests()
        }
        markGroupMembersExpired(groupId)
        break
      case ImMessageType.GROUP_OWNER_TRANSFER:
        applyGroupOwnerTransferNotification(groupId, payload)
        break
      case ImMessageType.GROUP_MESSAGE_PIN:
        applyGroupMessagePinNotification(groupId, payload)
        break
      case ImMessageType.GROUP_MESSAGE_UNPIN:
        applyGroupMessageUnpinNotification(groupId, payload)
        break
      case ImMessageType.GROUP_MEMBER_MUTED:
        applyGroupMemberMutedNotification(groupId, payload)
        break
      case ImMessageType.GROUP_MEMBER_CANCEL_MUTED:
        applyGroupMemberCancelMutedNotification(groupId, payload)
        break
      case ImMessageType.GROUP_MUTED:
        updateGroupFields(groupId, { mutedAll: true })
        break
      case ImMessageType.GROUP_CANCEL_MUTED:
        updateGroupFields(groupId, { mutedAll: false })
        break
      case ImMessageType.GROUP_BANNED:
        updateGroupFields(groupId, { banned: !!payload.banned })
        break
    }
  }

  /** 清理群聊内存状态 */
  function clear() {
    loadEpoch++
    groups.value = []
    loaded.value = false
    loading.value = false
    stateUserId = 0
    loadTask = undefined
    loadTaskUserId = 0
    memberLoadTasks.clear()
    singleMemberLoadTasks.clear()
    detailLoadTasks.clear()
    detailLoadedGroupIds.clear()
    reloadQueued = false
    memberReloadQueued.clear()
    detailReloadQueued.clear()
    groupMembersExpired = false
  }

  /** 收到群关系变化时刷新列表 */
  function handleReload() {
    void fetchGroupList(true).catch(() => undefined)
  }

  /** 收到群详情变化时刷新已缓存成员 */
  function handleDetailReload(groupId?: number) {
    if (!groupId) {
      return
    }
    if (getGroup(groupId)?.membersLoaded) {
      void fetchGroupMemberList(groupId, true).catch(() => undefined)
    }
    if (getGroup(groupId)) {
      void fetchGroupInfo(groupId, true).catch(() => undefined)
    }
  }

  uni.$on('im:groups:reload', handleReload)
  uni.$on('im:group-detail:reload', handleDetailReload)
  uni.$on('auth:logout', clear)

  return {
    groups,
    loaded,
    loading,
    loadGroupList,
    loadGroupMemberList,
    fetchGroupList,
    fetchGroupInfo,
    fetchGroupMemberList,
    fetchGroupMember,
    getGroup,
    markAllGroupInfoExpired,
    markAllGroupMembersExpired,
    markAllGroupActiveCallsExpired,
    markGroupActiveCallLoaded,
    upsertGroup,
    setGroupSilent,
    updateMyGroupMember,
    transferGroupOwner,
    updateGroupFields,
    removeGroup,
    applyGroupNotification,
    clear,
  }
})

/** 后端群响应转换为本地域模型 */
function convertGroup(group: ImGroupRespVO): Group {
  return {
    id: group.id,
    name: group.name,
    avatar: group.avatar,
    notice: group.notice,
    ownerUserId: group.ownerUserId,
    pinnedMessages: group.pinnedMessages?.map(convertGroupMessage),
    mutedAll: group.mutedAll,
    banned: group.banned,
    joinApproval: group.joinApproval,
    joinStatus: group.joinStatus,
    groupRemark: group.groupRemark,
    silent: group.silent,
  }
}

/** 后端群消息响应转换为本地消息 */
function convertGroupMessage(message: ImGroupMessageRespVO): Message {
  const currentUserId = useUserStore().userInfo.userId
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
