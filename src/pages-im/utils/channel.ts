import { useChannelStore } from '@/pages-im/home/store/channelStore'
import { ImConversationType } from './constants'

/** 构建频道会话基础信息 */
export function buildChannelConversationStub(channelId: number) {
  const channel = useChannelStore().getChannel(channelId)
  return {
    type: ImConversationType.CHANNEL,
    targetId: channelId,
    name: channel?.name || `频道 ${channelId}`,
    avatar: channel?.avatar || '',
  }
}
