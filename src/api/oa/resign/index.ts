import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 离职申请 */
export interface ResignApply {
  id: number // 申请编号
  title: string // 标题
  urgency: number // 紧急程度，字典 oa_apply_urgency
  reason?: string // 申请原因
  handoverUserId?: number // 工作交接人用户编号
  unfinishedWork?: string // 未完成事宜
  hasPendingReimbursement?: boolean // 是否有费用报销未完成
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  processInstanceId?: string // 流程实例编号
  creator?: string // 创建人编号
  creatorName?: string // 创建人姓名
  createTime?: number // 创建时间
}

/** 创建离职申请草稿 */
export function createResignApply(data: Partial<ResignApply>) {
  return http.post<number>('/oa/resign-apply/create', data)
}

/** 更新离职申请草稿 */
export function updateResignApply(data: Partial<ResignApply>) {
  return http.put<boolean>('/oa/resign-apply/update', data)
}

/** 提交离职申请 */
export function submitResignApply(id: number) {
  return http.post<boolean>('/oa/resign-apply/submit', { id })
}

/** 获得本人离职申请分页 */
export function getResignApplyPage(params: { title?: string, status?: number, pageNo: number, pageSize: number }) {
  return http.get<PageResult<ResignApply>>('/oa/resign-apply/page', params)
}

/** 获得离职申请详情 */
export function getResignApply(id: number) {
  return http.get<ResignApply>('/oa/resign-apply/get', { id })
}
