import type { PageParam, PageResult } from '@/http/types'
import type { MovementOrderDetail } from './detail'
import { http } from '@/http/http'

/** WMS 移库单 */
export interface MovementOrder {
  id?: number
  no?: string
  orderTime?: string | number | Date
  status?: number
  remark?: string
  sourceWarehouseId?: number
  sourceWarehouseName?: string
  targetWarehouseId?: number
  targetWarehouseName?: string
  totalQuantity?: number
  totalPrice?: number
  details?: MovementOrderDetail[]
  createTime?: Date
  creator?: string
  creatorName?: string
  updateTime?: Date
  updater?: string
  updaterName?: string
}

/** 查询移库单分页 */
export function getMovementOrderPage(params: PageParam) {
  return http.get<PageResult<MovementOrder>>('/wms/movement-order/page', params)
}

/** 查询移库单详情 */
export function getMovementOrder(id: number) {
  return http.get<MovementOrder>(`/wms/movement-order/get?id=${id}`)
}

/** 查询移库单明细 */
export function getMovementOrderDetailListByOrderId(orderId: number) {
  return http.get<MovementOrderDetail[]>(`/wms/movement-order-detail/list-by-order-id?orderId=${orderId}`)
}

/** 新增移库单 */
export function createMovementOrder(data: MovementOrder) {
  return http.post<number>('/wms/movement-order/create', data)
}

/** 修改移库单 */
export function updateMovementOrder(data: MovementOrder) {
  return http.put<boolean>('/wms/movement-order/update', data)
}

/** 完成移库 */
export function completeMovementOrder(id: number) {
  return http.put<boolean>(`/wms/movement-order/complete?id=${id}`)
}

/** 作废移库单 */
export function cancelMovementOrder(id: number) {
  return http.put<boolean>(`/wms/movement-order/cancel?id=${id}`)
}

/** 删除移库单 */
export function deleteMovementOrder(id: number) {
  return http.delete<boolean>(`/wms/movement-order/delete?id=${id}`)
}
