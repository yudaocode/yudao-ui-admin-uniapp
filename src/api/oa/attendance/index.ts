import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OA 考勤记录 */
export interface Attendance {
  id?: number // 考勤记录编号
  userId?: number // 用户编号
  userName?: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  type: number // 考勤类型
  status: number // 考勤状态
  attendanceTime: string // 考勤时间
  attendanceIp?: string // 考勤 IP
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** OA 考勤周报每日打卡 */
export interface AttendanceDaily {
  date: string // 日期
  clockInId?: number // 上班打卡记录编号
  clockInTime?: string // 上班打卡时间
  clockInStatus?: number // 上班打卡状态
  clockOutId?: number // 下班打卡记录编号
  clockOutTime?: string // 下班打卡时间
  clockOutStatus?: number // 下班打卡状态
}

/** OA 考勤周报行 */
export interface AttendanceWeekReport {
  userId: number // 用户编号
  userName?: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  dailyAttendances: AttendanceDaily[] // 每日打卡列表
}

/** OA 考勤月报行 */
export interface AttendanceMonthReport {
  userId: number // 用户编号
  userName?: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  clockInCount: number // 上班打卡次数
  clockOutCount: number // 下班打卡次数
  normalCount: number // 正常次数
  lateCount: number // 迟到次数
  earlyCount: number // 早退次数
  leaveDays: number // 请假天数
  travelDays: number // 出差天数
  absentDays: number // 旷工天数
}

/** 执行当前用户打卡：首次为上班打卡，其后为下班打卡 */
export function clockAttendance() {
  return http.post<number>('/oa/attendance/clock')
}

/** 查询我的考勤分页 */
export function getMyAttendancePage(params: PageParam) {
  return http.get<PageResult<Attendance>>('/oa/attendance/my-page', params)
}

/** 查询我的今日考勤列表 */
export function getMyTodayAttendanceList() {
  return http.get<Attendance[]>('/oa/attendance/my-today-list')
}

/** 查询考勤分页，限管理范围内成员 */
export function getAttendancePage(params: PageParam) {
  return http.get<PageResult<Attendance>>('/oa/attendance/page', params)
}

/** 查询考勤详情 */
export function getAttendance(id: number) {
  return http.get<Attendance>(`/oa/attendance/get?id=${id}`)
}

/** 更新考勤记录状态和备注 */
export function updateAttendance(data: { id: number, status: number, remark?: string }) {
  return http.put<boolean>('/oa/attendance/update', data)
}

/** 删除考勤记录 */
export function deleteAttendance(id: number) {
  return http.delete<boolean>(`/oa/attendance/delete?id=${id}`)
}

/** 查询考勤周报：startDate 为周内任意一天 */
export function getAttendanceWeekReport(params: { startDate: string, userId?: number }) {
  return http.get<AttendanceWeekReport[]>('/oa/attendance/week-report', params)
}

/** 查询考勤月报 */
export function getAttendanceMonthReport(params: { year: number, month: number, userId?: number }) {
  return http.get<AttendanceMonthReport[]>('/oa/attendance/month-report', params)
}
