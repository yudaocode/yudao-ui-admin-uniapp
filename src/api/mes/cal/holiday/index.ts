import { http } from '@/http/http'

/** MES 假期设置 */
export interface CalHoliday {
  id?: number // 编号
  day: string // 日期
  type: number // 日期类型
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询假期设置列表（支持可选日期范围过滤） */
export function getHolidayList(params?: Record<string, any>) {
  return http.get<CalHoliday[]>(`/mes/cal/holiday/list`, params)
}

/** 根据日期查询假期设置 */
export function getHolidayByDay(day: string) {
  return http.get<CalHoliday>(`/mes/cal/holiday/get-by-day`, { day })
}

/** 保存假期设置（含 upsert 逻辑） */
export function saveHoliday(data: CalHoliday) {
  return http.post<number>(`/mes/cal/holiday/save`, data)
}
