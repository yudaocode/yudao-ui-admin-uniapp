import { http } from '@/http/http'

/** MES 计划班次 */
export interface CalPlanShift {
  id?: number
  planId: number // 排班计划编号
  sort: number // 显示顺序
  name: string // 班次名称
  startTime: string // 开始时间
  endTime: string // 结束时间
  remark?: string // 备注
}

/** 查询指定排班计划的班次列表 */
export function getPlanShiftListByPlan(planId: number) {
  return http.get<CalPlanShift[]>(`/mes/cal/plan-shift/list-by-plan?planId=${planId}`)
}

/** 新增计划班次 */
export function createPlanShift(data: CalPlanShift) {
  return http.post<number>(`/mes/cal/plan-shift/create`, data)
}

/** 修改计划班次 */
export function updatePlanShift(data: CalPlanShift) {
  return http.put<boolean>(`/mes/cal/plan-shift/update`, data)
}

/** 删除计划班次 */
export function deletePlanShift(id: number) {
  return http.delete<boolean>(`/mes/cal/plan-shift/delete?id=${id}`)
}
