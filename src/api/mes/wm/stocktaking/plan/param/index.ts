import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 盘点计划参数 */
export interface StockTakingPlanParam {
  id?: number
  planId?: number
  type?: number
  valueId?: number
  valueCode?: string
  valueName?: string
  remark?: string
}

/** 查询盘点计划参数详情 */
export function getStockTakingPlanParam(id: number) {
  return http.get<StockTakingPlanParam>(`/mes/wm/stocktaking-plan-param/get?id=${id}`)
}

/** 查询盘点计划参数分页 */
export function getStockTakingPlanParamPage(params: PageParam) {
  return http.get<PageResult<StockTakingPlanParam>>('/mes/wm/stocktaking-plan-param/page', params)
}

/** 新增盘点计划参数 */
export function createStockTakingPlanParam(data: StockTakingPlanParam) {
  return http.post<number>('/mes/wm/stocktaking-plan-param/create', data)
}

/** 修改盘点计划参数 */
export function updateStockTakingPlanParam(data: StockTakingPlanParam) {
  return http.put<boolean>('/mes/wm/stocktaking-plan-param/update', data)
}

/** 删除盘点计划参数 */
export function deleteStockTakingPlanParam(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-plan-param/delete?id=${id}`)
}
