import type { AttendanceMonthDetail } from '@/api/hrm/attendance/statistics'
import { http } from '@/http/http'
import { downloadApiFile } from '@/utils/download'

/** 员工端月度考勤详情 */
export type PortalAttendanceMonthDetail = AttendanceMonthDetail

/** 获得我的月度考勤详情 */
export function getPortalAttendanceMonthDetail(params?: { year?: number, month?: number }) {
  return http.get<PortalAttendanceMonthDetail>('/hrm/portal/attendance/statistics/month-detail', params)
}

/** 导出我的月度考勤日报 */
export function exportPortalAttendanceMonthDetail(year: number, month: number) {
  return downloadApiFile(
    '/hrm/portal/attendance/statistics/export-excel',
    { year, month },
    `${year}年${String(month).padStart(2, '0')}月个人考勤日报.xls`,
  )
}
