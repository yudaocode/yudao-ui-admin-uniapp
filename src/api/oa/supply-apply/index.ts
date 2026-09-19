import { http } from '@/http/http'
import type { PageResult } from '@/http/types'
import type { SupplyIssue } from '@/api/oa/supply-issue'

/** OA 用品领用申请 */
export interface SupplyApply {
  id: number // 申请编号
  no?: string // 申请单号
  applyTime?: number | string // 领用日期
  useType?: number // 使用类型，字典 oa_supply_use_type
  pickupMethod?: number // 领取方式，字典 oa_supply_pickup_method
  reason?: string // 申请事由
  fileUrls?: string[] // 附件地址列表
  remark?: string // 备注
  creatorName?: string // 申请人
  deptId?: number // 申请部门编号
  deptName?: string // 申请部门
  status?: number // 单据状态，-1 未提交，其余见字典 bpm_process_instance_status
  processInstanceId?: string // 流程实例编号
  createTime?: number // 创建时间
  items?: SupplyIssue[] // 领用明细
}

/** 获得本人用品领用申请分页 */
export function getSupplyApplyPage(params: Record<string, any>) {
  return http.get<PageResult<SupplyApply>>('/oa/supply-apply/page', params)
}

/** 获得用品领用申请详情 */
export function getSupplyApply(id: number) {
  return http.get<SupplyApply>('/oa/supply-apply/get', { id })
}

/** 创建用品领用申请草稿 */
export function createSupplyApply(data: Partial<SupplyApply>) {
  return http.post<number>('/oa/supply-apply/create', data)
}

/** 更新用品领用申请草稿 */
export function updateSupplyApply(data: Partial<SupplyApply>) {
  return http.put<boolean>('/oa/supply-apply/update', data)
}

/** 删除用品领用申请草稿 */
export function deleteSupplyApply(id: number) {
  return http.delete<boolean>(`/oa/supply-apply/delete?id=${id}`)
}

/** 提交用品领用申请 */
export function submitSupplyApply(id: number) {
  return http.put<boolean>(`/oa/supply-apply/submit?id=${id}`)
}

/** 取消用品领用申请 */
export function cancelSupplyApply(id: number) {
  return http.put<boolean>(`/oa/supply-apply/cancel?id=${id}`)
}
