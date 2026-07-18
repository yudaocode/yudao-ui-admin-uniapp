import type {
  ImConversationType,
  ImRtcCallEndReason,
  ImRtcParticipantStatus,
} from '@/utils/constants'
import { ImMessageType } from '@/utils/constants'

/** IM 协议枚举统一入口；定义复用项目级后端契约常量 */
export * from '@/utils/constants'

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
