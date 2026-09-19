import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 请假申请 */
export interface LeaveApply {
  id: number // 申请编号
  title: string // 标题
  urgency: number // 紧急程度，字典 oa_apply_urgency
  type: number // 请假类型，字典 oa_leave_type
  startTime?: number | string // 开始时间
  endTime?: number | string // 结束时间
  days?: number // 请假天数
  reason?: string // 申请原因
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  processInstanceId?: string // 流程实例编号
  fileUrls?: string[] // 附件地址列表
  creator?: string // 创建人编号
  creatorName?: string // 创建人姓名
  createTime?: number // 创建时间
}

/** 创建请假申请草稿 */
export function createLeaveApply(data: Partial<LeaveApply>) {
  return http.post<number>('/oa/leave-apply/create', data)
}

/** 更新请假申请草稿 */
export function updateLeaveApply(data: Partial<LeaveApply>) {
  return http.put<boolean>('/oa/leave-apply/update', data)
}

/** 提交请假申请 */
export function submitLeaveApply(id: number) {
  return http.post<boolean>('/oa/leave-apply/submit', { id })
}

/** 获得本人请假申请分页 */
export function getLeaveApplyPage(params: { title?: string, status?: number, pageNo: number, pageSize: number }) {
  return http.get<PageResult<LeaveApply>>('/oa/leave-apply/page', params)
}

/** 获得请假申请详情 */
export function getLeaveApply(id: number) {
  return http.get<LeaveApply>('/oa/leave-apply/get', { id })
}
