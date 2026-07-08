import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 杂项入库单行 */
export interface WmMiscReceiptLine {
  id?: number
  receiptId?: number
  sourceDocLineId?: number
  materialStockId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantity?: number
  batchId?: number
  batchCode?: string
  warehouseId?: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  remark?: string
  createTime?: Date
}

/** 查询杂项入库单行分页 */
export function getMiscReceiptLinePage(params: PageParam) {
  return http.get<PageResult<WmMiscReceiptLine>>('/mes/wm/misc-receipt-line/page', params)
}

/** 查询杂项入库单行详情 */
export function getMiscReceiptLine(id: number) {
  return http.get<WmMiscReceiptLine>(`/mes/wm/misc-receipt-line/get?id=${id}`)
}

/** 查询杂项入库单行列表 */
export function getMiscReceiptLineListByReceiptId(receiptId: number) {
  return http.get<WmMiscReceiptLine[]>(`/mes/wm/misc-receipt-line/list-by-receipt-id?receiptId=${receiptId}`)
}

/** 新增杂项入库单行 */
export function createMiscReceiptLine(data: WmMiscReceiptLine) {
  return http.post<number>('/mes/wm/misc-receipt-line/create', data)
}

/** 修改杂项入库单行 */
export function updateMiscReceiptLine(data: WmMiscReceiptLine) {
  return http.put<boolean>('/mes/wm/misc-receipt-line/update', data)
}

/** 删除杂项入库单行 */
export function deleteMiscReceiptLine(id: number) {
  return http.delete<boolean>(`/mes/wm/misc-receipt-line/delete?id=${id}`)
}
