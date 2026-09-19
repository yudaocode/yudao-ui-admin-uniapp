import { http } from '@/http/http'
import type { PageResult } from '@/http/types'

/** OA 出差申请行程明细 */
export interface TravelApplyItem {
  departureAreaId?: number // 出发地区编号
  arrivalAreaId?: number // 到达地区编号
  startTime?: number | string // 开始日期
  endTime?: number | string // 结束日期
  transportType?: number // 交通方式，字典 oa_transport_type
  remark?: string // 备注
}

/** OA 出差申请 */
export interface TravelApply {
  id: number // 申请编号
  no?: string // 单据编号
  reason?: string // 出差事由
  startTime?: number | string // 开始日期
  endTime?: number | string // 结束日期
  days?: number // 出差天数
  companion?: string // 同行人
  estimatedPrice?: number // 预计费用（元）
  reimburseStatus?: boolean // 报销状态，true 已报销
  status?: number // 审批状态，-1 未提交，其余见字典 bpm_process_instance_status
  processInstanceId?: string // 流程实例编号
  remark?: string // 备注
  creatorName?: string // 申请人姓名
  deptId?: number // 申请部门编号
  deptName?: string // 申请部门
  createTime?: number // 创建时间
  items?: TravelApplyItem[] // 行程明细
  fileUrls?: string[] // 附件地址列表
}

/** 获得本人出差申请分页 */
export function getTravelApplyPage(params: Record<string, any>) {
  return http.get<PageResult<TravelApply>>('/oa/travel-apply/page', params)
}

/** 获得出差申请详情 */
export function getTravelApply(id: number) {
  return http.get<TravelApply>('/oa/travel-apply/get', { id })
}

/** 获得本人可关联的已通过出差申请 */
export function getApprovedTravelApplyList() {
  return http.get<TravelApply[]>('/oa/travel-apply/approved-list')
}

/** 创建出差申请草稿 */
export function createTravelApply(data: Partial<TravelApply>) {
  return http.post<number>('/oa/travel-apply/create', data)
}

/** 更新出差申请草稿 */
export function updateTravelApply(data: Partial<TravelApply>) {
  return http.put<boolean>('/oa/travel-apply/update', data)
}

/** 删除出差申请草稿 */
export function deleteTravelApply(id: number) {
  return http.delete<boolean>(`/oa/travel-apply/delete?id=${id}`)
}

/** 提交出差申请 */
export function submitTravelApply(id: number) {
  return http.post<boolean>('/oa/travel-apply/submit', { id })
}

/** 撤回出差申请 */
export function cancelTravelApply(id: number) {
  return http.put<boolean>(`/oa/travel-apply/cancel?id=${id}`)
}
