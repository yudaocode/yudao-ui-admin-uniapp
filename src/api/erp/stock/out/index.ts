import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 其它出库明细 */
export interface StockOutItem {
  id?: number
  warehouseId?: number
  warehouseName?: string
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

/** ERP 其它出库 */
export interface StockOut {
  id?: number // 出库编号
  no?: string // 出库单号
  customerId?: number // 客户编号
  customerName?: string // 客户名称
  outTime?: Date | string | number // 出库时间
  totalCount?: number // 合计数量
  totalPrice?: number // 合计金额，单位：元
  status?: number // 状态
  creator?: string // 创建人
  creatorName?: string // 创建人名称
  createTime?: Date // 创建时间
  productNames?: string // 产品信息
  remark?: string // 备注
  fileUrl?: string // 附件地址
  items?: StockOutItem[] // 出库明细
}

/** 获取其它出库分页列表 */
export function getStockOutPage(params: PageParam) {
  return http.get<PageResult<StockOut>>('/erp/stock-out/page', params)
}

/** 获取其它出库详情 */
export function getStockOut(id: number) {
  return http.get<StockOut>(`/erp/stock-out/get?id=${id}`)
}

/** 创建其它出库 */
export function createStockOut(data: StockOut) {
  return http.post<number>('/erp/stock-out/create', data)
}

/** 更新其它出库 */
export function updateStockOut(data: StockOut) {
  return http.put<boolean>('/erp/stock-out/update', data)
}

/** 更新其它出库状态 */
export function updateStockOutStatus(id: number, status: number) {
  return http.put<boolean>('/erp/stock-out/update-status', undefined, { id, status })
}

/** 删除其它出库 */
export function deleteStockOut(ids: number[]) {
  return http.delete<boolean>('/erp/stock-out/delete', undefined, { ids: ids.join(',') })
}
