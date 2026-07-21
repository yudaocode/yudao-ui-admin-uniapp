import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import type { ImDbClient } from '@/pages-im/utils/db'
import type { ChannelDO } from '../types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSimpleChannelList } from '@/api/im/manager/channel'
import { initDb } from '@/pages-im/utils/db'
import { ImConversationType } from '@/pages-im/utils/constants'
import { useConversationStore } from './conversationStore'
import {
  ResourceRequestKey,
  ResourceRequestMode,
  runResourceRequest,
} from '@/pages-im/utils/resourceRequest'

/** IM 频道 Store */
export const useChannelStore = defineStore('imChannelStore', () => {
  const channels = ref<ImManagerChannelVO[]>([]) // 当前用户可见频道列表
  let loaded = false // 是否已从服务端加载

  /** 按频道编号获取频道 */
  function getChannel(id: number): ImManagerChannelVO | undefined {
    return channels.value.find(channel => channel.id === id)
  }

  /** 从本地库恢复频道列表 */
  async function loadChannelList(): Promise<boolean> {
    try {
      const db = await initDb()
      const cached = await db.getAll<ChannelDO>('channels')
      if (!cached || cached.length === 0) {
        return false
      }
      channels.value = cached
      return true
    } catch (error) {
      console.warn('[IM channelStore] 本地频道缓存读取失败', error)
      return false
    }
  }

  /** 保存频道列表 */
  async function saveChannelList(
    channelList: ImManagerChannelVO[],
    db: ImDbClient,
  ): Promise<void> {
    await db.clearStore('channels')
    await db.bulkPut<ChannelDO>('channels', channelList)
  }

  /** 拉取启用的频道精简列表 */
  async function fetchChannelList(
    force = false,
  ) {
    if (loaded && !force) {
      return channels.value
    }
    return runResourceRequest(ResourceRequestKey.CHANNEL_LIST, async () => {
      const db = await initDb()
      const channelList = (await getSimpleChannelList()) || []
      channels.value = channelList
      loaded = true
      syncChannelConversationMetadata(db)
      await saveChannelList(channelList, db).catch(error =>
        console.warn('[IM channelStore] 本地频道缓存写入失败', error))
      return channelList
    }, { mode: ResourceRequestMode.SINGLE_FLIGHT, refreshAfterPending: force })
  }

  /** 用最新频道资料刷新已有频道会话 */
  function syncChannelConversationMetadata(db: ImDbClient) {
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
      }, db)
    })
  }

  /** 清空频道内存 */
  function clear() {
    channels.value = []
    loaded = false
  }

  return {
    channels,
    getChannel,
    loadChannelList,
    fetchChannelList,
    clear,
  }
})
