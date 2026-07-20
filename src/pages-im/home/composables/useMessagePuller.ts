import { useChannelStore } from '../store/channelStore'
import { useFriendStore } from '../store/friendStore'
import { useGroupStore } from '../store/groupStore'
import { buildMessageFromDO, useMessageStore } from '../store/messageStore'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'
import type { ConversationDO } from '../types'
import { ImConversationType } from '@/pages-im/utils/constants'
import { getPrivateMaxReadMessageId } from '@/api/im/message/private'
import { MESSAGE_PRIVATE_READ_ENABLED } from '@/pages-im/utils/config'

/** 编排 IM 消息、关系元数据与已读位置补拉 */
export function useMessagePuller(options?: {
  pullConversationReads: () => Promise<void>
  getActiveConversation: () => ConversationDO | undefined
}) {
  const friendStore = useFriendStore()
  const groupStore = useGroupStore()
  const channelStore = useChannelStore()
  const messageStore = useMessageStore()

  /** 私聊消息响应转前端消息 */
  function convertPrivateMessage(message: ImPrivateMessageRespVO, currentUserId: number) {
    const record = messageStore.buildIncomingMessage(ImConversationType.PRIVATE, message, currentUserId)
    return record ? buildMessageFromDO(record) : null
  }

  /** 群聊消息响应转前端消息 */
  function convertGroupMessage(message: ImGroupMessageRespVO, currentUserId: number) {
    const record = messageStore.buildIncomingMessage(ImConversationType.GROUP, message, currentUserId)
    return record ? buildMessageFromDO(record) : null
  }

  /** 执行一轮消息与状态补拉 */
  async function pullOnce(forceMetadata: boolean) {
    await channelStore.loadChannelList()
    const [friends, groups] = await Promise.all([
      forceMetadata ? friendStore.pullFriends() : friendStore.fetchFriendList(),
      groupStore.fetchGroupList(forceMetadata),
      channelStore.fetchChannelList(forceMetadata),
    ])
    await messageStore.pullAllMessages()
    await options?.pullConversationReads().catch((error) => {
      console.warn('[IM] 拉取会话读位置失败', error)
    })
    const active = options?.getActiveConversation()
    if (MESSAGE_PRIVATE_READ_ENABLED && active?.type === ImConversationType.PRIVATE) {
      const maxReadId = await getPrivateMaxReadMessageId(active.targetId)
      messageStore.updatePrivateReadMaxId(active.targetId, maxReadId)
      if (maxReadId) {
        await messageStore.applyMessageReadReceipt({
          conversationType: ImConversationType.PRIVATE,
          targetId: active.targetId,
          privateReadMaxId: maxReadId,
        })
      }
    }
    return { friends, groups, channels: channelStore.channels }
  }

  return {
    pullOnce,
    convertPrivateMessage,
    convertGroupMessage,
  }
}
