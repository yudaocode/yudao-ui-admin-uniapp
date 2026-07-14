import type {
  ImRtcCallEndReason,
  ImRtcParticipantStatus,
} from '@/utils/constants'
import { ImConversationType, ImMessageType } from '@/utils/constants'

/** IM 协议枚举统一入口；定义复用项目级后端契约常量 */
export * from '@/utils/constants'

/** PC 端沿用的内容类型命名 */
export { ImMessageType as ImContentType }

export type ImConversationTypeValue = (typeof ImConversationType)[keyof typeof ImConversationType]
export type ImRtcCallEndReasonValue = (typeof ImRtcCallEndReason)[keyof typeof ImRtcCallEndReason]
export type ImRtcParticipantStatusValue = (typeof ImRtcParticipantStatus)[keyof typeof ImRtcParticipantStatus]

/** 判断是否好友关系通知 */
export function isFriendNotification(type: number) {
  return type >= ImMessageType.FRIEND_REQUEST_APPROVED && type <= ImMessageType.FRIEND_UPDATE
}

/** 判断是否加群申请通知 */
export function isGroupRequestNotification(type: number) {
  return type === ImMessageType.GROUP_REQUEST_RECEIVED
    || type === ImMessageType.GROUP_REQUEST_APPROVED
    || type === ImMessageType.GROUP_REQUEST_REJECTED
}

/** 判断是否媒体消息 */
export function isMediaMessageType(type: number) {
  const mediaTypes: number[] = [
    ImMessageType.IMAGE,
    ImMessageType.FILE,
    ImMessageType.VOICE,
    ImMessageType.VIDEO,
  ]
  return mediaTypes.includes(type)
}

/** 判断是否私聊会话 */
export function isPrivateConversation(type?: number) {
  return type === ImConversationType.PRIVATE
}

/** 判断是否群聊会话 */
export function isGroupConversation(type?: number) {
  return type === ImConversationType.GROUP
}

/** 判断是否频道会话 */
export function isChannelConversation(type?: number) {
  return type === ImConversationType.CHANNEL
}

/** IM WebSocket 外层帧类型 */
export const ImWebSocketMessageType = {
  NOTIFICATION: 'im-notification',
} as const

/** IM 转发模式 */
export const ImForwardMode = {
  SINGLE: 'single',
  MERGE: 'merge',
} as const

export type ImForwardModeValue = (typeof ImForwardMode)[keyof typeof ImForwardMode]
