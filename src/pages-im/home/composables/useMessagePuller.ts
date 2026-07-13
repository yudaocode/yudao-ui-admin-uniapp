import type { MessageDO } from '@/pages-im/home/db'
import type { ImChannelMessageRespVO } from '@/api/im/message/channel'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'
import { pullChannelMessages } from '@/api/im/message/channel'
import { pullGroupMessages } from '@/api/im/message/group'
import { pullPrivateMessages } from '@/api/im/message/private'
import {
  getClientConversationId,
  getClientMessageKey,
  getImDb,
  getServerMessageKey,
  ImSettingKeys,
} from '@/pages-im/home/db'
import { MESSAGE_PULL_PAGE_SIZE } from '@/pages-im/utils/config'
import { parseRecallMessageId } from '@/pages-im/utils/message'
import { runMinIdPull } from '@/pages-im/utils/pull'
import { toTimestamp } from '@/pages-im/utils/time'
import { ImConversationType, ImMessageStatus, ImMessageType } from '@/utils/constants'

/** 消息增量拉取与服务端 VO 转换 */
export function useMessagePuller(getCurrentUserId: () => number) {
  /** 私聊消息 VO 转本地消息 */
  function mapPrivateMessage(vo: ImPrivateMessageRespVO, currentUserId = getCurrentUserId()): MessageDO {
    const self = currentUserId
    const selfSend = vo.senderId === self
    const targetId = selfSend ? vo.receiverId : vo.senderId
    const clientConversationId = getClientConversationId(ImConversationType.PRIVATE, targetId)
    return {
      messageKey: vo.id
        ? getServerMessageKey(ImConversationType.PRIVATE, vo.id)
        : getClientMessageKey(vo.clientMessageId),
      clientConversationId,
      conversationType: ImConversationType.PRIVATE,
      id: vo.id,
      clientMessageId: vo.clientMessageId,
      type: vo.type,
      content: vo.content,
      status: vo.status,
      sendTime: toTimestamp(vo.sendTime),
      senderId: vo.senderId,
      targetId,
      selfSend,
    }
  }

  /** 群聊消息 VO 转本地消息 */
  function mapGroupMessage(vo: ImGroupMessageRespVO, currentUserId = getCurrentUserId()): MessageDO {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, vo.groupId)
    return {
      messageKey: vo.id
        ? getServerMessageKey(ImConversationType.GROUP, vo.id)
        : getClientMessageKey(vo.clientMessageId),
      clientConversationId,
      conversationType: ImConversationType.GROUP,
      id: vo.id,
      clientMessageId: vo.clientMessageId,
      type: vo.type,
      content: vo.content,
      status: vo.status,
      sendTime: toTimestamp(vo.sendTime),
      senderId: vo.senderId,
      targetId: vo.groupId,
      selfSend: vo.senderId === currentUserId,
      atUserIds: vo.atUserIds,
      receiverUserIds: vo.receiverUserIds,
      receiptStatus: vo.receiptStatus,
      readCount: vo.readCount,
    }
  }

  /** 频道消息 VO 转本地消息 */
  function mapChannelMessage(vo: ImChannelMessageRespVO): MessageDO {
    const clientConversationId = getClientConversationId(ImConversationType.CHANNEL, vo.channelId)
    return {
      messageKey: vo.id
        ? getServerMessageKey(ImConversationType.CHANNEL, vo.id)
        : getClientMessageKey(vo.clientMessageId),
      clientConversationId,
      conversationType: ImConversationType.CHANNEL,
      id: vo.id,
      clientMessageId: vo.clientMessageId || `channel-${vo.id}`,
      type: vo.type,
      content: vo.content,
      status: vo.status ?? ImMessageStatus.UNREAD,
      sendTime: toTimestamp(vo.sendTime),
      senderId: 0,
      targetId: vo.channelId,
      selfSend: false,
      materialId: vo.materialId,
      receiptStatus: vo.receiptStatus,
    }
  }

  /** 拉取一类消息并持久化 */
  async function pullMessages<T extends { id: number, type: number, content: string }>(
    cursorKey: string,
    fetchPage: (minId: number) => Promise<T[]>,
    mapper: (vo: T) => MessageDO,
    isActive: () => boolean,
  ) {
    const db = getImDb()
    const initialMinId = (await db.getSetting<number>(cursorKey)) || 0
    await runMinIdPull({
      initialMinId,
      pageSize: MESSAGE_PULL_PAGE_SIZE,
      fetchPage,
      persistPage: async (list) => {
        const messages = list.filter(item => item.type !== ImMessageType.RECALL).map(mapper)
        await Promise.all(messages
          .filter(message => !!message.id && !!message.clientMessageId)
          .map(message => db.delete('messages', getClientMessageKey(message.clientMessageId))))
        await db.bulkPut<MessageDO>('messages', messages)
        for (const signal of list.filter(item => item.type === ImMessageType.RECALL)) {
          const messageId = parseRecallMessageId(signal.content)
          if (!messageId) {
            continue
          }
          const messageKey = getServerMessageKey(mapper(signal).conversationType, messageId)
          const original = await db.get<MessageDO>('messages', messageKey)
          if (original) {
            await db.put<MessageDO>('messages', {
              ...original,
              type: ImMessageType.RECALL,
              content: '',
              status: ImMessageStatus.RECALL,
            })
          }
        }
      },
      persistCursor: minId => db.setSetting(cursorKey, minId),
      isActive,
    })
  }

  /** 依次拉取私聊、群聊和频道消息 */
  async function pullAllMessages(isActive: () => boolean) {
    await pullMessages(
      ImSettingKeys.privateMessageMaxId,
      minId => pullPrivateMessages({ minId, size: MESSAGE_PULL_PAGE_SIZE }),
      mapPrivateMessage,
      isActive,
    )
    if (!isActive()) {
      return
    }
    await pullMessages(
      ImSettingKeys.groupMessageMaxId,
      minId => pullGroupMessages({ minId, size: MESSAGE_PULL_PAGE_SIZE }),
      mapGroupMessage,
      isActive,
    )
    if (!isActive()) {
      return
    }
    await pullMessages(
      ImSettingKeys.channelMessageMaxId,
      minId => pullChannelMessages({ minId, size: MESSAGE_PULL_PAGE_SIZE }),
      mapChannelMessage,
      isActive,
    )
  }

  /** 把 WebSocket 通知转换为本地消息 */
  function buildIncomingMessage(
    conversationType: number,
    payload: ImPrivateMessageRespVO | ImGroupMessageRespVO | ImChannelMessageRespVO,
    currentUserId = getCurrentUserId(),
  ): MessageDO | null {
    if (conversationType === ImConversationType.PRIVATE) {
      return mapPrivateMessage(payload as ImPrivateMessageRespVO, currentUserId)
    }
    if (conversationType === ImConversationType.GROUP) {
      return mapGroupMessage(payload as ImGroupMessageRespVO, currentUserId)
    }
    if (conversationType === ImConversationType.CHANNEL) {
      return mapChannelMessage(payload as ImChannelMessageRespVO)
    }
    return null
  }

  return { pullAllMessages, buildIncomingMessage }
}
