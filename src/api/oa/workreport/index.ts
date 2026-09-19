import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OA 工作汇报已完成工作项 */
export interface WorkReportWorkItem {
  content: string // 工作内容
  progress: number // 完成进度，0-100
}

/** OA 工作汇报工作计划项 */
export interface WorkReportPlanItem {
  content: string // 计划内容
}

/** OA 工作汇报 */
export interface WorkReport {
  id?: number // 汇报编号
  no?: string // 汇报单号
  type: number // 汇报类型
  status?: number // 汇报状态
  title?: string // 汇报标题
  periodKey?: string // 汇报周期标识
  startTime: string // 周期开始时间
  endTime: string // 周期结束时间
  summary?: string // 工作总结
  plan?: string // 工作计划补充说明
  problem?: string // 问题与协调事项
  workItems?: WorkReportWorkItem[] // 已完成工作项
  planItems?: WorkReportPlanItem[] // 工作计划项
  fileUrls?: string[] // 附件地址列表
  remark?: string // 备注
  userId?: number // 用户编号
  userName?: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
}

/** OA 工作汇报统计行 */
export interface WorkReportUserStatistics {
  userId: number // 用户编号
  userName: string // 用户昵称
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  expectedCount: number // 应填数量
  submittedCount: number // 已填数量
  missingCount: number // 未填数量
  submittedReports?: WorkReport[] // 已填汇报列表
  missingPeriodKeys?: string[] // 未填周期标识列表
}

/** OA 工作汇报统计 */
export interface WorkReportStatistics {
  userCount: number // 成员数量
  expectedCount: number // 应填数量
  submittedCount: number // 已填数量
  missingCount: number // 未填数量
  users: WorkReportUserStatistics[] // 成员统计列表
}

/** 查询我的工作汇报分页 */
export function getWorkReportPage(params: PageParam) {
  return http.get<PageResult<WorkReport>>('/oa/work-report/page', params)
}

/** 查询工作汇报详情 */
export function getWorkReport(id: number) {
  return http.get<WorkReport>(`/oa/work-report/get?id=${id}`)
}

/** 查询工作汇报统计 */
export function getWorkReportStatistics(params: Record<string, any>) {
  return http.get<WorkReportStatistics>('/oa/work-report/statistics', params)
}

/** 创建工作汇报草稿 */
export function createWorkReport(data: WorkReport) {
  return http.post<number>('/oa/work-report/create', data)
}

/** 更新工作汇报草稿 */
export function updateWorkReport(data: WorkReport) {
  return http.put<boolean>('/oa/work-report/update', data)
}

/** 删除工作汇报草稿 */
export function deleteWorkReport(id: number) {
  return http.delete<boolean>(`/oa/work-report/delete?id=${id}`)
}

/** 提交工作汇报 */
export function submitWorkReport(id: number) {
  return http.put<boolean>(`/oa/work-report/submit?id=${id}`)
}

/** 取消提交工作汇报 */
export function cancelWorkReport(id: number) {
  return http.put<boolean>(`/oa/work-report/cancel?id=${id}`)
}
