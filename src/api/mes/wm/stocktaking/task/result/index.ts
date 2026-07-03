import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 盘点结果 */
export interface StockTakingResult {
  id?: number
  taskId?: number
  lineId?: number
  materialStockId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  batchId?: number
  batchCode?: string
  warehouseId?: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  quantity?: number
  takingQuantity?: number
  remark?: string
  createTime?: Date
}

/** 查询盘点结果分页 */
export function getStockTakingResultPage(params: PageParam) {
  return http.get<PageResult<StockTakingResult>>('/mes/wm/stocktaking-task-result/page', params)
}

/** 查询盘点结果详情 */
export function getStockTakingResult(id: number) {
  return http.get<StockTakingResult>('/mes/wm/stocktaking-task-result/get', { id })
}

/** 新增盘点结果 */
export function createStockTakingResult(data: StockTakingResult) {
  return http.post<number>('/mes/wm/stocktaking-task-result/create', data)
}

/** 修改盘点结果 */
export function updateStockTakingResult(data: StockTakingResult) {
  return http.put<boolean>('/mes/wm/stocktaking-task-result/update', data)
}

/** 删除盘点结果 */
export function deleteStockTakingResult(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-task-result/delete?id=${id}`)
}
