import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 采购入库明细 */
export interface PurchaseInItem {
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
  inCount?: number
  count?: number
  totalProductPrice?: number
  taxPercent?: number
  taxPrice?: number
  totalPrice?: number
  remark?: string
}

/** ERP 采购入库 */
export interface PurchaseIn {
  id?: number // 入库工单编号
  no?: string // 采购入库号
  supplierId?: number // 供应商编号
  supplierName?: string // 供应商名称
  accountId?: number // 结算账户编号
  accountName?: string // 结算账户名称
  orderId?: number // 关联订单编号
  inTime?: Date | string | number // 入库时间
  orderNo?: string // 关联订单
  discountPercent?: number // 优惠率
  discountPrice?: number // 付款优惠
  totalPrice?: number // 优惠后金额
  otherPrice?: number // 其它费用
  paymentPrice?: number // 应付金额
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
  items?: PurchaseInItem[] // 入库明细
}

/** 获取采购入库分页列表 */
export function getPurchaseInPage(params: PageParam) {
  return http.get<PageResult<PurchaseIn>>('/erp/purchase-in/page', params)
}

/** 获取采购入库详情 */
export function getPurchaseIn(id: number) {
  return http.get<PurchaseIn>(`/erp/purchase-in/get?id=${id}`)
}

/** 创建采购入库 */
export function createPurchaseIn(data: PurchaseIn) {
  return http.post<number>('/erp/purchase-in/create', data)
}

/** 更新采购入库 */
export function updatePurchaseIn(data: PurchaseIn) {
  return http.put<boolean>('/erp/purchase-in/update', data)
}

/** 更新采购入库状态 */
export function updatePurchaseInStatus(id: number, status: number) {
  return http.put<boolean>('/erp/purchase-in/update-status', undefined, { id, status })
}

/** 删除采购入库 */
export function deletePurchaseIn(ids: number[]) {
  return http.delete<boolean>('/erp/purchase-in/delete', undefined, { ids: ids.join(',') })
}
