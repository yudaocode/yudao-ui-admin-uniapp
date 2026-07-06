import type { PageParam, PageResult } from '@/http/types'
import type { ShipmentOrderDetail } from './detail'
import { http } from '@/http/http'

/** WMS 出库单 */
export interface ShipmentOrder {
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
  details?: ShipmentOrderDetail[]
  createTime?: Date
  creator?: string
  creatorName?: string
  updateTime?: Date
  updater?: string
  updaterName?: string
}

/** 查询出库单分页 */
export function getShipmentOrderPage(params: PageParam) {
  return http.get<PageResult<ShipmentOrder>>('/wms/shipment-order/page', params)
}

/** 查询出库单详情 */
export function getShipmentOrder(id: number) {
  return http.get<ShipmentOrder>(`/wms/shipment-order/get?id=${id}`)
}

/** 查询出库单明细 */
export function getShipmentOrderDetailListByOrderId(orderId: number) {
  return http.get<ShipmentOrderDetail[]>(`/wms/shipment-order-detail/list-by-order-id?orderId=${orderId}`)
}

/** 新增出库单 */
export function createShipmentOrder(data: ShipmentOrder) {
  return http.post<number>('/wms/shipment-order/create', data)
}

/** 修改出库单 */
export function updateShipmentOrder(data: ShipmentOrder) {
  return http.put<boolean>('/wms/shipment-order/update', data)
}

/** 完成出库 */
export function completeShipmentOrder(id: number) {
  return http.put<boolean>(`/wms/shipment-order/complete?id=${id}`)
}

/** 作废出库单 */
export function cancelShipmentOrder(id: number) {
  return http.put<boolean>(`/wms/shipment-order/cancel?id=${id}`)
}

/** 删除出库单 */
export function deleteShipmentOrder(id: number) {
  return http.delete<boolean>(`/wms/shipment-order/delete?id=${id}`)
}
