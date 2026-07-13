import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端通话记录 */
export interface ImManagerRtcCallVO {
  id: number
  room: string
  conversationType: number
  mediaType: number
  inviterUserId: number
  inviterNickname?: string
  groupId?: number
  groupName?: string
  status: number
  endReason?: number
  startTime: string
  acceptTime?: string
  endTime?: string
  createTime: string
}

/** IM 管理端通话参与者 */
export interface ImManagerRtcParticipantVO {
  id: number
  callId: number
  userId: number
  userNickname?: string
  role: number
  status: number
  inviteTime: string
  acceptTime?: string
  leaveTime?: string
}

/** 获取通话记录分页 */
export function getManagerRtcCallPage(params: PageParam) {
  return http.get<PageResult<ImManagerRtcCallVO>>('/im/manager/rtc/page', params)
}

/** 获取通话记录详情 */
export function getManagerRtcCall(id: number) {
  return http.get<ImManagerRtcCallVO>('/im/manager/rtc/get', { id })
}

/** 获取通话参与者列表 */
export function getManagerRtcCallParticipantList(id: number) {
  return http.get<ImManagerRtcParticipantVO[]>('/im/manager/rtc/participant-list', { id })
}
