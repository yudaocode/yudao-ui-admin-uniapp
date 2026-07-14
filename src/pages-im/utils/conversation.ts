import type {
  CardMessage,
  FaceMessage,
  FileMessage,
  MaterialMessage,
  TextMessage,
  TipSegment,
} from './message'
import type { Message } from '@/pages-im/home/types'
import {
  ImConversationType,
  ImMessageType,
  isFriendChatTip,
  isGroupNotification,
  isRtcCallTip,
} from './constants'
import {
  getCardLabelInfo,
  parseMessage,
  parseRtcCallPayload,
  resolveFriendNotificationText,
  resolveGroupNotificationText,
  resolveRtcCallLastContent,
  resolveRtcCallPrivateBubbleText,
  resolveRtcCallTipSegments,
  segmentsToText,
  tipMention,
  tipText,
} from './message'
import { getSenderDisplayName } from './user'

/** 获取会话稳定主键 */
export function getConversationKey(conversation: { type: number, targetId: number }) {
  return `${conversation.type}-${conversation.targetId}`
}

/** 按会话名称模糊过滤 */
export function filterConversationsByKeyword<T extends { name?: string }>(
  list: T[],
  keyword: string,
): T[] {
  const trimmed = keyword.trim().toLowerCase()
  if (!trimmed) {
    return list
  }
  return list.filter(item => (item.name || '').toLowerCase().includes(trimmed))
}

/** 获取表情消息预览文案 */
export function buildFacePreviewText(facePayload: { name?: string } | null | undefined): string {
  return facePayload?.name ? `[表情] ${facePayload.name}` : '[表情]'
}

/** 获取撤回提示分段 */
export function buildRecallTipSegments(
  senderId: number,
  selfSend: boolean,
  conversationType: number,
  conversationTargetId: number,
  fallbackName?: string,
): TipSegment[] {
  if (selfSend) {
    return [tipText('你撤回了一条消息')]
  }
  const senderDisplayName = getSenderDisplayName(
    senderId,
    conversationType,
    conversationTargetId,
    fallbackName,
  )
  if (!senderId) {
    return [tipText(`${senderDisplayName || '对方'} 撤回了一条消息`)]
  }
  return [tipMention(senderId, senderDisplayName || '对方'), tipText(' 撤回了一条消息')]
}

/** 获取撤回提示文案 */
export function buildRecallTip(
  senderId: number,
  selfSend: boolean,
  conversationType: number,
  conversationTargetId: number,
  fallbackName?: string,
) {
  return segmentsToText(buildRecallTipSegments(
    senderId,
    selfSend,
    conversationType,
    conversationTargetId,
    fallbackName,
  ))
}

/** 获取消息纯文本摘要 */
export function summarizeMessageContent(
  message: Pick<Message, 'type' | 'content'>,
  opts?: { withFileName?: boolean },
): string {
  switch (message.type) {
    case ImMessageType.TEXT:
      return parseMessage<TextMessage>(message.content)?.content ?? ''
    case ImMessageType.IMAGE:
      return '[图片]'
    case ImMessageType.VOICE:
      return '[语音]'
    case ImMessageType.VIDEO:
      return '[视频]'
    case ImMessageType.FILE: {
      if (opts?.withFileName) {
        const file = parseMessage<FileMessage>(message.content)
        return file?.name ? `[文件] ${file.name}` : '[文件]'
      }
      return '[文件]'
    }
    case ImMessageType.CARD:
      return `[${getCardLabelInfo(parseMessage<CardMessage>(message.content)).label}]`
    case ImMessageType.FACE:
      return buildFacePreviewText(parseMessage<FaceMessage>(message.content))
    case ImMessageType.MERGE:
      return '[聊天记录]'
    case ImMessageType.MATERIAL: {
      const material = parseMessage<MaterialMessage>(message.content)
      return material?.title ? `[频道] ${material.title}` : '[频道]'
    }
    case ImMessageType.RTC_CALL_START:
    case ImMessageType.RTC_CALL_END:
      return '[语音通话]'
    default:
      return ''
  }
}

/** 获取消息纯文本摘要 */
export function getMessageSummary(
  type?: number,
  content?: string,
  resolveName?: (userId: number) => string,
) {
  if (type === ImMessageType.RECALL) {
    return '[消息已撤回]'
  }
  if (type === ImMessageType.READ) {
    return '[已读回执]'
  }
  if (type === ImMessageType.RECEIPT) {
    return '[回执]'
  }
  if (isFriendChatTip(type ?? -1)) {
    return resolveFriendNotificationText({ type })
  }
  if (isGroupNotification(type ?? -1)) {
    return resolveGroupNotificationText(
      { type, content },
      resolveName || (userId => `用户 ${userId}`),
    ) || '[群通知]'
  }
  if (isRtcCallTip(type ?? -1)) {
    const payload = parseRtcCallPayload(content)
    if (type === ImMessageType.RTC_CALL_END
      && payload?.conversationType === ImConversationType.PRIVATE) {
      return resolveRtcCallPrivateBubbleText(payload)
    }
    return segmentsToText(resolveRtcCallTipSegments({ type, content })) || '[语音通话]'
  }
  return summarizeMessageContent({ type: type ?? 0, content: content || '' })
}

/** 获取会话列表最后一条消息摘要 */
export function resolveConversationLastContent(
  message: Message,
  conversationType: number,
  conversationTargetId: number,
  fallbackName?: string,
) {
  if (message.type === ImMessageType.RECALL) {
    return buildRecallTip(
      message.senderId,
      message.selfSend,
      conversationType,
      conversationTargetId,
      fallbackName,
    )
  }
  if (isFriendChatTip(message.type)) {
    return resolveFriendNotificationText(message)
  }
  if (isGroupNotification(message.type)) {
    return resolveGroupNotificationText(
      message,
      userId => getSenderDisplayName(userId, ImConversationType.GROUP, message.targetId),
    )
  }
  if (isRtcCallTip(message.type)) {
    return resolveRtcCallLastContent(message, conversationType)
  }
  return summarizeMessageContent(message)
}
