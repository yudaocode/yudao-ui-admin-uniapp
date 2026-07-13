import type { ImFriendRespVO } from '@/api/im/friend'
import type { ImGroupRespVO } from '@/api/im/group'
import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import type { ConversationDO, ConversationReadDO, MessageDO } from '@/pages-im/home/db'
import { getImDb } from '@/pages-im/home/db'
import { MESSAGE_LOCAL_MAX_COUNT } from '@/pages-im/utils/config'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { getFriendDisplayName, getGroupDisplayName } from '@/pages-im/utils/user'
import {
  CommonStatusEnum,
  IM_AT_ALL_USER_ID,
  ImConversationType,
  ImMessageStatus,
  isNormalMessage,
} from '@/utils/constants'

/** 本地消息聚合为会话列表 */
export function useConversationBuilder(getCurrentUserId: () => number) {
  /** 根据本地消息重建会话摘要 */
  async function rebuildConversations(
    friendMap: Map<number, ImFriendRespVO>,
    groupMap: Map<number, ImGroupRespVO>,
    channelMap: Map<number, ImManagerChannelVO>,
  ): Promise<ConversationDO[]> {
    const db = getImDb()
    const [messages, reads, existing] = await Promise.all([
      db.getAll<MessageDO>('messages'),
      db.getAll<ConversationReadDO>('conversationReads'),
      db.getAll<ConversationDO>('conversations'),
    ])
    const readMap = new Map(reads.map(item => [item.clientConversationId, item]))
    const existingMap = new Map(existing.map(item => [item.clientConversationId, item]))
    const grouped = new Map<string, MessageDO[]>() // 按会话分组的消息
    messages.forEach((message) => {
      const list = grouped.get(message.clientConversationId) || []
      list.push(message)
      grouped.set(message.clientConversationId, list)
    })

    const result: ConversationDO[] = []
    const expiredMessageKeys: string[] = []
    grouped.forEach((list, clientConversationId) => {
      list.sort((left, right) => left.sendTime - right.sendTime)
      if (list.length > MESSAGE_LOCAL_MAX_COUNT) {
        const expired = list.splice(0, list.length - MESSAGE_LOCAL_MAX_COUNT)
        expiredMessageKeys.push(...expired.map(item => item.messageKey))
      }
      const last = list[list.length - 1]
      const type = last.conversationType
      const targetId = last.targetId
      const old = existingMap.get(clientConversationId)
      const friend = friendMap.get(targetId)
      const group = groupMap.get(targetId)
      const channel = channelMap.get(targetId)
      const groupUnavailable = type === ImConversationType.GROUP && !!group
        && (group.status === CommonStatusEnum.DISABLE || group.joinStatus === CommonStatusEnum.DISABLE)
      const hasNewActivity = !!old?.deleted && (
        (!!last.id && last.id > (old.lastMessageId || 0))
        || (!last.id
          && last.clientMessageId !== old.lastClientMessageId
          && last.sendTime > (old.lastSendTime || 0))
      )
      const name = type === ImConversationType.GROUP
        ? (group ? getGroupDisplayName(group) : '') || old?.name || `群 ${targetId}`
        : type === ImConversationType.CHANNEL
          ? channel?.name || old?.name || `频道 ${targetId}`
          : (friend ? getFriendDisplayName(friend) : '') || old?.name || `用户 ${targetId}`
      const avatar = group?.avatar || channel?.avatar || friend?.avatar || old?.avatar || ''

      const readMessageId = readMap.get(clientConversationId)?.messageId || 0
      const unreadMessages = list.filter(item => !item.selfSend
        && (item.id || 0) > readMessageId
        && isNormalMessage(item.type)
        && item.status !== ImMessageStatus.RECALL)
      const atMessage = [...unreadMessages].reverse().find(item => item.atUserIds?.includes(getCurrentUserId()))
      const atAllMessage = [...unreadMessages].reverse().find(item => item.atUserIds?.includes(IM_AT_ALL_USER_ID))
      result.push({
        clientConversationId,
        type,
        targetId,
        name,
        avatar,
        unreadCount: unreadMessages.length,
        lastContent: getMessageSummary(last.type, last.content),
        lastSendTime: last.sendTime,
        lastSenderId: last.senderId,
        lastMessageType: last.type,
        lastMessageId: last.id,
        lastSelfSend: last.selfSend,
        top: old?.top,
        silent: type === ImConversationType.GROUP
          ? group?.silent ?? old?.silent
          : type === ImConversationType.PRIVATE
            ? friend?.silent ?? old?.silent
            : old?.silent,
        deleted: groupUnavailable ? true : hasNewActivity ? false : old?.deleted,
        atMe: !!atMessage,
        atAll: !!atAllMessage,
        atMessageId: atMessage?.id,
        atAllMessageId: atAllMessage?.id,
        draft: old?.draft,
      })
    })

    const resultIds = new Set(result.map(item => item.clientConversationId))
    existing.forEach((conversation) => {
      if (resultIds.has(conversation.clientConversationId)) {
        return
      }
      const group = conversation.type === ImConversationType.GROUP
        ? groupMap.get(conversation.targetId)
        : undefined
      const groupUnavailable = !!group
        && (group.status === CommonStatusEnum.DISABLE || group.joinStatus === CommonStatusEnum.DISABLE)
      if (groupUnavailable) {
        result.push({ ...conversation, deleted: true })
      } else if (!conversation.deleted) {
        result.push(conversation)
      }
    })

    if (expiredMessageKeys.length) {
      const expiredSet = new Set(expiredMessageKeys)
      await db.removeWhere<MessageDO>('messages', item => expiredSet.has(item.messageKey))
    }
    await db.bulkPut<ConversationDO>('conversations', result)
    return result
  }

  /** 会话排序：置顶优先，再按最近时间倒序 */
  function sortConversations(list: ConversationDO[]) {
    return list
      .filter(item => !item.deleted)
      .sort((left, right) => {
        if (!!left.top !== !!right.top) {
          return left.top ? -1 : 1
        }
        return (right.lastSendTime || 0) - (left.lastSendTime || 0)
      })
  }

  return { rebuildConversations, sortConversations }
}
