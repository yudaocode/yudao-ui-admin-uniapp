import { useUserStore } from '@/store/user'
import type {
  Conversation,
  GroupLite,
  Message,
  QuoteMessage,
  User,
} from '@/pages-im/home/types'
import {
  ImConversationType,
  ImMessageType,
  ImRtcCallEndReason,
} from './constants'
import type { ImConversationTypeValue } from './constants'
import { formatCallDuration } from './time'
import { useFriendStore } from '@/pages-im/home/store/friendStore'
import { useGroupStore } from '@/pages-im/home/store/groupStore'

export type { QuoteMessage } from '@/pages-im/home/types'

/** 可引用消息内容 */
interface Quotable {
  quote?: QuoteMessage
}

/** 文本消息内容 */
export interface TextMessage extends Quotable {
  content: string
}

/** 图片消息内容 */
export interface ImageMessage extends Quotable {
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  size?: number
}

/** 文件消息内容 */
export interface FileMessage extends Quotable {
  url: string
  name: string
  size: number
  type?: string
}

/** 语音消息内容 */
export interface AudioMessage extends Quotable {
  url: string
  duration: number
  size?: number
}

/** 视频消息内容 */
export interface VideoMessage extends Quotable {
  url: string
  coverUrl?: string
  duration?: number
  width?: number
  height?: number
  size?: number
}

/** 名片消息内容 */
export interface CardMessage extends Quotable {
  targetType: ImConversationTypeValue
  targetId: number
  name: string
  avatar?: string
  memberCount?: number
}

/** 表情消息内容 */
export interface FaceMessage extends Quotable {
  url: string
  name?: string
  width?: number
  height?: number
}

/** 合并转发消息内容 */
export interface MergeMessage {
  title: string
  messages: MergeMessageItem[]
}

/** 合并转发的单条内嵌消息快照 */
export interface MergeMessageItem {
  messageId: number
  senderId: number
  senderNickname: string
  senderAvatar?: string
  type: number
  content: string
  sendTime: number
}

/** 频道素材消息内容 */
export interface MaterialMessage {
  materialId?: number
  channelId?: number
  title?: string
  coverUrl?: string
  summary?: string
  url?: string
}

/** 群广播事件内容；字段对齐后端 GroupNotificationMessage 子类 */
export interface GroupNotificationPayload {
  operatorUserId?: number
  memberUserIds?: number[]
  newOwnerUserId?: number
  oldName?: string
  newName?: string
  oldNotice?: string
  newNotice?: string
  oldAvatar?: string
  newAvatar?: string
  oldJoinApproval?: boolean
  newJoinApproval?: boolean
  displayUserName?: string
  messageId?: number
  mutedUserId?: number
  muteEndTime?: string
  banned?: boolean
  entrantUserId?: number
  addSource?: number
  message?: {
    id: number
    senderId: number
    groupId: number
    type: number
    content: string
    sendTime: string
    atUserIds?: number[]
    receiverUserIds?: number[]
  }
}

/** 提示或文本消息的结构化分段 */
export type TipSegment
  = | { type: 'text', text: string }
    | { type: 'mention', userId: number, text: string }
    | { type: 'link', href: string, text: string }

/** @ 提及候选 */
export interface MentionCandidate {
  userId: number
  name: string
  displayName?: string
  ambiguous?: boolean
}

const URL_PREFIX_REGEX = /^(?:https?:\/\/[^\s\u4E00-\u9FA5@<>"']+|www\.[^\s\u4E00-\u9FA5@<>"']+)/i // URL 前缀匹配
const URL_TRAILING_PUNCTUATION = /[.,!?;:)\]、，。！？；：）】]+$/ // URL 末尾标点
const URL_MIN_LENGTH = 6 // 最短可识别 URL

/** 私聊消息所属的对端用户编号 */
export function getPrivateMessagePeerId(
  message: { senderId: number, receiverId: number },
  currentUserId: number,
) {
  return message.senderId === currentUserId ? message.receiverId : message.senderId
}

/** 构造普通文本分段 */
export function tipText(text: string): TipSegment {
  return { type: 'text', text }
}

/** 构造 @ 用户分段 */
export function tipMention(userId: number, text: string): TipSegment {
  return { type: 'mention', userId, text }
}

