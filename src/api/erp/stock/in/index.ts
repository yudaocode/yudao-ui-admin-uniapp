import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 其它入库明细 */
export interface StockInItem {
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

/** ERP 其它入库 */
export interface StockIn {
  id?: number // 入库编号
  no?: string // 入库单号
  supplierId?: number // 供应商编号
  supplierName?: string // 供应商名称
  inTime?: Date | string | number // 入库时间
  totalCount?: number // 合计数量
  totalPrice?: number // 合计金额，单位：元
  status?: number // 状态
  creator?: string // 创建人
  creatorName?: string // 创建人名称
  createTime?: Date // 创建时间
  productNames?: string // 产品信息
  remark?: string // 备注
  fileUrl?: string // 附件地址
  items?: StockInItem[] // 入库明细
}

/** 获取其它入库分页列表 */
export function getStockInPage(params: PageParam) {
  return http.get<PageResult<StockIn>>('/erp/stock-in/page', params)
}

/** 获取其它入库详情 */
export function getStockIn(id: number) {
  return http.get<StockIn>(`/erp/stock-in/get?id=${id}`)
}

/** 创建其它入库 */
export function createStockIn(data: StockIn) {
  return http.post<number>('/erp/stock-in/create', data)
}

/** 更新其它入库 */
export function updateStockIn(data: StockIn) {
  return http.put<boolean>('/erp/stock-in/update', data)
}

/** 更新其它入库状态 */
export function updateStockInStatus(id: number, status: number) {
  return http.put<boolean>('/erp/stock-in/update-status', undefined, { id, status })
}

/** 删除其它入库 */
export function deleteStockIn(ids: number[]) {
  return http.delete<boolean>('/erp/stock-in/delete', undefined, { ids: ids.join(',') })
}
