import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import type { ChannelDO } from '../types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSimpleChannelList } from '@/api/im/manager/channel'
import { getDb, getDbSession, initDb, isCurrentDbSession } from '@/pages-im/utils/db'
import { ImConversationType } from '@/pages-im/utils/constants'
import { useUserStore } from '@/store/user'
import { useConversationStore } from './conversationStore'

/** IM 频道 Store */
export const useChannelStore = defineStore('imChannelStore', () => {
  const channels = ref<ImManagerChannelVO[]>([]) // 当前用户可见频道列表
  let loaded = false // 是否已从服务端加载
  let storeEpoch = 0 // clear 时递增；旧账号请求返回后不得写入新账号状态
  const getCurrentUserId = () => useUserStore().userInfo.userId

  /** 按频道编号获取频道 */
  function getChannel(id: number): ImManagerChannelVO | undefined {
    return channels.value.find(channel => channel.id === id)
  }

  /** 从本地库恢复频道列表 */
  async function loadChannelList(): Promise<boolean> {
    const requestEpoch = storeEpoch
    const requestUserId = getCurrentUserId()
    try {
      await initDb()
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return false
      }
      const session = getDbSession()
      const cached = await getDb().getAll<ChannelDO>('channels')
      if (requestEpoch !== storeEpoch
        || getCurrentUserId() !== requestUserId
        || !isCurrentDbSession(session)) {
        return false
      }
      if (!cached || cached.length === 0) {
        return false
      }
      channels.value = cached
      return true
    } catch (error) {
      if (requestEpoch === storeEpoch && getCurrentUserId() === requestUserId) {
        console.warn('[IM channelStore] 本地频道缓存读取失败', error)
      }
      return false
    }
  }

  /** 保存频道列表 */
  function saveChannelList(): void {
    const requestEpoch = storeEpoch
    const requestUserId = getCurrentUserId()
    const channelList = [...channels.value]
    void (async () => {
      await initDb()
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      const session = getDbSession()
      const db = getDb()
      await db.clearStore('channels')
      if (requestEpoch !== storeEpoch
        || getCurrentUserId() !== requestUserId
        || !isCurrentDbSession(session)) {
        return
      }
      await db.bulkPut<ChannelDO>('channels', channelList)
    })().catch((error) => {
      if (requestEpoch === storeEpoch && getCurrentUserId() === requestUserId) {
        console.warn('[IM channelStore] 本地频道缓存写入失败', error)
      }
    })
  }

  /** 拉取启用的频道精简列表 */
  async function fetchChannelList(force = false) {
    if (loaded && !force) {
      return
    }
    const requestEpoch = storeEpoch
    const requestUserId = getCurrentUserId()
    try {
      const channelList = (await getSimpleChannelList()) || []
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      channels.value = channelList
      loaded = true
      syncChannelConversationMetadata()
      saveChannelList()
    } catch (error) {
      if (requestEpoch === storeEpoch && getCurrentUserId() === requestUserId) {
        console.warn('[IM channelStore] fetchChannelList 失败', error)
      }
    }
  }

  /** 用最新频道资料刷新已有频道会话 */
  function syncChannelConversationMetadata() {
    const conversationStore = useConversationStore()
    const indexed = new Map(channels.value.map(channel => [channel.id, channel]))
    conversationStore.conversations.forEach((conversation) => {
      if (conversation.type !== ImConversationType.CHANNEL) {
        return
      }
      const channel = indexed.get(conversation.targetId)
      if (!channel) {
        return
      }
      conversationStore.updateConversation(ImConversationType.CHANNEL, conversation.targetId, {
        name: channel.name,
        avatar: channel.avatar || '',
      })
    })
  }

  /** 清空频道内存 */
  function clear() {
    storeEpoch++
    channels.value = []
    loaded = false
  }

  uni.$on('auth:logout', clear)

  return {
    // TODO @AI：这些功能，是没迁移么？所以没用？？？
    channels,
    getChannel,
    loadChannelList,
    saveChannelList, // TODO @AI：saveChannelList、syncChannelConversationMetadata 貌似没使用？？？
    fetchChannelList,
    syncChannelConversationMetadata,
    clear,
  }
})
