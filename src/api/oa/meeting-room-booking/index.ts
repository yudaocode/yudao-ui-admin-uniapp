import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 会议室预定 */
export interface MeetingRoomBooking {
  id: number // 预定编号
  no?: string // 预定单号
  roomId?: number // 会议室编号
  roomName?: string // 会议室名称
  roomLocation?: string // 会议室位置
  roomType?: number // 会议室类型，字典 oa_meeting_room_type
  title?: string // 会议主题
  startTime?: number | string // 开始时间
  endTime?: number | string // 结束时间
  moderatorUserId?: number // 主持人编号
  moderatorName?: string // 主持人姓名
  attendeeUserIds?: number[] // 参会人编号列表
  attendeeNames?: string[] // 参会人姓名列表
  reminderType?: number // 会议提醒，字典 oa_meeting_room_reminder_type
  description?: string // 会议描述
  remark?: string // 备注
  fileUrls?: string[] // 附件地址列表
  creatorName?: string // 创建人姓名
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  useStatus?: number // 使用状态，字典 oa_meeting_room_use_status
  needApproval?: boolean // 是否需审批
  processInstanceId?: string // 流程实例编号
  createTime?: number // 创建时间
}

/** 获得本人会议室预定分页 */
export function getMeetingRoomBookingPage(params: Record<string, any>) {
  return http.get<PageResult<MeetingRoomBooking>>('/oa/meeting-room-booking/page', params)
}

/** 获得会议室预定详情 */
export function getMeetingRoomBooking(id: number) {
  return http.get<MeetingRoomBooking>('/oa/meeting-room-booking/get', { id })
}

/** 创建会议室预定草稿 */
export function createMeetingRoomBooking(data: Partial<MeetingRoomBooking>) {
  return http.post<number>('/oa/meeting-room-booking/create', data)
}

/** 更新会议室预定草稿 */
export function updateMeetingRoomBooking(data: Partial<MeetingRoomBooking>) {
  return http.put<boolean>('/oa/meeting-room-booking/update', data)
}

/** 删除会议室预定草稿 */
export function deleteMeetingRoomBooking(id: number) {
  return http.delete<boolean>(`/oa/meeting-room-booking/delete?id=${id}`)
}

/** 提交会议室预定 */
export function submitMeetingRoomBooking(id: number) {
  return http.put<boolean>(`/oa/meeting-room-booking/submit?id=${id}`)
}

/** 取消会议室预定 */
export function cancelMeetingRoomBooking(id: number) {
  return http.put<boolean>(`/oa/meeting-room-booking/cancel?id=${id}`)
}

/** 开始使用会议室预定 */
export function startMeetingRoomBooking(id: number) {
  return http.put<boolean>(`/oa/meeting-room-booking/start?id=${id}`)
}

/** 完成使用会议室预定 */
export function finishMeetingRoomBooking(id: number) {
  return http.put<boolean>(`/oa/meeting-room-booking/finish?id=${id}`)
}

/** 获得会议室日程，startTime/endTime 为起止时间字符串 */
export function getMeetingRoomBookingSchedule(roomId: number, startTime: string, endTime: string) {
  return http.get<MeetingRoomBooking[]>('/oa/meeting-room-booking/schedule', { roomId, startTime, endTime })
}
