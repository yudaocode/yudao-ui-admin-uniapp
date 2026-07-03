import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 点检保养方案 */
export interface DvCheckPlan {
  id?: number
  code: string
  name: string
  type: number
  startDate?: Date
  endDate?: Date
  cycleType: number
  cycleCount: number
  status: number
  remark?: string
  createTime?: Date
}

/** 查询点检保养方案分页 */
export function getCheckPlanPage(params: PageParam) {
  return http.get<PageResult<DvCheckPlan>>('/mes/dv/check-plan/page', params)
}

/** 查询点检保养方案详情 */
export function getCheckPlan(id: number) {
  return http.get<DvCheckPlan>(`/mes/dv/check-plan/get?id=${id}`)
}

/** 新增点检保养方案 */
export function createCheckPlan(data: DvCheckPlan) {
  return http.post<number>('/mes/dv/check-plan/create', data)
}

/** 修改点检保养方案 */
export function updateCheckPlan(data: DvCheckPlan) {
  return http.put<boolean>('/mes/dv/check-plan/update', data)
}

/** 启用点检保养方案 */
export function enableCheckPlan(id: number) {
  return http.put<boolean>(`/mes/dv/check-plan/enable?id=${id}`)
}

/** 停用点检保养方案 */
export function disableCheckPlan(id: number) {
  return http.put<boolean>(`/mes/dv/check-plan/disable?id=${id}`)
}

/** 删除点检保养方案 */
export function deleteCheckPlan(id: number) {
  return http.delete<boolean>(`/mes/dv/check-plan/delete?id=${id}`)
}

/** 导出点检保养方案 Excel */
export function exportCheckPlan(params: Record<string, any>) {
  return http.get<Blob>('/mes/dv/check-plan/export-excel', params)
}
