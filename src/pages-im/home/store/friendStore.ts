import type { ImFriendRespVO } from '@/api/im/friend'
import type { ImFriendRequestApplyReq, ImFriendRequestRespVO } from '@/api/im/friend/request'
import type { Friend, FriendDO, FriendLite, FriendRequest, FriendRequestDO } from '../types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  blockFriend as blockFriendApi,
  deleteFriend as deleteFriendApi,
  getFriend as getFriendApi,
  getMyFriendList,
  pullMyFriendList,
  unblockFriend as unblockFriendApi,
  updateFriend as updateFriendApi,
} from '@/api/im/friend'
import {
  agreeFriendRequest as apiAgreeFriendRequest,
  refuseFriendRequest as apiRefuseFriendRequest,
  applyFriendRequest as applyFriendRequestApi,
  getMyFriendRequest,
  getMyFriendRequestList,
  pullMyFriendRequestList,
} from '@/api/im/friend/request'
import { FRIEND_REQUEST_PAGE_SIZE } from '@/pages-im/utils/config'
import { getDb, initDb, StorageKeys } from '@/pages-im/utils/db'
import { runIncrementalPull } from '@/pages-im/utils/pull'
import { getFriendDisplayName } from '@/pages-im/utils/user'
import { useUserStore } from '@/store/user'
import {
  CommonStatusEnum,
  ImConversationType,
  ImFriendRequestHandleResult,
} from '@/pages-im/utils/constants'
import { useConversationStore } from './conversationStore'

/** 好友关系通知内容；字段对齐后端 BaseFriendNotification 子类 */
export interface FriendNotificationPayload {
  operatorUserId: number
  friendUserId: number
  requestId?: number
  applyContent?: string
  handleContent?: string
  addSource?: number
  fromNickname?: string
  fromAvatar?: string
  displayName?: string
  silent?: boolean
  pinned?: boolean
  clear?: boolean
}

