import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 采购退货明细 */
export interface PurchaseReturnItem {
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
  inCount?: number
  returnCount?: number
  count?: number
  totalProductPrice?: number
  taxPercent?: number
  taxPrice?: number
  totalPrice?: number
  remark?: string
}

/** ERP 采购退货 */
export interface PurchaseReturn {
  id?: number // 采购退货编号
  no?: string // 采购退货号
  supplierId?: number // 供应商编号
  supplierName?: string // 供应商名称
  accountId?: number // 结算账户编号
  accountName?: string // 结算账户名称
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
  items?: PurchaseReturnItem[] // 退货明细
}

/** 获取采购退货分页列表 */
export function getPurchaseReturnPage(params: PageParam) {
  return http.get<PageResult<PurchaseReturn>>('/erp/purchase-return/page', params)
}

/** 获取采购退货详情 */
export function getPurchaseReturn(id: number) {
  return http.get<PurchaseReturn>(`/erp/purchase-return/get?id=${id}`)
}

/** 创建采购退货 */
export function createPurchaseReturn(data: PurchaseReturn) {
  return http.post<number>('/erp/purchase-return/create', data)
}

/** 更新采购退货 */
export function updatePurchaseReturn(data: PurchaseReturn) {
  return http.put<boolean>('/erp/purchase-return/update', data)
}

/** 更新采购退货状态 */
export function updatePurchaseReturnStatus(id: number, status: number) {
  return http.put<boolean>('/erp/purchase-return/update-status', undefined, { id, status })
}

/** 删除采购退货 */
export function deletePurchaseReturn(ids: number[]) {
  return http.delete<boolean>('/erp/purchase-return/delete', undefined, { ids: ids.join(',') })
}
