import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 付款单明细 */
export interface FinancePaymentItem {
  id?: number
  bizType?: number
  bizId?: number
  bizNo?: string
  totalPrice?: number
  paidPrice?: number
  paymentPrice?: number
  remark?: string
}

/** ERP 付款单 */
export interface FinancePayment {
  id?: number // 付款单编号
  no?: string // 付款单号
  supplierId?: number // 供应商编号
  supplierName?: string // 供应商名称
  accountId?: number // 结算账户编号
  accountName?: string // 结算账户名称
  financeUserId?: number // 财务人员编号
  financeUserName?: string // 财务人员名称
  paymentTime?: Date | string | number // 付款时间
  totalPrice?: number // 合计金额，单位：元
  discountPrice?: number // 优惠金额，单位：元
  paymentPrice?: number // 实际付款，单位：元
  status?: number // 状态
  creator?: string // 创建人
  creatorName?: string // 创建人名称
  createTime?: Date // 创建时间
  remark?: string // 备注
  fileUrl?: string // 附件地址
  items?: FinancePaymentItem[] // 付款明细
}

/** 获取付款单分页列表 */
export function getFinancePaymentPage(params: PageParam) {
  return http.get<PageResult<FinancePayment>>('/erp/finance-payment/page', params)
}

/** 获取付款单详情 */
export function getFinancePayment(id: number) {
  return http.get<FinancePayment>(`/erp/finance-payment/get?id=${id}`)
}

/** 创建付款单 */
export function createFinancePayment(data: FinancePayment) {
  return http.post<number>('/erp/finance-payment/create', data)
}

/** 更新付款单 */
export function updateFinancePayment(data: FinancePayment) {
  return http.put<boolean>('/erp/finance-payment/update', data)
}

/** 更新付款单状态 */
export function updateFinancePaymentStatus(id: number, status: number) {
  return http.put<boolean>('/erp/finance-payment/update-status', undefined, { id, status })
}

/** 删除付款单 */
export function deleteFinancePayment(ids: number[]) {
  return http.delete<boolean>('/erp/finance-payment/delete', undefined, { ids: ids.join(',') })
}