/** IM 好友 Store */
export const useFriendStore = defineStore('imFriendStore', () => {
  const friends = ref<Friend[]>([]) // 当前账号好友列表
  const loaded = ref(false) // 是否已从服务端加载好友列表
  const friendRequests = ref<FriendRequest[]>([]) // 当前账号好友申请
  const loading = ref(false) // 好友加载状态
  const requestLoading = ref(false) // 好友申请刷新状态
  const requestLoadingMore = ref(false) // 好友申请加载更多状态
  const hasMoreFriendRequests = ref(true) // 是否还有更早的好友申请
  let stateUserId = 0 // 当前内存数据所属用户
  let loadEpoch = 0 // 加载轮次
  let loadTask: Promise<Friend[]> | undefined // 当前加载任务
  let loadTaskUserId = 0 // 当前加载任务所属用户
  let requestTask: Promise<FriendRequest[]> | undefined // 当前申请加载任务
  let friendPullTask: Promise<Friend[]> | undefined // 好友增量拉取任务
  let requestPullTask: Promise<FriendRequest[]> | undefined // 好友申请增量拉取任务
  const detailLoadTasks = new Map<number, Promise<Friend | undefined>>() // 好友详情加载任务
  let reloadQueued = false // 当前好友加载完成后是否强制刷新

  const getActiveFriendList = computed(() => friends.value.filter(friend => friend.status !== CommonStatusEnum.DISABLE)) // 当前有效好友
  const getFriendMap = computed(() => new Map(friends.value.map(friend => [friend.friendUserId, friend]))) // 好友编号索引
  const getActiveFriendLiteList = computed<FriendLite[]>(() => getActiveFriendList.value.map(friend => ({ // 当前有效好友精简列表
    id: friend.friendUserId,
    nickname: friend.nickname,
    nicknamePinyin: friend.nicknamePinyin,
    avatar: friend.avatar,
    displayName: friend.displayName,
    displayNamePinyin: friend.displayNamePinyin,
  })))
  const getBlockedFriendList = computed(() => friends.value.filter(friend => // 当前黑名单
    friend.status !== CommonStatusEnum.DISABLE && friend.blocked === true))
  const getUnhandledRequestCount = computed(() => { // 当前收到的未处理好友申请数
    const userId = useUserStore().userInfo.userId
    return friendRequests.value.filter(request =>
      request.handleResult === ImFriendRequestHandleResult.UNHANDLED && request.toUserId === userId).length
  })

  /** 从本地库恢复好友和好友申请 */
  async function loadFriendData(): Promise<boolean> {
    try {
      const userId = useUserStore().userInfo.userId
      if (stateUserId !== userId) {
        clear()
        stateUserId = userId
      }
      await initDb()
      const [cachedFriends, cachedRequests] = await Promise.all([
        getDb().getAll<FriendDO>('friends'),
        getDb().getAll<FriendRequestDO>('friendRequests'),
      ])
      if (cachedFriends.length > 0) {
        friends.value = cachedFriends.map(normalizeCachedFriend)
      }
      if (cachedRequests.length > 0) {
        friendRequests.value = cachedRequests
          .map(normalizeCachedFriendRequest)
          .sort((left, right) => right.id - left.id)
        hasMoreFriendRequests.value = cachedRequests.length >= FRIEND_REQUEST_PAGE_SIZE
      }
      return cachedFriends.length > 0
    } catch (error) {
      console.warn('[IM friendStore] 本地好友缓存读取失败', error)
      return false
    }
  }

  /** 保存好友列表 */
  function saveFriendList(): void {
    void (async () => {
      await initDb()
      const db = getDb()
      await db.clearStore('friends')
      await db.bulkPut<FriendDO>('friends', friends.value.filter(friend => !!friend.id))
    })().catch(error => console.warn('[IM friendStore] 本地好友缓存写入失败', error))
  }

  /** 保存单个好友 */
  async function saveFriendRecord(friend: Friend | undefined): Promise<void> {
    if (!friend?.id) {
      return
    }
    await initDb()
    await getDb().put('friends', friend)
  }

  /** 异步保存单个好友 */
  function saveFriend(friend: Friend | undefined): void {
    void saveFriendRecord(friend).catch(error =>
      console.warn('[IM friendStore] 本地好友写入失败', error))
  }

  /** 保存好友申请列表 */
  function saveFriendRequestList(): void {
    void (async () => {
      await initDb()
      const db = getDb()
      await db.clearStore('friendRequests')
      await db.bulkPut<FriendRequestDO>('friendRequests', friendRequests.value)
    })().catch(error => console.warn('[IM friendStore] 本地好友申请缓存写入失败', error))
  }

  /** 保存单条好友申请 */
  async function saveFriendRequestRecord(request: FriendRequest | undefined): Promise<void> {
    if (!request) {
      return
    }
    await initDb()
    await getDb().put('friendRequests', request)
  }

  /** 异步保存单条好友申请 */
  function saveFriendRequest(request: FriendRequest | undefined): void {
    void saveFriendRequestRecord(request).catch(error =>
      console.warn('[IM friendStore] 本地好友申请写入失败', error))
  }

  /** 发起好友申请 */
  async function applyFriendRequest(data: ImFriendRequestApplyReq) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    const id = await applyFriendRequestApi(data)
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return null
    }
    return id
  }

  /** 加载好友列表 */
  function fetchFriendList(force = false): Promise<Friend[]> {
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
      return Promise.resolve(friends.value)
    }
    if (loadTask && loadTaskUserId === userId) {
      reloadQueued ||= force
      return loadTask
    }
    const epoch = loadEpoch
    const isActive = () => epoch === loadEpoch && useUserStore().userInfo.userId === userId
    loading.value = true
    const task = (async () => {
      const rows = (await getMyFriendList()).map(convertFriend)
      if (!isActive()) {
        return []
      }
      friends.value = rows
      loaded.value = true
      for (const friend of friends.value) {
        if (friend.status !== CommonStatusEnum.DISABLE) {
          syncFriendConversation(friend)
        }
      }
      saveFriendList()
      return friends.value
    })().finally(() => {
      if (loadTask === task) {
        const shouldReload = reloadQueued && useUserStore().userInfo.userId === userId
        loadTask = undefined
        loadTaskUserId = 0
        loading.value = false
        reloadQueued = false
        if (shouldReload) {
          void fetchFriendList(true).catch(() => undefined)
        }
      }
    })
    loadTask = task
    loadTaskUserId = userId
    return task
  }

  /** 按用户编号获取好友 */
  function getFriend(friendUserId: number) {
    return getFriendMap.value.get(friendUserId)
  }

  /** 增量拉取好友关系 */
  function pullFriends(): Promise<Friend[]> {
    const userId = useUserStore().userInfo.userId
    if (userId <= 0) {
      return Promise.resolve([])
    }
    if (stateUserId !== userId) {
      clear()
      stateUserId = userId
    }
    if (friendPullTask) {
      return friendPullTask
    }
    const epoch = loadEpoch
    const isActive = () => epoch === loadEpoch && useUserStore().userInfo.userId === userId
    const task = (async () => {
      if (loadTask) {
        await loadTask
      }
      if (!isActive()) {
        return []
      }
      await initDb()
      await runIncrementalPull(
        StorageKeys.settings.friendPullCursor,
        params => pullMyFriendList(params),
        async (records) => {
          const converted = records.map(convertFriend)
          if (!isActive()) {
            return false
          }
          await Promise.all(converted.map(friend => upsertFriendForPull(friend)))
          return true
        },
        isActive,
      )
      if (isActive()) {
        loaded.value = true
      }
      return isActive() ? friends.value : []
    })().finally(() => {
      if (friendPullTask === task) {
        friendPullTask = undefined
      }
    })
    friendPullTask = task
    return task
  }

  /** 加载好友详情 */
  function fetchFriendInfo(friendUserId: number): Promise<Friend | undefined> {
    const userId = useUserStore().userInfo.userId
    if (userId <= 0 || friendUserId <= 0) {
      return Promise.resolve(undefined)
    }
    if (stateUserId !== userId) {
      clear()
      stateUserId = userId
    }
    const pending = detailLoadTasks.get(friendUserId)
    if (pending) {
      return pending
    }
    const epoch = loadEpoch
    const task = (async () => {
      const friend = convertFriend(await getFriendApi(friendUserId))
      if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
        return undefined
      }
      const index = friends.value.findIndex(item => item.friendUserId === friendUserId)
      if (index >= 0) {
        friends.value[index] = friend
      } else {
        friends.value.push(friend)
      }
      syncFriendConversation(friend)
      await initDb()
      if (epoch === loadEpoch && useUserStore().userInfo.userId === userId) {
        await getDb().put('friends', friend)
      }
      return friend
    })().finally(() => {
      if (detailLoadTasks.get(friendUserId) === task) {
        detailLoadTasks.delete(friendUserId)
      }
    })
    detailLoadTasks.set(friendUserId, task)
    return task
  }

  /** 切换好友免打扰 */
  async function setFriendSilent(friendUserId: number, silent: boolean) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    await updateFriendApi({ friendUserId, silent })
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return false
    }
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.silent = silent
      useConversationStore().updateConversation(ImConversationType.PRIVATE, friendUserId, { silent })
      saveFriend(friend)
    }
    return true
  }

  /** 切换联系人置顶 */
  async function setFriendPinned(friendUserId: number, pinned: boolean) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    await updateFriendApi({ friendUserId, pinned })
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return false
    }
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.pinned = pinned
      saveFriend(friend)
    }
    return true
  }

  /** 拉黑好友 */
  async function blockFriend(friendUserId: number) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    await blockFriendApi(friendUserId)
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return false
    }
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.blocked = true
      saveFriend(friend)
    }
    return true
  }

  /** 移出黑名单 */
  async function unblockFriend(friendUserId: number) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    await unblockFriendApi(friendUserId)
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return false
    }
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.blocked = false
      saveFriend(friend)
    }
    return true
  }

  /** 修改好友展示备注 */
  async function setFriendDisplayName(friendUserId: number, displayName: string) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    const value = displayName.trim()
    await updateFriendApi({ friendUserId, displayName: value })
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return false
    }
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.displayName = value
      useConversationStore().updateConversation(ImConversationType.PRIVATE, friendUserId, {
        name: getFriendDisplayName(friend),
      })
      saveFriend(friend)
    }
    return true
  }

  /** 删除好友 */
  async function deleteFriend(friendUserId: number, clear = true) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    await deleteFriendApi(friendUserId, clear)
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return false
    }
    removeFriend(friendUserId, clear)
    return true
  }

  /** 拉取好友申请首页 */
  function fetchFriendRequestList(): Promise<FriendRequest[]> {
    const userId = useUserStore().userInfo.userId
    if (userId <= 0) {
      clear()
      return Promise.resolve([])
    }
    if (stateUserId !== userId) {
      clear()
      stateUserId = userId
    }
    if (requestTask) {
      return requestTask
    }
    const epoch = loadEpoch
    const isActive = () => epoch === loadEpoch && useUserStore().userInfo.userId === userId
    requestLoading.value = true
    const task = (async () => {
      const rows = (await getMyFriendRequestList(FRIEND_REQUEST_PAGE_SIZE)).map(convertFriendRequest)
      if (!isActive()) {
        return []
      }
      friendRequests.value = rows
      hasMoreFriendRequests.value = rows.length === FRIEND_REQUEST_PAGE_SIZE
      saveFriendRequestList()
      return rows
    })().finally(() => {
      if (requestTask === task) {
        requestTask = undefined
        requestLoading.value = false
      }
    })
    requestTask = task
    return task
  }

  /** 加载更多好友申请 */
  function loadMoreFriendRequestList(): Promise<FriendRequest[]> {
    const userId = useUserStore().userInfo.userId
    if (!hasMoreFriendRequests.value || requestTask) {
      return Promise.resolve([])
    }
    const oldest = friendRequests.value[friendRequests.value.length - 1]
    if (!oldest) {
      return fetchFriendRequestList()
    }
    const epoch = loadEpoch
    const isActive = () => epoch === loadEpoch && useUserStore().userInfo.userId === userId
    requestLoadingMore.value = true
    const task = (async () => {
      const rows = (await getMyFriendRequestList(FRIEND_REQUEST_PAGE_SIZE, oldest.id))
        .map(convertFriendRequest)
      if (!isActive()) {
        return []
      }
      friendRequests.value.push(...rows)
      hasMoreFriendRequests.value = rows.length === FRIEND_REQUEST_PAGE_SIZE
      saveFriendRequestList()
      return rows
    })().finally(() => {
      if (requestTask === task) {
        requestTask = undefined
        requestLoadingMore.value = false
      }
    })
    requestTask = task
    return task
  }

  /** 按编号获取好友申请 */
  function getFriendRequest(requestId: number) {
    return friendRequests.value.find(request => request.id === requestId)
  }

  /** 按编号拉取好友申请 */
  async function fetchFriendRequest(requestId: number) {
    const requestEpoch = loadEpoch
    const requestUserId = useUserStore().userInfo.userId
    const data = await getMyFriendRequest(requestId)
    if (!data || requestEpoch !== loadEpoch || useUserStore().userInfo.userId !== requestUserId) {
      return
    }
    upsertFriendRequest(convertFriendRequest(data))
  }

  /** 本地合并单条好友申请 */
  function upsertFriendRequest(next: FriendRequest) {
    void upsertFriendRequestForPull(next).catch(error =>
      console.warn('[IM friendStore] 本地好友申请写入失败', error))
  }

  /** 增量拉取时合并单条好友申请 */
  async function upsertFriendRequestForPull(next: FriendRequest): Promise<void> {
    const existing = getFriendRequest(next.id)
    if (existing) {
      Object.assign(existing, next)
      await saveFriendRequestRecord(existing)
      return
    }
    const oldest = friendRequests.value[friendRequests.value.length - 1]
    if (oldest && next.id < oldest.id) {
      return
    }
    const insertIndex = friendRequests.value.findIndex(request => request.id < next.id)
    if (insertIndex < 0) {
      friendRequests.value.push(next)
    } else {
      friendRequests.value.splice(insertIndex, 0, next)
    }
    await saveFriendRequestRecord(next)
  }

  /** 增量拉取好友申请 */
  function pullFriendRequests(): Promise<FriendRequest[]> {
    const userId = useUserStore().userInfo.userId
    if (userId <= 0) {
      return Promise.resolve([])
    }
    if (stateUserId !== userId) {
      clear()
      stateUserId = userId
    }
    if (requestPullTask) {
      return requestPullTask
    }
    const epoch = loadEpoch
    const isActive = () => epoch === loadEpoch && useUserStore().userInfo.userId === userId
    const task = (async () => {
      if (requestTask) {
        await requestTask
      }
      if (!isActive()) {
        return []
      }
      await initDb()
      await runIncrementalPull(
        StorageKeys.settings.friendRequestPullCursor,
        params => pullMyFriendRequestList(params),
        async (records) => {
          const converted = records.map(convertFriendRequest)
          if (!isActive()) {
            return false
          }
          await Promise.all(converted.map(request => upsertFriendRequestForPull(request)))
          return true
        },
        isActive,
      )
      return isActive() ? friendRequests.value : []
    })().finally(() => {
      if (requestPullTask === task) {
        requestPullTask = undefined
      }
    })
    requestPullTask = task
    return task
  }

  /** 同意好友申请 */
  async function agreeFriendRequest(id: number) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    await apiAgreeFriendRequest(id)
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return false
    }
    await applyHandleResult(id, ImFriendRequestHandleResult.AGREED)
    return true
  }

  /** 拒绝好友申请 */
  async function refuseFriendRequest(id: number, handleContent?: string) {
    const userId = useUserStore().userInfo.userId
    const epoch = loadEpoch
    await apiRefuseFriendRequest(id, handleContent)
    if (epoch !== loadEpoch || useUserStore().userInfo.userId !== userId) {
      return false
    }
    await applyHandleResult(id, ImFriendRequestHandleResult.REFUSED, handleContent)
    return true
  }

  /** 应用好友申请处理结果 */
  async function applyHandleResult(
    requestId: number,
    result: number,
    handleContent?: string,
  ): Promise<void> {
    const request = getFriendRequest(requestId)
    if (request) {
      request.handleResult = result
      if (handleContent !== undefined) {
        request.handleContent = handleContent
      }
      request.handleTime = Date.now()
      saveFriendRequest(request)
      return
    }
    await fetchFriendRequest(requestId)
  }

  /** 判断是否为当前有效好友 */
  function isActiveFriend(friendUserId: number) {
    const friend = getFriend(friendUserId)
    return !!friend && friend.status !== CommonStatusEnum.DISABLE
  }

  /** 同步好友对应的会话展示字段 */
  function syncFriendConversation(friend: Friend) {
    useConversationStore().updateConversation(ImConversationType.PRIVATE, friend.friendUserId, {
      name: getFriendDisplayName(friend),
      avatar: friend.avatar || '',
      silent: friend.silent,
    })
  }

  /** 本地合并好友关系 */
  function upsertFriend(friend: Friend) {
    void upsertFriendForPull(friend).catch(error =>
      console.warn('[IM friendStore] 本地好友写入失败', error))
  }

  /** 本地合并好友关系 */
  async function upsertFriendForPull(friend: Friend): Promise<void> {
    const index = friends.value.findIndex(item => item.friendUserId === friend.friendUserId)
    const next = {
      ...(index >= 0 ? friends.value[index] : {}),
      ...friend,
      status: friend.status ?? CommonStatusEnum.ENABLE,
    } as Friend
    if (index >= 0) {
      friends.value[index] = next
    } else {
      friends.value.push(next)
    }
    syncFriendConversation(next)
    await saveFriendRecord(next)
  }

  /** 本地软删除好友关系 */
  function removeFriend(friendUserId: number, clear = true) {
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.status = CommonStatusEnum.DISABLE
      friend.deleteTime = Date.now()
      saveFriend(friend)
    }
    if (clear) {
      void useConversationStore().removePrivateConversation(friendUserId)
    }
  }

  /** 收到新的好友申请 */
  function applyFriendRequestReceivedNotification(payload: FriendNotificationPayload) {
    reloadQueued ||= !!loadTask
    const currentUserId = useUserStore().userInfo.userId
    const existingIndex = friendRequests.value.findIndex(item => item.id === payload.requestId)
    if (existingIndex >= 0) {
      const existing = friendRequests.value.splice(existingIndex, 1)[0]
      const next = {
        ...existing,
        fromUserId: payload.operatorUserId,
        toUserId: currentUserId,
        handleResult: ImFriendRequestHandleResult.UNHANDLED,
        applyContent: payload.applyContent,
        addSource: payload.addSource,
        createTime: Date.now(),
        fromNickname: payload.fromNickname,
        fromAvatar: payload.fromAvatar,
      }
      friendRequests.value.unshift(next)
      saveFriendRequest(next)
      return
    }
    const next: FriendRequest = {
      id: payload.requestId!,
      fromUserId: payload.operatorUserId,
      toUserId: currentUserId,
      handleResult: ImFriendRequestHandleResult.UNHANDLED,
      applyContent: payload.applyContent,
      addSource: payload.addSource,
      createTime: Date.now(),
      fromNickname: payload.fromNickname,
      fromAvatar: payload.fromAvatar,
    }
    friendRequests.value.unshift(next)
    saveFriendRequest(next)
  }

  /** 好友申请已同意 */
  function applyFriendRequestApprovedNotification(payload: FriendNotificationPayload) {
    reloadQueued ||= !!loadTask
    void applyHandleResult(payload.requestId!, ImFriendRequestHandleResult.AGREED)
  }

  /** 好友申请已拒绝 */
  function applyFriendRequestRejectedNotification(payload: FriendNotificationPayload) {
    reloadQueued ||= !!loadTask
    void applyHandleResult(
      payload.requestId!,
      ImFriendRequestHandleResult.REFUSED,
      payload.handleContent,
    )
  }

  /** 双方成为好友 */
  function applyFriendAddNotification(_payload: FriendNotificationPayload, peerUserId: number) {
    reloadQueued ||= !!loadTask
    if (!isActiveFriend(peerUserId)) {
      void fetchFriendInfo(peerUserId).catch(() => undefined)
    }
  }

  /** 好友关系已删除 */
  function applyFriendDeleteNotification(payload: FriendNotificationPayload, peerUserId: number) {
    reloadQueued ||= !!loadTask
    removeFriend(peerUserId, payload.clear !== false)
  }

  /** 好友已被拉黑 */
  function applyFriendBlockNotification(payload: FriendNotificationPayload) {
    reloadQueued ||= !!loadTask
    const friend = getFriend(payload.friendUserId)
    if (friend) {
      friend.blocked = true
      saveFriend(friend)
    }
  }

  /** 好友已移出黑名单 */
  function applyFriendUnblockNotification(payload: FriendNotificationPayload) {
    reloadQueued ||= !!loadTask
    const friend = getFriend(payload.friendUserId)
    if (friend) {
      friend.blocked = false
      saveFriend(friend)
    }
  }

  /** 好友基础资料已更新 */
  function applyFriendInfoUpdatedNotification(payload: FriendNotificationPayload) {
    reloadQueued ||= !!loadTask
    void fetchFriendInfo(payload.friendUserId).catch(() => undefined)
  }

  /** 好友个人设置已更新 */
  function applyFriendUpdateNotification(payload: FriendNotificationPayload) {
    reloadQueued ||= !!loadTask
    const friend = getFriend(payload.friendUserId)
    if (!friend) {
      return
    }
    if (payload.displayName != null) {
      friend.displayName = payload.displayName
    }
    if (payload.silent != null) {
      friend.silent = payload.silent
    }
    if (payload.pinned != null) {
      friend.pinned = payload.pinned
    }
    syncFriendConversation(friend)
    saveFriend(friend)
  }

  /** 清理好友内存状态 */
  function clear() {
    loadEpoch++
    friends.value = []
    friendRequests.value = []
    loaded.value = false
    loading.value = false
    requestLoading.value = false
    requestLoadingMore.value = false
    hasMoreFriendRequests.value = true
    stateUserId = 0
    loadTask = undefined
    loadTaskUserId = 0
    requestTask = undefined
    friendPullTask = undefined
    requestPullTask = undefined
    detailLoadTasks.clear()
    reloadQueued = false
  }

  /** 收到好友关系变化时刷新列表 */
  function handleReload() {
    void fetchFriendList(true).catch(() => undefined)
  }

  /** 收到申请变化时刷新列表 */
  function handleRequestReload() {
    void fetchFriendRequestList().catch(() => undefined)
  }

  uni.$on('im:friends:reload', handleReload)
  uni.$on('im:requests:reload', handleRequestReload)
  uni.$on('auth:logout', clear)

  return {
    // TODO @AI：有一些方法没在用，是因为没迁移么？
    //     loadFriendData,
    //     saveFriendList,
    //     saveFriendRecord,
    //     saveFriend,
    //     saveFriendRequestList,
    //     saveFriendRequestRecord,
    //     saveFriendRequest,    setFriendPinned,    getFriendRequest,
    //     fetchFriendRequest,
    //     upsertFriendRequest,
    //     upsertFriendRequestForPull,    upsertFriend,
    //     upsertFriendForPull,
    //     removeFriend,    applyHandleResult,
    friends,
    loaded,
    friendRequests,
    getFriendMap,
    getActiveFriendList,
    getActiveFriendLiteList,
    getBlockedFriendList,
    getUnhandledRequestCount,
    loading,
    requestLoading,
    requestLoadingMore,
    hasMoreFriendRequests,
    loadFriendData,
    saveFriendList,
    saveFriendRecord,
    saveFriend,
    saveFriendRequestList,
    saveFriendRequestRecord,
    saveFriendRequest,
    fetchFriendList,
    applyFriendRequest,
    pullFriends,
    fetchFriendInfo,
    setFriendSilent,
    setFriendPinned,
    setFriendDisplayName,
    blockFriend,
    unblockFriend,
    deleteFriend,
    fetchFriendRequestList,
    loadMoreFriendRequestList,
    getFriendRequest,
    fetchFriendRequest,
    upsertFriendRequest,
    upsertFriendRequestForPull,
    pullFriendRequests,
    agreeFriendRequest,
    refuseFriendRequest,
    applyHandleResult,
    getFriend,
    isActiveFriend,
    upsertFriend,
    upsertFriendForPull,
    removeFriend,
    applyFriendRequestReceivedNotification,
    applyFriendRequestApprovedNotification,
    applyFriendRequestRejectedNotification,
    applyFriendAddNotification,
    applyFriendDeleteNotification,
    applyFriendBlockNotification,
    applyFriendUnblockNotification,
    applyFriendInfoUpdatedNotification,
    applyFriendUpdateNotification,
    clear,
  }
})

