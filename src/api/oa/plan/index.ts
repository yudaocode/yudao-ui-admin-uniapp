import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OA 工作计划 */
export interface Plan {
  id?: number // 计划编号
  userId?: number // 用户编号
  userName?: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  type: number // 计划类型
  status: number // 计划状态
  title: string // 标题
  label?: string // 标签
  content: string // 计划内容
  summary?: string // 计划总结
  comment?: string // 计划点评
  startTime: string // 开始时间
  endTime: string // 结束时间
  fileUrls?: string[] // 附件地址列表
  createTime?: string // 创建时间
}

/** OA 工作计划报表行，成员无计划时仅有用户信息 */
export interface PlanReport {
  userId: number // 用户编号
  userName: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  planId?: number // 计划编号
  status?: number // 计划状态
  title?: string // 标题
  label?: string // 标签
  content?: string // 计划内容
  summary?: string // 计划总结
  comment?: string // 计划点评
  fileUrls?: string[] // 附件地址列表
  createTime?: string // 创建时间
}

/** 查询工作计划分页 */
export function getPlanPage(params: PageParam) {
  return http.get<PageResult<Plan>>('/oa/plan/page', params)
}

/** 查询工作计划报表分页 */
export function getPlanReportPage(params: PageParam) {
  return http.get<PageResult<PlanReport>>('/oa/plan/report-page', params)
}

/** 查询工作计划详情，仅计划归属人可访问 */
export function getPlan(id: number) {
  return http.get<Plan>(`/oa/plan/get?id=${id}`)
}

/** 创建工作计划 */
export function createPlan(data: Plan) {
  return http.post<number>('/oa/plan/create', data)
}

/** 更新工作计划 */
export function updatePlan(data: Plan) {
  return http.put<boolean>('/oa/plan/update', data)
}

/** 删除工作计划 */
export function deletePlan(id: number) {
  return http.delete<boolean>(`/oa/plan/delete?id=${id}`)
}

/** 点评工作计划，限管理范围内的成员计划 */
export function addPlanComment(id: number, comment: string) {
  return http.put<boolean>('/oa/plan/add-comment', { id, comment })
}
