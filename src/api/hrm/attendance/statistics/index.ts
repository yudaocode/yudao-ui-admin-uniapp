import type { PageParam, PageResult } from '@/http/types'
import type { AttendanceClock } from '@/api/hrm/attendance/clock'
import type { AttendanceLeave } from '@/api/hrm/attendance/leave'
import { http } from '@/http/http'

/** 月度考勤汇总 */
export interface AttendanceMonthRecord {
  employeeId: number // 员工编号
  employeeName: string // 员工姓名
  jobNumber?: string // 工号
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 职位名称
  attendanceGroupName?: string // 考勤组名称
  entryTime?: Date | string | number // 入职时间
  employeeStatus?: number // 员工状态
  workCity?: string // 工作城市
  year: number // 年份
  month: number // 月份
  attendDays: number // 应出勤天数
  actualDays: number // 实际出勤天数
  lateMinute: number // 迟到分钟数
  lateCount: number // 迟到次数
  earlyMinute: number // 早退分钟数
  earlyCount: number // 早退次数
  misscardCount: number // 缺卡次数
  absenteeismDays: number // 旷工天数
  absenteeismMinutes: number // 旷工分钟数
  leaveDays: number // 请假天数
  leaveMinutes: number // 请假分钟数
  lateDeductAmount: number // 迟到扣款
  earlyDeductAmount: number // 早退扣款
  misscardDeductAmount: number // 缺卡扣款
  absenteeismDeductAmount: number // 旷工扣款
  attendanceDeductAmount: number // 考勤扣款合计
  fullAttendance: boolean // 是否全勤
}

/** 每日打卡概况展示项 */
export interface AttendanceDailyOverviewItem {
  type?: string // 打卡类型
  time?: string // 打卡时间
  status?: string // 打卡状态
  text?: string // 考勤结果
}

/** 每日打卡概况 */
export interface AttendanceDailyOverview {
  clocks: AttendanceClock[] // 打卡记录
  attendanceResult?: string // 考勤结果
  overviews: AttendanceDailyOverviewItem[] // 打卡概况展示项
}

/** 月度每日考勤概览（打卡概况行） */
export interface AttendanceMonthDailyOverview {
  employeeId: number // 员工编号
  employeeName: string // 员工姓名
  jobNumber?: string // 工号
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 职位名称
  year: number // 年份
  month: number // 月份
  dailyClockMap: Record<string, AttendanceDailyOverview> // 每日打卡概况；Key 为 YYYY-MM-DD
}

/** 每日考勤明细 */
export interface AttendanceDailyDetail {
  employeeId: number // 员工编号
  employeeName?: string // 员工姓名
  jobNumber?: string // 工号
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 职位名称
  attendanceTime: Date | string | number // 考勤时间
  shiftName?: string // 班次名称
  scheduled?: boolean // 是否排班
  requiredClockCount?: number // 应打卡次数
  scheduledMinutes?: number // 应出勤分钟数
  misscardCount?: number // 缺卡次数
  absenteeism?: boolean // 是否旷工
  absenteeismMinutes?: number // 旷工分钟数
  absenteeismDays?: number // 旷工天数
  leaveStatus?: boolean // 是否请假
  leaveMinutes?: number // 请假分钟数
  leaveDays?: number // 请假天数
  attendanceResult?: string // 考勤结果
  lateCount: number // 迟到次数
  lateMinutes?: number // 迟到分钟数
  earlyCount: number // 早退次数
  earlyMinutes?: number // 早退分钟数
  clockList: AttendanceClock[] // 打卡记录
}

/** 月度考勤详情 */
export interface AttendanceMonthDetail {
  summary: AttendanceMonthRecord // 月度汇总
  dailyDetails: AttendanceDailyDetail[] // 每日明细
  leaves: AttendanceLeave[] // 请假记录
}

/** 查询月度考勤汇总分页 */
export function getAttendanceMonthRecordPage(params: PageParam) {
  return http.get<PageResult<AttendanceMonthRecord>>('/hrm/attendance/statistics/month-record-page', params)
}

/** 查询月度打卡概况分页 */
export function getAttendanceMonthDailyOverviewPage(params: PageParam) {
  return http.get<PageResult<AttendanceMonthDailyOverview>>(
    '/hrm/attendance/statistics/month-daily-page',
    params,
  )
}

/** 查询月度考勤详情 */
export function getAttendanceMonthDetail(params: {
  employeeId: number
  year: number
  month: number
}) {
  return http.get<AttendanceMonthDetail>('/hrm/attendance/statistics/month-detail', params)
}

/** 查询每日考勤明细 */
export function getAttendanceDailyDetail(params: {
  employeeId: number
  attendanceTime: string
}) {
  return http.get<AttendanceDailyDetail>('/hrm/attendance/statistics/daily-detail', params)
}