/** 构造链接分段 */
export function tipLink(href: string, text: string): TipSegment {
  return { type: 'link', href, text }
}

/** 把结构化分段转换为纯文本 */
export function segmentsToText(segments: TipSegment[]) {
  return segments.map(segment => segment.text).join('')
}

/** 多个用户编号按指定分隔符转换为 @ 分段 */
export function joinMentionSegments(
  userIds: number[],
  separator: string,
  resolveName: (userId: number) => string,
) {
  return userIds.flatMap((userId, index) => index === 0
    ? [tipMention(userId, resolveName(userId))]
    : [tipText(separator), tipMention(userId, resolveName(userId))])
}

/** 文本消息按 @ 提及和 URL 拆分 */
export function parseTextSegments(text: string, mentions: MentionCandidate[] = []): TipSegment[] {
  if (!text) {
    return []
  }
  const sortedMentions = mentions.length > 1
    ? [...mentions].sort((left, right) => right.name.length - left.name.length)
    : mentions
  const segments: TipSegment[] = []
  let buffer = ''
  let index = 0
  const flush = () => {
    if (buffer) {
      segments.push(tipText(buffer))
      buffer = ''
    }
  }
  while (index < text.length) {
    if (text[index] === '@' && sortedMentions.length > 0) {
      const matched = sortedMentions.find(item => item.name && text.startsWith(item.name, index + 1))
      if (matched) {
        if (matched.ambiguous) {
          buffer += `@${matched.name}`
        } else {
          flush()
          segments.push(tipMention(matched.userId, `@${matched.displayName || matched.name}`))
        }
        index += matched.name.length + 1
        continue
      }
    }
    const head = text[index]
    if (head === 'h' || head === 'H' || head === 'w' || head === 'W') {
      const matched = URL_PREFIX_REGEX.exec(text.slice(index))
      if (matched) {
        const urlText = matched[0].replace(URL_TRAILING_PUNCTUATION, '')
        if (urlText.length >= URL_MIN_LENGTH) {
          flush()
          const href = /^https?:\/\//i.test(urlText) ? urlText : `https://${urlText}`
          segments.push(tipLink(href, urlText))
          index += urlText.length
          continue
        }
      }
    }
    buffer += text[index]
    index++
  }
  flush()
  return segments
}

/** 获取名片的业务标签和图标 */
export function getCardLabelInfo(card?: { targetType?: number } | null): {
  label: string
  icon: string
} {
  if (card?.targetType === ImConversationType.GROUP) {
    return { label: '群名片', icon: 'ant-design:usergroup-outlined' }
  }
  return { label: '个人名片', icon: 'ant-design:user-outlined' }
}

/** 名片转发的源对象 */
export type CardTarget = Omit<CardMessage, 'quote'>

/** 用户资料转个人名片快照；名片使用真实昵称，不带好友备注 */
export function toUserCardTarget(user: User | null | undefined): CardTarget | null {
  if (!user?.id) {
    return null
  }
  return {
    targetType: ImConversationType.PRIVATE,
    targetId: user.id,
    name: user.nickname || '',
    avatar: user.avatar,
  }
}

