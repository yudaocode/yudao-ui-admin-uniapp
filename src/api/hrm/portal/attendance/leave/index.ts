import type { AttendanceLeave } from '@/api/hrm/attendance/leave'
import { http } from '@/http/http'

/** 员工端请假申请创建请求 */
export interface PortalAttendanceLeaveCreateReq {
  type: string // 请假类型
  startTime: number // 请假开始时间
  endTime: number // 请假结束时间
  day: number // 请假天数
  reason: string // 请假事由
  remark?: string // 备注
}

/** 员工端请假申请取消请求 */
export interface PortalAttendanceLeaveCancelReq {
  id: number // 请假记录编号
  reason: string // 取消原因
}

/** 获得我的请假申请列表 */
export function getMyAttendanceLeaveList() {
  return http.get<AttendanceLeave[]>('/hrm/portal/attendance/leave/list')
}

/** 创建我的请假申请 */
export function createMyAttendanceLeave(data: PortalAttendanceLeaveCreateReq) {
  return http.post<number>('/hrm/portal/attendance/leave/create', data)
}

/** 取消我的请假申请 */
export function cancelMyAttendanceLeave(data: PortalAttendanceLeaveCancelReq) {
  return http.put<boolean>('/hrm/portal/attendance/leave/cancel', data)
}
