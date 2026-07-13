import type {
  ImCardMessage,
  ImFaceMessage,
  ImFileMessage,
  ImMaterialMessage,
  ImMediaMessage,
  ImMergeMessage,
  ImRtcCallTipMessage,
  ImTextMessage,
} from './message'
import {
  ImConversationType,
  ImMessageType,
  ImRtcCallEndReason,
  ImRtcCallMediaType,
  isFriendChatTip,
  isGroupNotification,
} from '@/utils/constants'
import { parseMessage } from './message'

const RTC_END_REASON_TEXT: Record<number, string> = { // 通话结束原因文案
  [ImRtcCallEndReason.HANGUP]: '通话结束',
  [ImRtcCallEndReason.REJECT]: '已拒绝',
  [ImRtcCallEndReason.CANCEL]: '已取消',
  [ImRtcCallEndReason.NO_ANSWER]: '无人接听',
  [ImRtcCallEndReason.BUSY]: '对方正忙',
  [ImRtcCallEndReason.ERROR]: '通话异常',
}

/** 获取 RTC 通话摘要 */
function getRtcMessageSummary(type: number, content?: string) {
  const rtc = parseMessage<ImRtcCallTipMessage>(content)
  const mediaName = rtc?.mediaType === ImRtcCallMediaType.VIDEO ? '视频' : '语音'
  if (type === ImMessageType.RTC_CALL_START) {
    return `${mediaName}通话`
  }
  if (rtc?.conversationType === ImConversationType.GROUP) {
    return `${mediaName}通话已结束`
  }
  if (rtc?.durationSeconds != null) {
    const minutes = Math.floor(rtc.durationSeconds / 60)
    const seconds = rtc.durationSeconds % 60
    return `通话时长 ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return RTC_END_REASON_TEXT[rtc?.endReason || 0] || '通话已结束'
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
  if (type === ImMessageType.RTC_CALL_START || type === ImMessageType.RTC_CALL_END) {
    return getRtcMessageSummary(type, content)
  }
  const payload = parseMessage<Record<string, any>>(content)
  return payload?.content ? String(payload.content) : content || ''
}
