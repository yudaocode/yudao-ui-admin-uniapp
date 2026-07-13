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

/** 解析撤回信号中的原消息编号 */
export function parseRecallMessageId(content?: string): number {
  return Number(parseMessage<{ messageId?: number }>(content)?.messageId || 0)
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
