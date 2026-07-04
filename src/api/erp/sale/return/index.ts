import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 销售退货明细 */
export interface SaleReturnItem {
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
  outCount?: number
  returnCount?: number
  count?: number
  totalProductPrice?: number
  taxPercent?: number
  taxPrice?: number
  totalPrice?: number
  remark?: string
}

/** ERP 销售退货 */
export interface SaleReturn {
  id?: number // 销售退货编号
  no?: string // 销售退货号
  customerId?: number // 客户编号
  customerName?: string // 客户名称
  accountId?: number // 结算账户编号
  accountName?: string // 结算账户名称
  saleUserId?: number // 销售人员编号
  saleUserName?: string // 销售人员名称
  orderId?: number // 关联订单编号
  returnTime?: Date | string | number // 退货时间
  orderNo?: string // 关联订单
  discountPercent?: number // 优惠率
  discountPrice?: number // 退款优惠
  totalPrice?: number // 优惠后金额
  otherPrice?: number // 其它费用
  refundPrice?: number // 应退金额
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
  items?: SaleReturnItem[] // 退货明细
}

/** 获取销售退货分页列表 */
export function getSaleReturnPage(params: PageParam) {
  return http.get<PageResult<SaleReturn>>('/erp/sale-return/page', params)
}

/** 获取销售退货详情 */
export function getSaleReturn(id: number) {
  return http.get<SaleReturn>(`/erp/sale-return/get?id=${id}`)
}

/** 创建销售退货 */
export function createSaleReturn(data: SaleReturn) {
  return http.post<number>('/erp/sale-return/create', data)
}

/** 更新销售退货 */
export function updateSaleReturn(data: SaleReturn) {
  return http.put<boolean>('/erp/sale-return/update', data)
}

/** 更新销售退货状态 */
export function updateSaleReturnStatus(id: number, status: number) {
  return http.put<boolean>('/erp/sale-return/update-status', undefined, { id, status })
}

/** 删除销售退货 */
export function deleteSaleReturn(ids: number[]) {
  return http.delete<boolean>('/erp/sale-return/delete', undefined, { ids: ids.join(',') })
}
