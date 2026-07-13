// TODO @AI：这里的 utils，按道理说，应该和 /Users/yunai/Java/yudao-ui-admin-vue3/src/views/im/utils 对齐呀！
import { ImMessageType, isFriendChatTip, isGroupNotification } from '@/utils/constants'

/** 文本消息内容 */
export interface ImTextMessage {
  content: string
}

/** 图片消息内容 */
export interface ImImageMessage {
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  size?: number
}

/** 文件消息内容 */
export interface ImFileMessage {
  url: string
  name: string
  size?: number
  type?: string
}

/** 音视频消息内容 */
export interface ImMediaMessage {
  url: string
  coverUrl?: string
  duration?: number
  size?: number
}

/** 音视频通话提示 */
export interface ImRtcCallTipMessage {
  conversationType?: number
  mediaType?: number
  endReason?: number
  durationSeconds?: number
}

/** 名片消息内容 */
export interface ImCardMessage {
  targetType: number
  targetId: number
  name: string
  avatar?: string
  memberCount?: number
}

/** 表情消息内容 */
export interface ImFaceMessage {
  url: string
  name?: string
  width?: number
  height?: number
}

/** 合并转发消息内容 */
export interface ImMergeMessage {
  title: string
  messages?: Array<{ senderNickname?: string, type: number, content: string }>
}

/** 频道素材消息内容 */
export interface ImMaterialMessage {
  materialId?: number
  channelId?: number
  title?: string
  coverUrl?: string
  summary?: string
  url?: string
}

/** 引用消息内容 */
export interface ImQuoteMessage {
  messageId: number
  senderId: number
  type: number
  content: string
}

/** 可引用消息内容 */
interface ImQuotable {
  quote?: ImQuoteMessage
}

/** 可构造引用的消息 */
interface ImQuotableMessage {
  id?: number
  senderId: number
  type: number
  content: string
}

/** 生成客户端消息编号 */
export function generateClientMessageId() {
  const random = Math.random().toString(16).slice(2)
  return `${Date.now().toString(36)}-${random}`
}

/** 解析消息内容 */
export function parseMessage<T>(content?: string): T | null {
  if (!content) {
    return null
  }
  try {
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

/** 序列化消息内容 */
export function serializeMessage<T>(payload: T) {
  return JSON.stringify(payload)
}

/** 合并引用消息 */
export function withQuotePayload<T extends ImQuotable>(payload: T, quote?: ImQuoteMessage): T {
  if (!quote) {
    return payload
  }
  return { ...payload, quote }
}

/** 移除消息里的引用字段 */
export function removeQuotePayload(content?: string) {
  if (!content || !content.includes('"quote"')) {
    return content || ''
  }
  const parsed = parseMessage<Record<string, any>>(content)
  if (!parsed || !('quote' in parsed)) {
    return content
  }
  delete parsed.quote
  return JSON.stringify(parsed)
}

/** 构造引用消息 */
export function buildQuoteFromMessage(message: ImQuotableMessage): ImQuoteMessage {
  return {
    messageId: message.id || 0,
    senderId: message.senderId,
    type: message.type,
    content: removeQuotePayload(message.content),
  }
}

/** 获取消息里的引用内容 */
export function getQuoteFromMessage(content?: string): ImQuoteMessage | null {
  if (!content || !content.includes('"quote"')) {
    return null
  }
  return parseMessage<ImQuotable>(content)?.quote || null
}

/** 获取消息纯文本摘要 */
export function getMessageSummary(type?: number, content?: string) {
  if (type === ImMessageType.TEXT) {
    return parseMessage<ImTextMessage>(content)?.content || content || ''
  }
  if (type === ImMessageType.IMAGE) {
    return '[图片]'
  }
  if (type === ImMessageType.VOICE) {
    const voice = parseMessage<ImMediaMessage>(content)
    return voice?.duration ? `[语音] ${voice.duration} 秒` : '[语音]'
  }
  if (type === ImMessageType.VIDEO) {
    return '[视频]'
  }
  if (type === ImMessageType.FILE) {
    const file = parseMessage<ImFileMessage>(content)
    return file?.name ? `[文件] ${file.name}` : '[文件]'
  }
  if (type === ImMessageType.CARD) {
    const card = parseMessage<ImCardMessage>(content)
    return card?.name ? `[名片] ${card.name}` : '[名片]'
  }
  if (type === ImMessageType.FACE) {
    const face = parseMessage<ImFaceMessage>(content)
    return face?.name ? `[表情] ${face.name}` : '[表情]'
  }
  if (type === ImMessageType.MERGE) {
    const merge = parseMessage<ImMergeMessage>(content)
    return merge?.title ? `[聊天记录] ${merge.title}` : '[聊天记录]'
  }
  if (type === ImMessageType.MATERIAL) {
    const material = parseMessage<ImMaterialMessage>(content)
    return material?.title ? `[频道] ${material.title}` : '[频道消息]'
  }
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
    return type === ImMessageType.FRIEND_ADD ? '你们已经是好友了，开始聊天吧' : '好友关系已变更'
  }
  if (isGroupNotification(type ?? -1)) {
    return '[群通知]'
  }
  if (type === ImMessageType.RTC_CALL_START) {
    const rtc = parseMessage<ImRtcCallTipMessage>(content)
    return `${rtc?.mediaType === 2 ? '视频' : '语音'}通话`
  }
  if (type === ImMessageType.RTC_CALL_END) {
    const rtc = parseMessage<ImRtcCallTipMessage>(content)
    if (rtc?.conversationType === 2) {
      return `${rtc.mediaType === 2 ? '视频' : '语音'}通话已结束`
    }
    if (rtc?.durationSeconds != null) {
      const minutes = Math.floor(rtc.durationSeconds / 60)
      const seconds = rtc.durationSeconds % 60
      return `通话时长 ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    const reasonText: Record<number, string> = {
      1: '通话结束',
      2: '已拒绝',
      3: '已取消',
      4: '无人接听',
      5: '对方正忙',
      9: '通话异常',
    }
    return reasonText[rtc?.endReason || 0] || '通话已结束'
  }
  const payload = parseMessage<Record<string, any>>(content)
  return payload?.content ? String(payload.content) : content || ''
}

/** 获取图片消息地址 */
export function getImageUrl(content?: string) {
  const image = parseMessage<ImImageMessage>(content)
  return image?.thumbnailUrl || image?.url || ''
}
