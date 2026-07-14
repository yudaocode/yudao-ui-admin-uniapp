import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useConversationStore } from './conversationStore'
import { useFaceStore } from './faceStore'
import { useFriendStore } from './friendStore'
import { useGroupRequestStore } from './groupRequestStore'
import { useGroupStore } from './groupStore'
import { useImWebSocketStore } from './websocketStore'
import { useMessageStore } from './messageStore'
import { useRtcStore } from './rtcStore'

/** IM 分包运行时 Store：跨多个页面 URL 复用单一 WebSocket，并统一初始化关系与会话状态 */
export const useImRuntimeStore = defineStore('imRuntimeStore', () => {
  let runtimeUserId = 0 // 当前运行时所属用户编号
  let initialization: Promise<void> | undefined // 当前初始化任务
  let initializationUserId = 0 // 当前初始化任务所属用户编号
  const friendStore = useFriendStore()
  const groupRequestStore = useGroupRequestStore()
  const contactUnread = computed(() => // 待处理好友和加群申请数
    friendStore.getUnhandledRequestCount + groupRequestStore.unhandledList.length)

  /** 刷新通讯录申请数 */
  function refreshContactUnread() {
    if (useUserStore().userInfo.userId <= 0) {
      return Promise.resolve()
    }
    return Promise.all([
      friendStore.fetchFriendRequestList(),
      groupRequestStore.fetchUnhandledGroupRequestList(),
    ]).then(() => undefined)
  }

  /** 重连后增量补偿关系与申请状态 */
  async function resyncState() {
    if (useUserStore().userInfo.userId <= 0) {
      return
    }
    const conversationStore = useConversationStore()
    const groupStore = useGroupStore()
    useMessageStore().clearPrivateReadMaxIdCache()
    useRtcStore().clearGroupCallCache()
    groupStore.markAllGroupActiveCallsExpired()
    groupStore.markAllGroupInfoExpired()
    groupStore.markAllGroupMembersExpired()
    await Promise.allSettled([
      friendStore.pullFriends(),
      friendStore.pullFriendRequests(),
      conversationStore.pullConversationReads(),
      groupStore.fetchGroupList(true),
      groupRequestStore.pullGroupRequests(),
      groupRequestStore.fetchUnhandledGroupRequestList(),
    ])
  }

  /** 确保当前分包的 IM 运行时已经启动 */
  function ensure() {
    const userId = useUserStore().userInfo.userId
    if (userId <= 0) {
      return Promise.resolve()
    }
    if (runtimeUserId !== userId) {
      runtimeUserId = userId
    }
    useImWebSocketStore().connect()
    void useFaceStore().ensureFacePackList().catch((error) => {
      console.warn('[IM] 预加载系统表情包失败', error)
    })
    if (initialization && initializationUserId === userId) {
      return initialization
    }
    const conversationStore = useConversationStore()
    const groupStore = useGroupStore()
    const task = (async () => {
      await Promise.allSettled([
        friendStore.loadFriendData(),
        groupStore.loadGroupList(),
        groupRequestStore.loadGroupRequestList(),
      ])
      if (useUserStore().userInfo.userId !== userId) {
        return
      }
      const tasks = [refreshContactUnread()]
      if (!conversationStore.isLoaded()) {
        tasks.push(conversationStore.loadConversationList())
      }
      await Promise.allSettled(tasks)
    })().finally(() => {
      if (initialization === task) {
        initialization = undefined
        initializationUserId = 0
      }
    })
    initialization = task
    initializationUserId = userId
    return task
  }

  /** 退出登录时清理分包级运行态 */
  function reset() {
    runtimeUserId = 0
    initialization = undefined
    initializationUserId = 0
  }

  uni.$on('auth:logout', reset)
  uni.$on('im:state:resync', resyncState)

  /** 暴露运行时状态与动作 */
  return {
    contactUnread,
    ensure,
    reset,
  }
})
