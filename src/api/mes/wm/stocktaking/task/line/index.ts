import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 盘点任务清单行 */
export interface StockTakingTaskLine {
  id?: number
  taskId: number
  materialStockId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  batchId?: number
  batchCode?: string
  quantity?: number
  takingQuantity?: number
  differenceQuantity?: number
  warehouseId?: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  status?: number
  remark?: string
}

/** MES 盘点任务清单行精简信息 */
export interface StockTakingTaskLineSimple {
  id: number
  itemId: number
  itemCode: string
  itemName: string
  specification?: string
  unitMeasureName?: string
  batchCode?: string
  warehouseId: number
  warehouseName: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  quantity: number
}

/** 查询盘点任务清单行分页 */
export function getStockTakingTaskLinePage(params: PageParam) {
  return http.get<PageResult<StockTakingTaskLine>>('/mes/wm/stocktaking-task-line/page', params)
}

/** 查询盘点任务清单行精简列表 */
export function getStockTakingTaskLineSimpleList(taskId: number) {
  return http.get<StockTakingTaskLine[]>('/mes/wm/stocktaking-task-line/simple-list', { taskId })
}

/** 查询盘点任务清单行详情 */
export function getStockTakingTaskLine(id: number) {
  return http.get<StockTakingTaskLine>('/mes/wm/stocktaking-task-line/get', { id })
}

/** 新增盘点任务清单行 */
export function createStockTakingTaskLine(data: StockTakingTaskLine) {
  return http.post<number>('/mes/wm/stocktaking-task-line/create', data)
}

/** 修改盘点任务清单行 */
export function updateStockTakingTaskLine(data: StockTakingTaskLine) {
  return http.put<boolean>('/mes/wm/stocktaking-task-line/update', data)
}

/** 删除盘点任务清单行 */
export function deleteStockTakingTaskLine(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-task-line/delete?id=${id}`)
}
