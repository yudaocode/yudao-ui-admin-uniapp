import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 加班申请 */
export interface OvertimeApply {
  id: number // 申请编号
  title: string // 标题
  urgency: number // 紧急程度，字典 oa_apply_urgency
  type: number // 加班类型，字典 oa_overtime_type
  startTime?: number | string // 开始时间
  endTime?: number | string // 结束时间
  days?: number // 加班天数
  reason?: string // 申请原因
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  processInstanceId?: string // 流程实例编号
  creator?: string // 创建人编号
  creatorName?: string // 创建人姓名
  createTime?: number // 创建时间
}

/** 创建加班申请草稿 */
export function createOvertimeApply(data: Partial<OvertimeApply>) {
  return http.post<number>('/oa/overtime-apply/create', data)
}

/** 更新加班申请草稿 */
export function updateOvertimeApply(data: Partial<OvertimeApply>) {
  return http.put<boolean>('/oa/overtime-apply/update', data)
}

/** 提交加班申请 */
export function submitOvertimeApply(id: number) {
  return http.post<boolean>('/oa/overtime-apply/submit', { id })
}

/** 获得本人加班申请分页 */
export function getOvertimeApplyPage(params: { title?: string, status?: number, pageNo: number, pageSize: number }) {
  return http.get<PageResult<OvertimeApply>>('/oa/overtime-apply/page', params)
}

/** 获得加班申请详情 */
export function getOvertimeApply(id: number) {
  return http.get<OvertimeApply>('/oa/overtime-apply/get', { id })
}
