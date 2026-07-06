import type { PageParam, PageResult } from '@/http/types'
import type { CheckOrderDetail } from './detail'
import { http } from '@/http/http'

/** WMS 盘库单 */
export interface CheckOrder {
  id?: number
  no?: string
  orderTime?: string | number | Date
  status?: number
  remark?: string
  warehouseId?: number
  warehouseName?: string
  totalQuantity?: number
  totalPrice?: number
  actualPrice?: number
  details?: CheckOrderDetail[]
  createTime?: Date
  creator?: string
  creatorName?: string
  updateTime?: Date
  updater?: string
  updaterName?: string
}

/** 查询盘库单分页 */
export function getCheckOrderPage(params: PageParam) {
  return http.get<PageResult<CheckOrder>>('/wms/check-order/page', params)
}

/** 查询盘库单详情 */
export function getCheckOrder(id: number) {
  return http.get<CheckOrder>(`/wms/check-order/get?id=${id}`)
}

/** 查询盘库单明细 */
export function getCheckOrderDetailListByOrderId(orderId: number) {
  return http.get<CheckOrderDetail[]>(`/wms/check-order-detail/list-by-order-id?orderId=${orderId}`)
}

/** 新增盘库单 */
export function createCheckOrder(data: CheckOrder) {
  return http.post<number>('/wms/check-order/create', data)
}

/** 修改盘库单 */
export function updateCheckOrder(data: CheckOrder) {
  return http.put<boolean>('/wms/check-order/update', data)
}

/** 完成盘库 */
export function completeCheckOrder(id: number) {
  return http.put<boolean>(`/wms/check-order/complete?id=${id}`)
}

/** 作废盘库单 */
export function cancelCheckOrder(id: number) {
  return http.put<boolean>(`/wms/check-order/cancel?id=${id}`)
}

/** 删除盘库单 */
export function deleteCheckOrder(id: number) {
  return http.delete<boolean>(`/wms/check-order/delete?id=${id}`)
}
