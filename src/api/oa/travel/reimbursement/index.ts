import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 出差报销费用明细 */
export interface TravelReimbursementItem {
  expenseType?: number // 费用类型，字典 oa_expense_type
  expenseTime?: number | string // 发生日期
  departureCity?: string // 出发地
  arrivalCity?: string // 到达地
  price?: number // 金额（元）
  description?: string // 费用说明
}

/** OA 出差报销 */
export interface TravelReimbursement {
  id: number // 报销编号
  no?: string // 单据编号
  reason?: string // 出差事由
  startTime?: number | string // 开始日期
  endTime?: number | string // 结束日期
  days?: number // 出差天数
  travelApplyId?: number // 关联出差申请编号
  travelApplyNo?: string // 关联出差单号
  totalPrice?: number // 报销总金额（元）
  payStatus?: boolean // 支付状态，true 已支付
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  processInstanceId?: string // 流程实例编号
  remark?: string // 备注
  creatorName?: string // 申请人姓名
  deptId?: number // 申请部门编号
  deptName?: string // 申请部门
  createTime?: number // 创建时间
  items?: TravelReimbursementItem[] // 费用明细
  fileUrls?: string[] // 附件地址列表
}

/** 获得本人出差报销分页 */
export function getTravelReimbursementPage(params: Record<string, any>) {
  return http.get<PageResult<TravelReimbursement>>('/oa/travel-reimbursement/page', params)
}

/** 获得出差报销详情 */
export function getTravelReimbursement(id: number) {
  return http.get<TravelReimbursement>('/oa/travel-reimbursement/get', { id })
}

/** 创建出差报销草稿 */
export function createTravelReimbursement(data: Partial<TravelReimbursement>) {
  return http.post<number>('/oa/travel-reimbursement/create', data)
}

/** 更新出差报销 */
export function updateTravelReimbursement(data: Partial<TravelReimbursement>) {
  return http.put<boolean>('/oa/travel-reimbursement/update', data)
}

/** 删除出差报销 */
export function deleteTravelReimbursement(id: number) {
  return http.delete<boolean>(`/oa/travel-reimbursement/delete?id=${id}`)
}

/** 提交出差报销 */
export function submitTravelReimbursement(id: number) {
  return http.post<boolean>('/oa/travel-reimbursement/submit', { id })
}

/** 撤回出差报销 */
export function cancelTravelReimbursement(id: number) {
  return http.put<boolean>(`/oa/travel-reimbursement/cancel?id=${id}`)
}
