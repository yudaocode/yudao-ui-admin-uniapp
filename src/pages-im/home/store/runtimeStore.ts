import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import { closeImDb, initImDb } from '@/pages-im/utils/db'
import { clearMessageSyncState } from '@/pages-im/utils/messageSync'
import { clearResourceRequests } from '@/pages-im/utils/resourceRequest'
import { useChannelStore } from './channelStore'
import { useConversationStore } from './conversationStore'
import { useFaceStore } from './faceStore'
import { useFriendStore } from './friendStore'
import { useGroupRequestStore } from './groupRequestStore'
import { useGroupStore } from './groupStore'
import { useMessageStore } from './messageStore'
import { useRtcStore } from './rtcStore'
import { useImWebSocketStore } from './websocketStore'

/** IM 分包运行时 Store：跨多个页面 URL 复用单一 WebSocket，并统一初始化关系与会话状态 */
export const useImRuntimeStore = defineStore('imRuntimeStore', () => {
  let initialization: Promise<boolean> | undefined // 当前初始化任务
  const friendStore = useFriendStore()
  const groupRequestStore = useGroupRequestStore()
  const contactUnread = computed(() => // 待处理好友和加群申请数
    friendStore.getUnhandledRequestCount + groupRequestStore.unhandledList.length)

  /** 刷新通讯录申请数 */
  async function refreshContactUnread() {
    await Promise.all([
      friendStore.fetchFriendRequestList(),
      groupRequestStore.fetchUnhandledGroupRequestList(),
    ])
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
  async function ensure(): Promise<boolean> {
    if (useUserStore().userInfo.userId <= 0) {
      return false
    }
    if (initialization) {
      return initialization
    }
    const conversationStore = useConversationStore()
    const groupStore = useGroupStore()
    const task = (async () => {
      await initImDb()
      useImWebSocketStore().connect()
      void useFaceStore().ensureFacePackList().catch((error) => {
        console.warn('[IM] 预加载系统表情包失败', error)
      })
      await Promise.allSettled([
        friendStore.loadFriendData(),
        groupStore.loadGroupList(),
        groupRequestStore.loadGroupRequestList(),
      ])
      const tasks = [refreshContactUnread()]
      if (!conversationStore.isLoaded()) {
        tasks.push(conversationStore.loadConversationList())
      }
      await Promise.allSettled(tasks)
      return true
    })().finally(() => {
      if (initialization === task) {
        initialization = undefined
      }
    })
    initialization = task
    return task
  }

  /** 退出登录时清理分包级运行态 */
  function reset() {
    initialization = undefined
    useImWebSocketStore().disconnect()
    clearResourceRequests()
    clearMessageSyncState()
    void closeImDb()
    useConversationStore().clear()
    useMessageStore().clear()
    friendStore.clear()
    useGroupStore().clear()
    useFaceStore().clear()
    useChannelStore().clear()
    groupRequestStore.clear()
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