/** 后端好友响应转换为本地域模型 */
function convertFriend(friend: ImFriendRespVO): Friend {
  return {
    id: friend.id,
    friendUserId: friend.friendUserId,
    nickname: friend.nickname || String(friend.friendUserId),
    nicknamePinyin: friend.nicknamePinyin,
    avatar: friend.avatar,
    silent: !!friend.silent,
    displayName: friend.displayName || '',
    displayNamePinyin: friend.displayNamePinyin,
    addSource: friend.addSource,
    pinned: !!friend.pinned,
    blocked: !!friend.blocked,
    status: friend.status,
    addTime: friend.addTime ? new Date(friend.addTime).getTime() : undefined,
    deleteTime: friend.deleteTime ? new Date(friend.deleteTime).getTime() : undefined,
  }
}

/** 兼容旧缓存里的字符串时间和缺失昵称 */
// TODO @AI：是不是不用考虑旧缓存？因为还没上线。可以都处理掉；
function normalizeCachedFriend(friend: Friend): Friend {
  const cached = friend as Friend & { addTime?: number | string, deleteTime?: number | string }
  return {
    ...friend,
    nickname: friend.nickname || String(friend.friendUserId),
    addTime: toLocalTime(cached.addTime),
    deleteTime: toLocalTime(cached.deleteTime),
  }
}

