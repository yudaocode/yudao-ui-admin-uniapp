import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 排班计划 */
export interface CalPlan {
  id?: number
  code: string // 计划编码
  name: string // 计划名称
  calendarType?: number // 班组类型
  startDate?: string | number | Date // 开始日期
  endDate?: string | number | Date // 结束日期
  shiftType?: number // 轮班方式
  shiftMethod?: number // 倒班方式
  shiftCount?: number // 倒班天数
  status?: number // 状态
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询排班计划分页 */
export function getPlanPage(params: PageParam) {
  return http.get<PageResult<CalPlan>>(`/mes/cal/plan/page`, params)
}

/** 查询排班计划详情 */
export function getPlan(id: number) {
  return http.get<CalPlan>(`/mes/cal/plan/get?id=${id}`)
}

/** 新增排班计划 */
export function createPlan(data: CalPlan) {
  return http.post<number>(`/mes/cal/plan/create`, data)
}

/** 修改排班计划 */
export function updatePlan(data: CalPlan) {
  return http.put<boolean>(`/mes/cal/plan/update`, data)
}

/** 确认排班计划 */
export function confirmPlan(id: number) {
  return http.put<boolean>(`/mes/cal/plan/confirm?id=${id}`)
}

/** 删除排班计划 */
export function deletePlan(id: number) {
  return http.delete<boolean>(`/mes/cal/plan/delete?id=${id}`)
}
