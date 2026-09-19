import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 转正申请 */
export interface RegularApply {
  id: number // 申请编号
  title: string // 标题
  urgency: number // 紧急程度，字典 oa_apply_urgency
  startTime?: number | string // 开始时间
  endTime?: number | string // 结束时间
  days?: number // 试用期天数
  experience?: string // 试用期心得
  understanding?: string // 岗位职责理解
  growth?: string // 试用期成长
  deficiency?: string // 目前不足
  improvement?: string // 工作改进
  suggestion?: string // 产品意见建议
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  processInstanceId?: string // 流程实例编号
  creator?: string // 创建人编号
  creatorName?: string // 创建人姓名
  createTime?: number // 创建时间
}

/** 创建转正申请草稿 */
export function createRegularApply(data: Partial<RegularApply>) {
  return http.post<number>('/oa/regular-apply/create', data)
}

/** 更新转正申请草稿 */
export function updateRegularApply(data: Partial<RegularApply>) {
  return http.put<boolean>('/oa/regular-apply/update', data)
}

/** 提交转正申请 */
export function submitRegularApply(id: number) {
  return http.post<boolean>('/oa/regular-apply/submit', { id })
}

/** 获得本人转正申请分页 */
export function getRegularApplyPage(params: { title?: string, status?: number, pageNo: number, pageSize: number }) {
  return http.get<PageResult<RegularApply>>('/oa/regular-apply/page', params)
}

/** 获得转正申请详情 */
export function getRegularApply(id: number) {
  return http.get<RegularApply>('/oa/regular-apply/get', { id })
}
