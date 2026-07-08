import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 产品入库单 */
export interface WmProductReceipt {
  id?: number
  code?: string
  name?: string
  workOrderId?: number
  workOrderCode?: string
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  receiptDate?: string | number | Date
  status?: number
  remark?: string
  createTime?: Date
}

/** 查询产品入库单分页 */
export function getProductReceiptPage(params: PageParam) {
  return http.get<PageResult<WmProductReceipt>>('/mes/wm/product-receipt/page', params)
}

/** 查询产品入库单详情 */
export function getProductReceipt(id: number) {
  return http.get<WmProductReceipt>(`/mes/wm/product-receipt/get?id=${id}`)
}

/** 新增产品入库单 */
export function createProductReceipt(data: WmProductReceipt) {
  return http.post<number>('/mes/wm/product-receipt/create', data)
}

/** 修改产品入库单 */
export function updateProductReceipt(data: WmProductReceipt) {
  return http.put<boolean>('/mes/wm/product-receipt/update', data)
}

/** 删除产品入库单 */
export function deleteProductReceipt(id: number) {
  return http.delete<boolean>(`/mes/wm/product-receipt/delete?id=${id}`)
}

/** 提交产品入库单 */
export function submitProductReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/product-receipt/submit?id=${id}`)
}

/** 执行上架 */
export function stockProductReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/product-receipt/stock?id=${id}`)
}

/** 执行入库 */
export function finishProductReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/product-receipt/finish?id=${id}`)
}

/** 取消产品入库单 */
export function cancelProductReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/product-receipt/cancel?id=${id}`)
}

/** 校验产品入库单明细数量 */
export function checkProductReceiptQuantity(id: number) {
  return http.get<boolean>(`/mes/wm/product-receipt/check-quantity?id=${id}`)
}

/** 导出产品入库单 Excel */
export function exportProductReceipt(params: Record<string, any>) {
  return http.get<Blob>('/mes/wm/product-receipt/export-excel', params)
}
