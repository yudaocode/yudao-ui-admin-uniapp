import type { HomeCalendarItem } from '@/api/hrm/home'
import { http } from '@/http/http'

export type { HomeCalendarItem } from '@/api/hrm/home'

/** 获得员工端首页日历 */
export function getEmployeeHomeCalendar(params: { startDate: string, endDate: string }) {
  return http.get<HomeCalendarItem[]>('/hrm/portal/home/calendar', params)
}
