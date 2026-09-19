import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 会议室 */
export interface MeetingRoom {
  id: number // 会议室编号
  name: string // 会议室名称
  location?: string // 会议室位置
  type: number // 会议室类型，字典 oa_meeting_room_type
  managerUserId?: number // 负责人编号
  managerName?: string // 负责人姓名
  managerPhone?: string // 负责人电话
  status?: number // 可用状态，字典 oa_meeting_room_status
  picUrl?: string // 会议室图片
  seatCount?: number // 座位数
  equipments?: number[] // 设备列表，字典 oa_meeting_room_equipment
  allowBooking?: boolean // 允许预定
  needApproval?: boolean // 预定需审批
  bookingScope?: number // 可预定范围，字典 oa_meeting_room_booking_scope
  bookingUserIds?: number[] // 可预定成员编号列表
  sort?: number // 显示顺序
  remark?: string // 备注
  fileUrls?: string[] // 附件地址列表
  createTime?: number // 创建时间
}

/** 创建会议室 */
export function createMeetingRoom(data: Partial<MeetingRoom>) {
  return http.post<number>('/oa/meeting-room/create', data)
}

/** 更新会议室 */
export function updateMeetingRoom(data: Partial<MeetingRoom>) {
  return http.put<boolean>('/oa/meeting-room/update', data)
}

/** 删除会议室 */
export function deleteMeetingRoom(id: number) {
  return http.delete<boolean>(`/oa/meeting-room/delete?id=${id}`)
}

/** 获得会议室详情 */
export function getMeetingRoom(id: number) {
  return http.get<MeetingRoom>('/oa/meeting-room/get', { id })
}

/** 获得会议室分页 */
export function getMeetingRoomPage(params: Record<string, any>) {
  return http.get<PageResult<MeetingRoom>>('/oa/meeting-room/page', params)
}

/** 获得可预定会议室分页 */
export function getBookableMeetingRoomPage(params: Record<string, any>) {
  return http.get<PageResult<MeetingRoom>>('/oa/meeting-room/bookable-page', params)
}
