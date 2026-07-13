import { http } from '@/http/http'

/** IM 创建新通话请求 */
export interface ImRtcCallCreateReq {
  conversationType: number
  mediaType: number
  groupId?: number
  inviteeIds: number[]
}

/** IM 通话中追加邀请 */
export interface ImRtcCallInviteReq {
  room: string
  inviteeIds: number[]
}

/** IM 通话会话 */
export interface ImRtcCallRespVO {
  room: string
  livekitUrl: string
  token?: string
  conversationType: number
  mediaType: number
  status: number
  endReason?: number
  inviterId: number
  groupId?: number
  inviteeIds?: number[]
  joinedUserIds?: number[]
}

/** IM 群活跃通话 */
export interface ImRtcGroupCallRespVO {
  room: string
  groupId: number
  mediaType: number
  inviterId: number
  joinedUserIds?: number[]
  inviteeIds?: number[]
}

/** 创建新通话 */
export function createCall(data: ImRtcCallCreateReq) {
  return http.post<ImRtcCallRespVO>('/im/rtc/create', data)
}

/** 通话中追加邀请 */
export function inviteCall(data: ImRtcCallInviteReq) {
  return http.post<boolean>('/im/rtc/invite', data)
}

/** 加入已有群通话 */
export function joinCall(room: string) {
  return http.post<ImRtcCallRespVO>('/im/rtc/join', undefined, { room })
}

/** 接听通话 */
export function acceptCall(room: string) {
  return http.post<ImRtcCallRespVO>('/im/rtc/accept', undefined, { room })
}

/** 拒绝通话 */
export function rejectCall(room: string) {
  return http.post<boolean>('/im/rtc/reject', undefined, { room })
}

/** 取消邀请 */
export function cancelCall(room: string) {
  return http.post<boolean>('/im/rtc/cancel', undefined, { room })
}

/** 离开通话 */
export function leaveCall(room: string) {
  return http.post<boolean>('/im/rtc/leave', undefined, { room })
}

/** 振铃超时检查 */
export function noAnswerCallCheck(room: string) {
  return http.post<boolean>('/im/rtc/no-answer-call-check', undefined, { room })
}

/** 查询当前进行中的群通话 */
export function getActiveCall(groupId: number) {
  return http.get<ImRtcGroupCallRespVO | null>('/im/rtc/get-active-call', { groupId })
}
