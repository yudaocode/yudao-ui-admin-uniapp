import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 销售出库明细 */
export interface SaleOutItem {
  id?: number
  orderItemId?: number
  warehouseId?: number
  warehouseName?: string
  productId?: number
  productUnitId?: number
  productName?: string
  productUnitName?: string
  productBarCode?: string
  productPrice?: number
  stockCount?: number
  totalCount?: number
  outCount?: number
  count?: number
  totalProductPrice?: number
  taxPercent?: number
  taxPrice?: number
  totalPrice?: number
  remark?: string
}

/** ERP 销售出库 */
export interface SaleOut {
  id?: number // 销售出库编号
  no?: string // 销售出库号
  customerId?: number // 客户编号
  customerName?: string // 客户名称
  accountId?: number // 结算账户编号
  accountName?: string // 结算账户名称
  saleUserId?: number // 销售人员编号
  saleUserName?: string // 销售人员名称
  orderId?: number // 关联订单编号
  outTime?: Date | string | number // 出库时间
  orderNo?: string // 关联订单
  discountPercent?: number // 优惠率
  discountPrice?: number // 收款优惠
  totalPrice?: number // 优惠后金额
  otherPrice?: number // 其它费用
  receiptPrice?: number // 应收金额
  totalProductPrice?: number // 合计产品金额
  totalTaxPrice?: number // 合计税额
  totalCount?: number // 合计数量
  status?: number // 状态
  creator?: string // 创建人
  creatorName?: string // 创建人名称
  createTime?: Date // 创建时间
  productNames?: string // 产品信息
  remark?: string // 备注
  fileUrl?: string // 附件地址
  items?: SaleOutItem[] // 出库明细
}

/** 获取销售出库分页列表 */
export function getSaleOutPage(params: PageParam) {
  return http.get<PageResult<SaleOut>>('/erp/sale-out/page', params)
}

/** 获取销售出库详情 */
export function getSaleOut(id: number) {
  return http.get<SaleOut>(`/erp/sale-out/get?id=${id}`)
}

/** 创建销售出库 */
export function createSaleOut(data: SaleOut) {
  return http.post<number>('/erp/sale-out/create', data)
}

/** 更新销售出库 */
export function updateSaleOut(data: SaleOut) {
  return http.put<boolean>('/erp/sale-out/update', data)
}

/** 更新销售出库状态 */
export function updateSaleOutStatus(id: number, status: number) {
  return http.put<boolean>('/erp/sale-out/update-status', undefined, { id, status })
}

/** 删除销售出库 */
export function deleteSaleOut(ids: number[]) {
  return http.delete<boolean>('/erp/sale-out/delete', undefined, { ids: ids.join(',') })
}
