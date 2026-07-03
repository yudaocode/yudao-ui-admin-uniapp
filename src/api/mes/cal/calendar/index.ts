import { http } from '@/http/http'

/** 排班日历 - 班组排班项 */
export interface CalCalendarTeamShiftItem {
  teamId: number // 班组编号
  teamName: string // 班组名称
  shiftId: number // 班次编号
  shiftName: string // 班次名称
  sort: number // 班次顺序
}

/** 排班日历 - 日历天 */
export interface CalCalendarDay {
  day: string // yyyy-MM-dd
  shiftType: number // 轮班方式
  teamShifts: CalCalendarTeamShiftItem[] // 当天班组排班
}

/** 查询排班日历列表 */
export function getCalendarList(params: Record<string, any>) {
  return http.get<CalCalendarDay[]>(`/mes/cal/calendar/list`, params)
}
