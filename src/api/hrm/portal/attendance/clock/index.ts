import type { AttendanceClock } from '@/api/hrm/attendance/clock'
import { http } from '@/http/http'

/** 获得我的考勤记录列表 */
export function getMyAttendanceClockList(params?: { year?: number, month?: number }) {
  return http.get<AttendanceClock[]>('/hrm/portal/attendance/clock/list', params)
}