/** 后端好友申请响应转换为本地域模型 */
function convertFriendRequest(request: ImFriendRequestRespVO): FriendRequest {
  return {
    id: request.id,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    handleResult: request.handleResult,
    applyContent: request.applyContent,
    handleContent: request.handleContent,
    addSource: request.addSource,
    handleTime: request.handleTime ? new Date(request.handleTime).getTime() : undefined,
    createTime: request.createTime ? new Date(request.createTime).getTime() : 0,
    fromNickname: request.fromNickname,
    fromAvatar: request.fromAvatar,
    toNickname: request.toNickname,
    toAvatar: request.toAvatar,
  }
}

/** 兼容旧缓存里的字符串申请时间 */
// TODO @AI：是不是不用考虑旧缓存？因为还没上线。可以都处理掉；
function normalizeCachedFriendRequest(request: FriendRequest): FriendRequest {
  const cached = request as FriendRequest & {
    handleTime?: number | string
    createTime: number | string
  }
  return {
    ...request,
    handleTime: toLocalTime(cached.handleTime),
    createTime: toLocalTime(cached.createTime) || 0,
  }
}

// TODO @AI：是不是应该使用全局的方法；如果没有，感觉要封装下；
/** 接口时间或旧缓存时间转换为毫秒时间戳 */
function toLocalTime(value?: number | string) {
  return typeof value === 'number' ? value : value ? new Date(value).getTime() : undefined
}