/** 群资料转群名片快照 */
export function toGroupCardTarget(group: GroupLite | null | undefined): CardTarget | null {
  if (!group?.id) {
    return null
  }
  return {
    targetType: ImConversationType.GROUP,
    targetId: group.id,
    name: group.name || '',
    avatar: group.showImage || group.showImageThumb,
    memberCount: group.memberCount,
  }
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
export function withQuotePayload<T extends Quotable>(payload: T, quote?: QuoteMessage): T {
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

interface SenderSnapshot {
  nickname: string
  avatar: string
}

/** 构造发送人快照索引 */
function buildSenderSnapshotMap(
  senderIds: number[],
  conversation: Conversation,
): Map<number, SenderSnapshot> {
  const userStore = useUserStore()
  const friendStore = useFriendStore()
  const selfUserId = userStore.userInfo.userId
  const result = new Map<number, SenderSnapshot>()
  let groupMembers: Map<number, { nickname: string, avatar?: string }> | null = null
  if (conversation.type === ImConversationType.GROUP) {
    const group = useGroupStore().getGroup(conversation.targetId)
    groupMembers = new Map((group?.members || []).map(member => [member.userId, member]))
  }
  for (const senderId of senderIds) {
    if (result.has(senderId)) {
      continue
    }
    if (senderId === selfUserId) {
      result.set(senderId, {
        nickname: userStore.userInfo.nickname || String(senderId),
        avatar: userStore.userInfo.avatar || '',
      })
      continue
    }
    const member = groupMembers?.get(senderId)
    if (member?.nickname) {
      result.set(senderId, { nickname: member.nickname, avatar: member.avatar || '' })
      continue
    }
    const friend = friendStore.getFriend(senderId)
    result.set(senderId, {
      nickname: friend?.nickname || String(senderId),
      avatar: friend?.avatar || '',
    })
  }
  return result
}

/** 单条消息转换为合并转发快照 */
function mapMessageToMergeItem(
  message: Message,
  senderSnapshots: Map<number, SenderSnapshot>,
): MergeMessageItem {
  const snapshot = senderSnapshots.get(message.senderId)
  return {
    messageId: message.id || 0,
    senderId: message.senderId,
    senderNickname: snapshot?.nickname ?? String(message.senderId),
    senderAvatar: snapshot?.avatar ?? '',
    type: message.type,
    content: removeQuotePayload(message.content),
    sendTime: message.sendTime,
  }
}

/** 构造合并转发标题 */
export function buildMergeTitle(conversation: Conversation): string {
  if (conversation.type === ImConversationType.GROUP) {
    return `${conversation.name || '群聊'} 的聊天记录`
  }
  const selfName = useUserStore().userInfo.nickname || '我'
  return `${conversation.name || '对方'} 和 ${selfName} 的聊天记录`
}

/** 构造合并转发消息快照 */
export function buildMergeMessagePayload(
  messages: Message[],
  conversation: Conversation,
): MergeMessage {
  const senderSnapshots = buildSenderSnapshotMap(messages.map(message => message.senderId), conversation)
  return {
    title: buildMergeTitle(conversation),
    messages: messages.map(message => mapMessageToMergeItem(message, senderSnapshots)),
  }
}

/** 可添加到个人表情的数据 */
export interface AddableFacePayload {
  url: string
  width: number
  height: number
  name?: string
}

/** 从图片或表情消息提取可收藏的表情数据 */
export function extractAddableFace(message: Message): AddableFacePayload | null {
  if (message.type === ImMessageType.FACE) {
    const face = parseMessage<FaceMessage>(message.content)
    return face?.url
      ? { url: face.url, width: face.width || 200, height: face.height || 200, name: face.name }
      : null
  }
  if (message.type === ImMessageType.IMAGE) {
    const image = parseMessage<ImageMessage>(message.content)
    return image?.url
      ? { url: image.url, width: image.width || 200, height: image.height || 200 }
      : null
  }
  return null
}

/** 构造引用消息 */
export function buildQuoteFromMessage(
  message: Pick<Message, 'id' | 'senderId' | 'type' | 'content'>,
): QuoteMessage {
  return {
    messageId: message.id || 0,
    senderId: message.senderId,
    type: message.type,
    content: removeQuotePayload(message.content),
  }
}

/** 获取消息里的引用内容 */
export function getQuoteFromMessage(content?: string): QuoteMessage | null {
  if (!content || !content.includes('"quote"')) {
    return null
  }
  return parseMessage<Quotable>(content)?.quote || null
}

/** 解析群广播事件为结构化文案 */
export function resolveGroupNotificationSegments(
  message: { type?: number, content?: string, targetId?: number },
  resolveName: (userId: number) => string,
  operatorNameOverride?: string,
): TipSegment[] {
  const payload = parseMessage<GroupNotificationPayload>(message.content)
  if (!payload) {
    return []
  }
  if (message.type === ImMessageType.GROUP_MEMBER_ENTER) {
    const entrantId = payload.entrantUserId ?? payload.operatorUserId
    return entrantId ? [tipMention(entrantId, resolveName(entrantId)), tipText(' 加入了群聊')] : []
  }
  if (!payload.operatorUserId) {
    return []
  }
  const operator = tipMention(
    payload.operatorUserId,
    operatorNameOverride ?? resolveName(payload.operatorUserId),
  )
  const members = joinMentionSegments(payload.memberUserIds || [], '、', resolveName)
  switch (message.type) {
    case ImMessageType.GROUP_CREATE:
      return [operator, tipText(' 创建了群聊')]
    case ImMessageType.GROUP_NAME_UPDATE:
      return [operator, tipText(` 将群名修改为 "${payload.newName ?? ''}"`)]
    case ImMessageType.GROUP_NOTICE_UPDATE:
      return [operator, tipText(' 更新了群公告')]
    case ImMessageType.GROUP_INFO_UPDATE:
      return [operator, tipText(payload.newAvatar ? ' 更换了群头像' : ' 更新了群信息')]
    case ImMessageType.GROUP_DISSOLVE:
      return [operator, tipText(' 解散了群聊')]
    case ImMessageType.GROUP_MEMBER_INVITE:
      return [operator, tipText(' 邀请 '), ...members, tipText(' 加入群聊')]
    case ImMessageType.GROUP_MEMBER_QUIT:
      return [operator, tipText(' 退出了群聊')]
    case ImMessageType.GROUP_MEMBER_KICK:
      return [operator, tipText(' 移出了 '), ...members]
    case ImMessageType.GROUP_MEMBER_NICKNAME_UPDATE:
      return [operator, tipText(` 修改群昵称为 "${payload.displayUserName ?? ''}"`)]
    case ImMessageType.GROUP_ADMIN_ADD:
      return [operator, tipText(' 将 '), ...members, tipText(' 设为管理员')]
    case ImMessageType.GROUP_ADMIN_REMOVE:
      return [operator, tipText(' 撤销了 '), ...members, tipText(' 的管理员身份')]
    case ImMessageType.GROUP_OWNER_TRANSFER:
      return payload.newOwnerUserId
        ? [
            operator,
            tipText(' 已将群主转让给 '),
            tipMention(payload.newOwnerUserId, resolveName(payload.newOwnerUserId)),
          ]
        : []
    case ImMessageType.GROUP_MESSAGE_PIN:
      return [operator, tipText(' 置顶了一条消息')]
    case ImMessageType.GROUP_MESSAGE_UNPIN:
      return [operator, tipText(' 取消了一条置顶消息')]
    case ImMessageType.GROUP_MEMBER_MUTED:
      return payload.mutedUserId
        ? [
            operator,
            tipText(' 将 '),
            tipMention(payload.mutedUserId, resolveName(payload.mutedUserId)),
            tipText(' 禁言'),
          ]
        : []
    case ImMessageType.GROUP_MEMBER_CANCEL_MUTED:
      return payload.mutedUserId
        ? [
            operator,
            tipText(' 解除了 '),
            tipMention(payload.mutedUserId, resolveName(payload.mutedUserId)),
            tipText(' 的禁言'),
          ]
        : []
    case ImMessageType.GROUP_MUTED:
      return [operator, tipText(' 开启了全群禁言')]
    case ImMessageType.GROUP_CANCEL_MUTED:
      return [operator, tipText(' 关闭了全群禁言')]
    case ImMessageType.GROUP_BANNED:
      return [operator, tipText(payload.banned ? ' 封禁了该群' : ' 解封了该群')]
    default:
      return []
  }
}

/** 获取群广播事件文案 */
export function resolveGroupNotificationText(
  message: { type?: number, content?: string, targetId?: number },
  resolveName: (userId: number) => string,
  operatorNameOverride?: string,
) {
  return segmentsToText(resolveGroupNotificationSegments(message, resolveName, operatorNameOverride))
}

/** 解析好友关系事件为结构化文案 */
export function resolveFriendNotificationSegments(message: { type?: number }): TipSegment[] {
  if (message.type === ImMessageType.FRIEND_ADD) {
    return [tipText('你们已经是好友了，开始聊天吧')]
  }
  if (message.type === ImMessageType.FRIEND_DELETE) {
    return [tipText('你已删除好友')]
  }
  return []
}

/** 获取好友关系事件文案 */
export function resolveFriendNotificationText(message: { type?: number }) {
  return segmentsToText(resolveFriendNotificationSegments(message))
}

/** RTC 通话开始内容 */
export interface RtcCallStartPayload {
  room?: string
  conversationType?: number
  mediaType?: number
  inviterUserId?: number
  inviterNickname?: string
  inviterAvatar?: string
}

/** RTC 通话结束内容 */
export interface RtcCallEndPayload {
  room?: string
  conversationType?: number
  mediaType?: number
  endReason?: number
  durationSeconds?: number
  operatorUserId?: number
  operatorNickname?: string
  operatorAvatar?: string
}

/** 解析 RTC 通话消息内容 */
export function parseRtcCallPayload(content?: string) {
  return content ? parseMessage<RtcCallStartPayload & RtcCallEndPayload>(content) : null
}

/** 解析 RTC 通话事件为结构化文案 */
export function resolveRtcCallTipSegments(message: {
  type?: number
  content?: string
  selfSend?: boolean
}): TipSegment[] {
  const payload = parseRtcCallPayload(message.content)
  if (!payload) {
    return []
  }
  if (message.type === ImMessageType.RTC_CALL_START && payload.inviterUserId) {
    const inviterName = payload.inviterNickname?.trim() || `用户 ${payload.inviterUserId}`
    return [tipMention(payload.inviterUserId, inviterName), tipText(' 发起了语音通话')]
  }
  if (message.type === ImMessageType.RTC_CALL_END) {
    return [tipText('语音通话已经结束')]
  }
  return []
}

/** 获取会话列表 RTC 摘要 */
export function resolveRtcCallLastContent(
  message: { type?: number, content?: string },
  conversationType: number,
) {
  if (conversationType === ImConversationType.PRIVATE) {
    return '[语音通话]'
  }
  if (message.type === ImMessageType.RTC_CALL_END) {
    return '语音通话已经结束'
  }
  if (message.type === ImMessageType.RTC_CALL_START) {
    const payload = parseRtcCallPayload(message.content)
    if (payload) {
      const inviterName = payload.inviterNickname?.trim() || `用户 ${payload.inviterUserId ?? ''}`
      return `${inviterName} 发起了语音通话`
    }
  }
  return ''
}

/** 获取私聊 RTC 结束气泡文案 */
export function resolveRtcCallPrivateBubbleText(payload: RtcCallEndPayload | null) {
  if (!payload) {
    return '通话已结束'
  }
  const duration = payload.durationSeconds || 0
  const hasDuration = duration > 0
  const isOperator = payload.operatorUserId === useUserStore().userInfo.userId
  switch (payload.endReason) {
    case ImRtcCallEndReason.HANGUP:
      return hasDuration ? `通话时长 ${formatCallDuration(duration)}` : '通话中断'
    case ImRtcCallEndReason.CANCEL:
      return isOperator ? '已取消' : '对方已取消'
    case ImRtcCallEndReason.REJECT:
      return isOperator ? '已拒绝' : '对方已拒绝'
    case ImRtcCallEndReason.NO_ANSWER:
      return isOperator ? '未接听' : '对方未接听'
    case ImRtcCallEndReason.BUSY:
      return isOperator ? '忙线未接听' : '对方忙线中'
    case ImRtcCallEndReason.ERROR:
      return hasDuration ? `通话中断 ${formatCallDuration(duration)}` : '通话中断'
    default:
      return hasDuration ? `通话时长 ${formatCallDuration(duration)}` : '通话已结束'
  }
}

/** 获取 RTC 结束原因兜底文案 */
export function resolveCallEndReasonText(reason?: number) {
  switch (reason) {
    case ImRtcCallEndReason.REJECT:
      return '对方已拒绝'
    case ImRtcCallEndReason.CANCEL:
      return '对方已取消'
    case ImRtcCallEndReason.BUSY:
      return '对方忙线中'
    case ImRtcCallEndReason.HANGUP:
      return '通话已结束'
    case ImRtcCallEndReason.ERROR:
      return '通话异常'
    default:
      return '通话已断开'
  }
}

/** 格式化 JSON 内容 */
export function formatJson(content?: string) {
  if (!content) {
    return ''
  }
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    return content
  }
}
