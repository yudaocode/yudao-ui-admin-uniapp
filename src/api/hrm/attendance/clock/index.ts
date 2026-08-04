import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 考勤打卡记录 */
export interface AttendanceClock {
  id?: number // 打卡记录编号
  employeeId?: number // 打卡员工编号
  clockTime?: Date | string | number // 打卡时间
  type: number // 打卡类型
  attendanceTime?: Date | string | number // 应打卡时间
  sourceType?: number // 打卡来源
  status?: number // 打卡状态
  stage?: number // 打卡阶段
  address?: string // 打卡地址
  longitude?: number // 经度
  latitude?: number // 纬度
  ssid?: string // WiFi 名称
  mac?: string // WiFi MAC 地址
  remark?: string // 备注
  employeeName?: string // 员工姓名
  jobNumber?: string // 工号
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 职位名称
  createTime?: Date | string | number // 创建时间
}

/** 员工实际班次与允许打卡时间 */
export interface AttendanceClockShift {
  startTime: Date | string | number // 上班时间
  endTime: Date | string | number // 下班时间
  clockInStartTime: Date | string | number // 上班打卡开始时间
  clockInEndTime: Date | string | number // 上班打卡结束时间
  clockOutStartTime: Date | string | number // 下班打卡开始时间
  clockOutEndTime: Date | string | number // 下班打卡结束时间
}

/** 查询考勤打卡分页 */
export function getAttendanceClockPage(params: PageParam) {
  return http.get<PageResult<AttendanceClock>>('/hrm/attendance/clock/page', params)
}

/** 查询考勤打卡详情 */
export function getAttendanceClock(id: number) {
  return http.get<AttendanceClock>(`/hrm/attendance/clock/get?id=${id}`)
}

/** 获得员工实际班次和允许打卡时间 */
export function getAttendanceClockShift(params: {
  employeeId: number
  attendanceTime: string
}) {
  return http.get<AttendanceClockShift | undefined>('/hrm/attendance/clock/get-shift', params)
}

/** 新增考勤打卡 */
export function createAttendanceClock(data: AttendanceClock) {
  return http.post<number>('/hrm/attendance/clock/create', data)
}

/** 修改考勤打卡 */
export function updateAttendanceClock(data: AttendanceClock) {
  return http.put<boolean>('/hrm/attendance/clock/update', data)
}

/** 删除考勤打卡 */
export function deleteAttendanceClock(id: number) {
  return http.delete<boolean>(`/hrm/attendance/clock/delete?id=${id}`)
}

/** 批量删除考勤打卡 */
export function deleteAttendanceClockList(ids: number[]) {
  return http.delete<boolean>('/hrm/attendance/clock/delete-list', undefined, { ids: ids.join(',') })
}
