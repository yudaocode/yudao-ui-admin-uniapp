import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 库存台账 */
export interface WmMaterialStock {
  id: number
  itemTypeId?: number
  itemId: number
  itemCode: string
  itemName: string
  specification?: string
  unitMeasureName?: string
  batchId?: number
  batchCode?: string
  warehouseId: number
  warehouseCode?: string
  warehouseName: string
  locationId: number
  locationName: string
  areaId?: number
  areaName?: string
  vendorId?: number
  vendorName?: string
  quantity: number
  receiptTime?: string | number | Date
  frozen: boolean
  createTime?: Date
}

/** 查询库存台账分页 */
export function getMaterialStockPage(params: PageParam) {
  return http.get<PageResult<WmMaterialStock>>('/mes/wm/material-stock/page', params)
}

/** 查询库存记录详情 */
export function getMaterialStock(id: number) {
  return http.get<WmMaterialStock>(`/mes/wm/material-stock/get?id=${id}`)
}

/** 更新库存冻结状态 */
export function updateMaterialStockFrozen(data: { frozen: boolean, id: number }) {
  return http.put<boolean>('/mes/wm/material-stock/update-frozen', data)
}

/** 导出库存台账 Excel */
export function exportMaterialStock(params: Record<string, any>) {
  return http.get<Blob>('/mes/wm/material-stock/export-excel', params)
}
