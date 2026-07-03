import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 产品入库单行 */
export interface WmProductReceiptLine {
  id?: number
  receiptId: number
  itemId: number
  materialStockId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantity: number
  batchId?: number
  batchCode?: string
  remark?: string
  createTime?: Date
}

/** 查询产品入库单行分页 */
export function getProductReceiptLinePage(params: PageParam) {
  return http.get<PageResult<WmProductReceiptLine>>('/mes/wm/product-receipt-line/page', params)
}

/** 查询产品入库单行详情 */
export function getProductReceiptLine(id: number) {
  return http.get<WmProductReceiptLine>(`/mes/wm/product-receipt-line/get?id=${id}`)
}

/** 新增产品入库单行 */
export function createProductReceiptLine(data: WmProductReceiptLine) {
  return http.post<number>('/mes/wm/product-receipt-line/create', data)
}

/** 修改产品入库单行 */
export function updateProductReceiptLine(data: WmProductReceiptLine) {
  return http.put<boolean>('/mes/wm/product-receipt-line/update', data)
}

/** 删除产品入库单行 */
export function deleteProductReceiptLine(id: number) {
  return http.delete<boolean>(`/mes/wm/product-receipt-line/delete?id=${id}`)
}
