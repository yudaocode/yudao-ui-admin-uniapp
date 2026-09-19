import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 费用报销明细 */
export interface ReimbursementItem {
  expenseTime?: number | string // 费用发生时间
  expenseType?: number // 费用类型，字典 oa_expense_type
  description?: string // 费用说明
  invoiceCount?: number // 票据张数
  price?: number // 报销金额（元）
}

/** OA 费用报销 */
export interface Reimbursement {
  id: number // 申请编号
  title?: string // 标题
  urgency?: number // 紧急程度，字典 oa_apply_urgency
  reason?: string // 申请原因
  witnessUserId?: number // 证明人用户编号
  customerName?: string // 相关客户
  paymentMethod?: number // 报销方式，字典 oa_reimbursement_payment_method
  invoiceCount?: number // 票据总数
  totalPrice?: number // 报销总金额（元）
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  processInstanceId?: string // 流程实例编号
  items?: ReimbursementItem[] // 报销明细
  fileUrls?: string[] // 附件地址列表
  creator?: string // 申请人编号
  creatorName?: string // 申请人昵称
  createTime?: number // 申请时间
}

/** 获得本人费用报销分页 */
export function getReimbursementPage(params: Record<string, any>) {
  return http.get<PageResult<Reimbursement>>('/oa/reimbursement/page', params)
}

/** 获得费用报销详情 */
export function getReimbursement(id: number) {
  return http.get<Reimbursement>('/oa/reimbursement/get', { id })
}

/** 创建费用报销草稿 */
export function createReimbursement(data: Partial<Reimbursement>) {
  return http.post<number>('/oa/reimbursement/create', data)
}

/** 更新费用报销草稿 */
export function updateReimbursement(data: Partial<Reimbursement>) {
  return http.put<boolean>('/oa/reimbursement/update', data)
}

/** 提交费用报销审批 */
export function submitReimbursement(id: number) {
  return http.post<boolean>('/oa/reimbursement/submit', { id })
}
