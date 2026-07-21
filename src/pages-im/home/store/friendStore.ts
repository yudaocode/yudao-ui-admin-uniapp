import type { ImFriendRespVO } from '@/api/im/friend'
import type { ImFriendRequestApplyReq, ImFriendRequestRespVO } from '@/api/im/friend/request'
import type { ImDbClient } from '@/pages-im/utils/db'
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
import {
  enqueueResourceWrite,
  isResourceRequestPending,
  ResourceRequestKey,
  ResourceRequestMode,
  ResourceWriteKey,
  runResourceRequest,
} from '@/pages-im/utils/resourceRequest'

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
  let loaded = false // 是否已从服务端加载好友列表
  const friendRequests = ref<FriendRequest[]>([]) // 当前账号好友申请
  const loading = ref(false) // 好友加载状态
  const requestLoading = ref(false) // 好友申请刷新状态
  const requestLoadingMore = ref(false) // 好友申请加载更多状态
  const hasMoreFriendRequests = ref(true) // 是否还有更早的好友申请
  let requestTask: Promise<FriendRequest[]> | undefined // 当前申请加载任务
  let friendPullTask: Promise<Friend[]> | undefined // 好友增量拉取任务
  let requestPullTask: Promise<FriendRequest[]> | undefined // 好友申请增量拉取任务
  const detailLoadTasks = new Map<number, Promise<Friend | undefined>>() // 好友详情加载任务

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
  const getUnhandledRequestCount = computed(() => { // 当前收到的未处理好友申请数
    const userId = useUserStore().userInfo.userId
    return friendRequests.value.filter(request =>
      request.handleResult === ImFriendRequestHandleResult.UNHANDLED && request.toUserId === userId).length
  })

  /** 从本地库恢复好友和好友申请 */
  async function loadFriendData(): Promise<void> {
    try {
      const db = await initDb()
      const [cachedFriends, cachedRequests] = await Promise.all([
        db.getAll<FriendDO>('friends'),
        db.getAll<FriendRequestDO>('friendRequests'),
      ])
      if (cachedFriends.length > 0) {
        friends.value = cachedFriends
      }
      if (cachedRequests.length > 0) {
        friendRequests.value = cachedRequests
          .sort((left, right) => right.id - left.id)
        hasMoreFriendRequests.value = cachedRequests.length >= FRIEND_REQUEST_PAGE_SIZE
      }
    } catch (error) {
      console.warn('[IM friendStore] 本地好友缓存读取失败', error)
    }
  }

  /** 保存好友列表 */
  async function saveFriendList(
    rows: Friend[],
    db: ImDbClient,
  ): Promise<void> {
    await db.clearStore('friends')
    await db.bulkPut<FriendDO>('friends', rows.filter(friend => !!friend.id))
  }

  /** 保存单个好友 */
  async function saveFriendRecord(
    friend: Friend | undefined,
    db: ImDbClient,
  ): Promise<void> {
    if (!friend?.id) {
      return
    }
    await db.put('friends', friend)
  }

  /** 异步保存单个好友 */
  function saveFriend(
    friend: Friend | undefined,
    db: ImDbClient = getDb(),
  ): void {
    void saveFriendRecord(friend, db).catch(error =>
      console.warn('[IM friendStore] 本地好友写入失败', error))
  }

  /** 保存好友申请列表 */
  function saveFriendRequestList(
    rows: FriendRequest[],
    db: ImDbClient,
  ): void {
    void enqueueResourceWrite(ResourceWriteKey.FRIEND_REQUEST_LIST, async () => {
      await db.clearStore('friendRequests')
      await db.bulkPut<FriendRequestDO>('friendRequests', rows)
    }).catch(error => console.warn('[IM friendStore] 本地好友申请缓存写入失败', error))
  }

  /** 保存单条好友申请 */
  async function saveFriendRequestRecord(
    request: FriendRequest | undefined,
    db: ImDbClient,
  ): Promise<void> {
    if (!request) {
      return
    }
    await enqueueResourceWrite(ResourceWriteKey.FRIEND_REQUEST_LIST, () =>
      db.put('friendRequests', request))
  }

  /** 异步保存单条好友申请 */
  function saveFriendRequest(
    request: FriendRequest | undefined,
    db: ImDbClient = getDb(),
  ): void {
    void saveFriendRequestRecord(request, db).catch(error =>
      console.warn('[IM friendStore] 本地好友申请写入失败', error))
  }

  /** 发起好友申请 */
  function applyFriendRequest(
    data: ImFriendRequestApplyReq,
  ) {
    return applyFriendRequestApi(data)
  }

  /** 加载好友列表 */
  async function fetchFriendList(
    force = false,
  ): Promise<Friend[]> {
    if (!force && loaded) {
      return friends.value
    }
    return runResourceRequest(ResourceRequestKey.FRIEND_LIST, async () => {
      const db = await initDb()
      loading.value = true
      try {
        const rows = (await getMyFriendList()).map(convertFriend)
        friends.value = rows
        loaded = true
        for (const friend of friends.value) {
          if (friend.status !== CommonStatusEnum.DISABLE) {
            syncFriendConversation(friend, db)
          }
        }
        await saveFriendList(rows, db).catch(error =>
          console.warn('[IM friendStore] 本地好友缓存写入失败', error))
        return rows
      } finally {
        loading.value = false
      }
    }, { mode: ResourceRequestMode.SINGLE_FLIGHT, refreshAfterPending: force })
  }

  /** 按用户编号获取好友 */
  function getFriend(friendUserId: number) {
    return getFriendMap.value.get(friendUserId)
  }

  /** 增量拉取好友关系 */
  function pullFriends(): Promise<Friend[]> {
    if (friendPullTask) {
      return friendPullTask
    }
    const task = (async () => {
      const db = await initDb()
      await fetchFriendList(false)
      await runIncrementalPull(db, StorageKeys.settings.friendPullCursor, params => pullMyFriendList(params), async (records) => {
        const converted = records.map(convertFriend)
        await Promise.all(converted.map(friend => upsertFriendForPull(friend, db)))
        return true
      })
      loaded = true
      return friends.value
    })().finally(() => {
      if (friendPullTask === task) {
        friendPullTask = undefined
      }
    })
    friendPullTask = task
    return task
  }

  /** 加载好友详情 */
  function fetchFriendInfo(
    friendUserId: number,
  ): Promise<Friend | undefined> {
    if (friendUserId <= 0) {
      return Promise.resolve(undefined)
    }
    const pending = detailLoadTasks.get(friendUserId)
    if (pending) {
      return pending
    }
    const task = (async () => {
      const db = await initDb()
      const friend = convertFriend(await getFriendApi(friendUserId))
      const index = friends.value.findIndex(item => item.friendUserId === friendUserId)
      if (index >= 0) {
        friends.value[index] = friend
      } else {
        friends.value.push(friend)
      }
      syncFriendConversation(friend, db)
      await db.put('friends', friend)
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
    const db = await initDb()
    await updateFriendApi({ friendUserId, silent })
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.silent = silent
      useConversationStore().updateConversation(
        ImConversationType.PRIVATE,
        friendUserId,
        { silent },
        db,
      )
      saveFriend(friend, db)
    }
    return true
  }

  /** 拉黑好友 */
  async function blockFriend(friendUserId: number) {
    const db = await initDb()
    await blockFriendApi(friendUserId)
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.blocked = true
      saveFriend(friend, db)
    }
    return true
  }

  /** 移出黑名单 */
  async function unblockFriend(friendUserId: number) {
    const db = await initDb()
    await unblockFriendApi(friendUserId)
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.blocked = false
      saveFriend(friend, db)
    }
    return true
  }

  /** 修改好友展示备注 */
  async function setFriendDisplayName(friendUserId: number, displayName: string) {
    const value = displayName.trim()
    const db = await initDb()
    await updateFriendApi({ friendUserId, displayName: value })
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.displayName = value
      useConversationStore().updateConversation(ImConversationType.PRIVATE, friendUserId, {
        name: getFriendDisplayName(friend),
      }, db)
      saveFriend(friend, db)
    }
    return true
  }

  /** 删除好友 */
  async function deleteFriend(
    friendUserId: number,
    clear = true,
    db: ImDbClient = getDb(),
  ) {
    await deleteFriendApi(friendUserId, clear)
    removeFriend(friendUserId, clear, db)
    return true
  }

  /** 拉取好友申请首页 */
  function fetchFriendRequestList(): Promise<FriendRequest[]> {
    if (requestTask) {
      return requestTask
    }
    requestLoading.value = true
    const task = (async () => {
      const db = await initDb()
      const rows = (await getMyFriendRequestList(FRIEND_REQUEST_PAGE_SIZE)).map(convertFriendRequest)
      friendRequests.value = rows.sort((left, right) => right.id - left.id)
      hasMoreFriendRequests.value = rows.length === FRIEND_REQUEST_PAGE_SIZE
      saveFriendRequestList([...friendRequests.value], db)
      return friendRequests.value
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
    if (!hasMoreFriendRequests.value || requestTask) {
      return Promise.resolve([])
    }
    const oldest = friendRequests.value[friendRequests.value.length - 1]
    if (!oldest) {
      return fetchFriendRequestList()
    }
    requestLoadingMore.value = true
    const task = (async () => {
      const db = await initDb()
      const rows = (await getMyFriendRequestList(FRIEND_REQUEST_PAGE_SIZE, oldest.id))
        .map(convertFriendRequest)
      const currentIds = new Set(friendRequests.value.map(request => request.id))
      const additions = rows.filter(request => !currentIds.has(request.id))
      friendRequests.value.push(...additions)
      hasMoreFriendRequests.value = rows.length === FRIEND_REQUEST_PAGE_SIZE
      saveFriendRequestList([...friendRequests.value], db)
      return additions
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
  async function fetchFriendRequest(
    requestId: number,
    db: ImDbClient,
  ) {
    const data = await getMyFriendRequest(requestId)
    if (!data) {
      return
    }
    await upsertFriendRequestForPull(convertFriendRequest(data), db)
  }

  /** 增量拉取时合并单条好友申请 */
  async function upsertFriendRequestForPull(
    next: FriendRequest,
    db: ImDbClient,
  ): Promise<void> {
    const existing = getFriendRequest(next.id)
    if (existing) {
      Object.assign(existing, next)
      await saveFriendRequestRecord(existing, db)
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
    await saveFriendRequestRecord(next, db)
  }

  /** 增量拉取好友申请 */
  function pullFriendRequests(): Promise<FriendRequest[]> {
    if (requestPullTask) {
      return requestPullTask
    }
    const task = (async () => {
      const db = await initDb()
      if (requestTask) {
        await requestTask
      }
      await runIncrementalPull(
        db,
        StorageKeys.settings.friendRequestPullCursor,
        params => pullMyFriendRequestList(params),
        async (records) => {
          const converted = records.map(convertFriendRequest)
          await Promise.all(converted.map(request =>
            upsertFriendRequestForPull(request, db)))
          return true
        },
      )
      return friendRequests.value
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
    const db = await initDb()
    await apiAgreeFriendRequest(id)
    await applyHandleResult(id, ImFriendRequestHandleResult.AGREED, undefined, db)
    return true
  }

  /** 拒绝好友申请 */
  async function refuseFriendRequest(id: number, handleContent?: string) {
    const db = await initDb()
    await apiRefuseFriendRequest(id, handleContent)
    await applyHandleResult(id, ImFriendRequestHandleResult.REFUSED, handleContent, db)
    return true
  }

  /** 应用好友申请处理结果 */
  async function applyHandleResult(
    requestId: number,
    result: number,
    handleContent?: string,
    db: ImDbClient = getDb(),
  ): Promise<void> {
    const request = getFriendRequest(requestId)
    if (request) {
      request.handleResult = result
      if (handleContent !== undefined) {
        request.handleContent = handleContent
      }
      request.handleTime = Date.now()
      saveFriendRequest(request, db)
      return
    }
    await fetchFriendRequest(requestId, db)
  }

  /** 判断是否为当前有效好友 */
  function isActiveFriend(friendUserId: number) {
    const friend = getFriend(friendUserId)
    return !!friend && friend.status !== CommonStatusEnum.DISABLE
  }

  /** 同步好友对应的会话展示字段 */
  function syncFriendConversation(friend: Friend, db: ImDbClient) {
    useConversationStore().updateConversation(ImConversationType.PRIVATE, friend.friendUserId, {
      name: getFriendDisplayName(friend),
      avatar: friend.avatar || '',
      silent: friend.silent,
    }, db)
  }

  /** 本地合并好友关系 */
  async function upsertFriendForPull(
    friend: Friend,
    db: ImDbClient,
  ): Promise<void> {
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
    syncFriendConversation(next, db)
    await saveFriendRecord(next, db)
  }

  /** 本地软删除好友关系 */
  function removeFriend(
    friendUserId: number,
    clear = true,
    db: ImDbClient = getDb(),
  ) {
    const friend = getFriend(friendUserId)
    if (friend) {
      friend.status = CommonStatusEnum.DISABLE
      friend.deleteTime = Date.now()
      saveFriend(friend, db)
    }
    if (clear) {
      void useConversationStore()
        .removePrivateConversation(friendUserId, db)
        .catch(error => console.warn('[IM friendStore] 私聊会话删除失败', error))
    }
  }

  /** 在列表拉取期间收到关系事件时合并为一次尾随刷新 */
  function queueFriendListRefreshAfterPending() {
    if (isResourceRequestPending(ResourceRequestKey.FRIEND_LIST)) {
      void fetchFriendList(true).catch(() => undefined)
    }
  }

  /** 收到新的好友申请 */
  function applyFriendRequestReceivedNotification(payload: FriendNotificationPayload) {
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
    void applyHandleResult(payload.requestId!, ImFriendRequestHandleResult.AGREED)
      .catch(error => console.warn('[IM friendStore] 好友申请同意状态写入失败', error))
  }

  /** 好友申请已拒绝 */
  function applyFriendRequestRejectedNotification(payload: FriendNotificationPayload) {
    void applyHandleResult(
      payload.requestId!,
      ImFriendRequestHandleResult.REFUSED,
      payload.handleContent,
    ).catch(error => console.warn('[IM friendStore] 好友申请拒绝状态写入失败', error))
  }

  /** 双方成为好友 */
  function applyFriendAddNotification(_payload: FriendNotificationPayload, peerUserId: number) {
    queueFriendListRefreshAfterPending()
    if (!isActiveFriend(peerUserId)) {
      void fetchFriendInfo(peerUserId).catch(() => undefined)
    }
  }

  /** 好友关系已删除 */
  function applyFriendDeleteNotification(payload: FriendNotificationPayload, peerUserId: number) {
    queueFriendListRefreshAfterPending()
    removeFriend(peerUserId, payload.clear !== false)
  }

  /** 好友已被拉黑 */
  function applyFriendBlockNotification(payload: FriendNotificationPayload) {
    queueFriendListRefreshAfterPending()
    const friend = getFriend(payload.friendUserId)
    if (friend) {
      friend.blocked = true
      saveFriend(friend)
    }
  }

  /** 好友已移出黑名单 */
  function applyFriendUnblockNotification(payload: FriendNotificationPayload) {
    queueFriendListRefreshAfterPending()
    const friend = getFriend(payload.friendUserId)
    if (friend) {
      friend.blocked = false
      saveFriend(friend)
    }
  }

  /** 好友基础资料已更新 */
  function applyFriendInfoUpdatedNotification(payload: FriendNotificationPayload) {
    queueFriendListRefreshAfterPending()
    void fetchFriendInfo(payload.friendUserId).catch(() => undefined)
  }

  /** 好友个人设置已更新 */
  function applyFriendUpdateNotification(payload: FriendNotificationPayload) {
    queueFriendListRefreshAfterPending()
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
    const db = getDb()
    syncFriendConversation(friend, db)
    saveFriend(friend, db)
  }

  /** 清理好友内存状态 */
  function clear() {
    friends.value = []
    friendRequests.value = []
    loaded = false
    loading.value = false
    requestLoading.value = false
    requestLoadingMore.value = false
    hasMoreFriendRequests.value = true
    requestTask = undefined
    friendPullTask = undefined
    requestPullTask = undefined
    detailLoadTasks.clear()
  }

  return {
    friends,
    friendRequests,
    getActiveFriendList,
    getActiveFriendLiteList,
    getUnhandledRequestCount,
    loading,
    requestLoading,
    requestLoadingMore,
    hasMoreFriendRequests,
    loadFriendData,
    fetchFriendList,
    applyFriendRequest,
    pullFriends,
    fetchFriendInfo,
    setFriendSilent,
    setFriendDisplayName,
    blockFriend,
    unblockFriend,
    deleteFriend,
    fetchFriendRequestList,
    loadMoreFriendRequestList,
    pullFriendRequests,
    agreeFriendRequest,
    refuseFriendRequest,
    getFriend,
    isActiveFriend,
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
