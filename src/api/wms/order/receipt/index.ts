import type { PageParam, PageResult } from '@/http/types'
import type { ReceiptOrderDetail } from './detail'
import { http } from '@/http/http'

/** WMS 入库单 */
export interface ReceiptOrder {
  id?: number
  no?: string
  type?: number
  orderTime?: string | number | Date
  status?: number
  bizOrderNo?: string
  merchantId?: number
  merchantName?: string
  remark?: string
  warehouseId?: number
  warehouseName?: string
  totalQuantity?: number
  totalPrice?: number
  details?: ReceiptOrderDetail[]
  createTime?: Date
  creator?: string
  creatorName?: string
  updateTime?: Date
  updater?: string
  updaterName?: string
}

/** 查询入库单分页 */
export function getReceiptOrderPage(params: PageParam) {
  return http.get<PageResult<ReceiptOrder>>('/wms/receipt-order/page', params)
}

/** 查询入库单详情 */
export function getReceiptOrder(id: number) {
  return http.get<ReceiptOrder>(`/wms/receipt-order/get?id=${id}`)
}

/** 查询入库单明细 */
export function getReceiptOrderDetailListByOrderId(orderId: number) {
  return http.get<ReceiptOrderDetail[]>(`/wms/receipt-order-detail/list-by-order-id?orderId=${orderId}`)
}

/** 新增入库单 */
export function createReceiptOrder(data: ReceiptOrder) {
  return http.post<number>('/wms/receipt-order/create', data)
}

/** 修改入库单 */
export function updateReceiptOrder(data: ReceiptOrder) {
  return http.put<boolean>('/wms/receipt-order/update', data)
}

/** 完成入库 */
export function completeReceiptOrder(id: number) {
  return http.put<boolean>(`/wms/receipt-order/complete?id=${id}`)
}

/** 作废入库单 */
export function cancelReceiptOrder(id: number) {
  return http.put<boolean>(`/wms/receipt-order/cancel?id=${id}`)
}

/** 删除入库单 */
export function deleteReceiptOrder(id: number) {
  return http.delete<boolean>(`/wms/receipt-order/delete?id=${id}`)
}
