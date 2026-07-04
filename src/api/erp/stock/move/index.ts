import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 库存调拨明细 */
export interface StockMoveItem {
  id?: number
  fromWarehouseId?: number
  fromWarehouseName?: string
  toWarehouseId?: number
  toWarehouseName?: string
  productId?: number
  productName?: string
  productUnitName?: string
  productBarCode?: string
  productPrice?: number
  stockCount?: number
  count?: number
  totalPrice?: number
  remark?: string
}

/** ERP 库存调拨 */
export interface StockMove {
  id?: number // 调拨编号
  no?: string // 调拨单号
  moveTime?: Date | string | number // 调拨时间
  totalCount?: number // 合计数量
  totalPrice?: number // 合计金额，单位：元
  status?: number // 状态
  creator?: string // 创建人
  creatorName?: string // 创建人名称
  createTime?: Date // 创建时间
  productNames?: string // 产品信息
  remark?: string // 备注
  fileUrl?: string // 附件地址
  items?: StockMoveItem[] // 调拨明细
}

/** 获取库存调拨分页列表 */
export function getStockMovePage(params: PageParam) {
  return http.get<PageResult<StockMove>>('/erp/stock-move/page', params)
}

/** 获取库存调拨详情 */
export function getStockMove(id: number) {
  return http.get<StockMove>(`/erp/stock-move/get?id=${id}`)
}

/** 创建库存调拨 */
export function createStockMove(data: StockMove) {
  return http.post<number>('/erp/stock-move/create', data)
}

/** 更新库存调拨 */
export function updateStockMove(data: StockMove) {
  return http.put<boolean>('/erp/stock-move/update', data)
}

/** 更新库存调拨状态 */
export function updateStockMoveStatus(id: number, status: number) {
  return http.put<boolean>('/erp/stock-move/update-status', undefined, { id, status })
}

/** 删除库存调拨 */
export function deleteStockMove(ids: number[]) {
  return http.delete<boolean>('/erp/stock-move/delete', undefined, { ids: ids.join(',') })
}
