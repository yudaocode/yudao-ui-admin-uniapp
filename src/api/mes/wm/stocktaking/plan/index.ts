import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 盘点方案 */
export interface StockTakingPlan {
  id?: number
  code: string
  name: string
  type: number
  startTime?: string | Date
  endTime?: string | Date
  blindFlag: boolean
  frozen: boolean
  status?: number
  remark?: string
  createTime?: Date
}

/** 盘点方案参数 */
export interface StockTakingPlanParam {
  id?: number
  planId: number
  type: number
  valueId?: number
  valueCode?: string
  valueName?: string
  remark?: string
}

/** 更新盘点方案状态 */
export function updateStockTakingPlanStatus(id: number, status: number) {
  return http.put<boolean>(`/mes/wm/stocktaking-plan/update-status?id=${id}&status=${status}`)
}

/** 获取盘点方案分页 */
export function getStockTakingPlanPage(params: PageParam) {
  return http.get<PageResult<StockTakingPlan>>('/mes/wm/stocktaking-plan/page', params)
}

/** 获取盘点方案详情 */
export function getStockTakingPlan(id: number) {
  return http.get<StockTakingPlan>(`/mes/wm/stocktaking-plan/get?id=${id}`)
}

/** 创建盘点方案 */
export function createStockTakingPlan(data: StockTakingPlan) {
  return http.post<number>('/mes/wm/stocktaking-plan/create', data)
}

/** 修改盘点方案 */
export function updateStockTakingPlan(data: StockTakingPlan) {
  return http.put<boolean>('/mes/wm/stocktaking-plan/update', data)
}

/** 删除盘点方案 */
export function deleteStockTakingPlan(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-plan/delete?id=${id}`)
}

/** 导出盘点方案 */
export function exportStockTakingPlan(params: Record<string, any>) {
  return http.get<Blob>('/mes/wm/stocktaking-plan/export-excel', params)
}

/** 获取盘点方案参数分页 */
export function getStockTakingPlanParamPage(params: PageParam) {
  return http.get<PageResult<StockTakingPlanParam>>('/mes/wm/stocktaking-plan-param/page', params)
}

/** 获取盘点方案参数详情 */
export function getStockTakingPlanParam(id: number) {
  return http.get<StockTakingPlanParam>(`/mes/wm/stocktaking-plan-param/get?id=${id}`)
}

/** 创建盘点方案参数 */
export function createStockTakingPlanParam(data: StockTakingPlanParam) {
  return http.post<number>('/mes/wm/stocktaking-plan-param/create', data)
}

/** 修改盘点方案参数 */
export function updateStockTakingPlanParam(data: StockTakingPlanParam) {
  return http.put<boolean>('/mes/wm/stocktaking-plan-param/update', data)
}

/** 删除盘点方案参数 */
export function deleteStockTakingPlanParam(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-plan-param/delete?id=${id}`)
}
