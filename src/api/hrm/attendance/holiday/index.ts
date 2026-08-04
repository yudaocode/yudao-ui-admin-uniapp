import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 考勤节假日 */
export interface AttendanceHoliday {
  id?: number // 节假日编号
  date?: number | string // 日期
  type: number // 日期类型
  createTime?: Date | string | number // 创建时间
}

/** 获得考勤节假日分页 */
export function getAttendanceHolidayPage(params: PageParam) {
  return http.get<PageResult<AttendanceHoliday>>('/hrm/attendance/holiday/page', params)
}

/** 获得考勤节假日详情 */
export function getAttendanceHoliday(id: number) {
  return http.get<AttendanceHoliday>(`/hrm/attendance/holiday/get?id=${id}`)
}

/** 创建考勤节假日 */
export function createAttendanceHoliday(data: AttendanceHoliday) {
  return http.post<number>('/hrm/attendance/holiday/create', data)
}

/** 修改考勤节假日 */
export function updateAttendanceHoliday(data: AttendanceHoliday) {
  return http.put<boolean>('/hrm/attendance/holiday/update', data)
}

/** 删除考勤节假日 */
export function deleteAttendanceHoliday(id: number) {
  return http.delete<boolean>(`/hrm/attendance/holiday/delete?id=${id}`)
}
