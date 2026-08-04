import type { PageParam, PageResult } from '@/http/types'
import type {
  AssessmentConfig,
  PerformanceLevelCount,
  PerformanceStageCount,
} from '@/api/hrm/performance/assessment'
import type { ResultLevel } from '@/api/hrm/performance/config/result-template'
import { http } from '@/http/http'

/** 绩效计划处理节点 */
export interface PerformanceHandlerStage {
  type?: number // 处理人类型
  level?: number // 上级或部门层级
  employeeId?: number // 指定处理员工编号
}

/** 绩效计划评分阶段 */
export interface PerformanceReviewStage {
  name?: string // 阶段名称
  rater?: PerformanceHandlerStage // 评分人
  weight?: number // 阶段权重
  scoringType?: number // 评分方式
  visibleContent?: number // 可见内容
  requiredSetting?: boolean // 评语是否必填
  rejectAuthority?: boolean // 是否允许驳回
}

/** 绩效计划考评范围 */
export interface PerformanceScope {
  type?: number // 范围类型
  employeeIds?: number[] // 员工编号列表
  deptIds?: number[] // 部门编号列表
  employeeType?: number // 聘用形式
  employeeStatuses?: number[] // 员工状态列表
}

/** 绩效计划结果配置快照 */
export interface PerformanceResultConfig {
  name: string // 结果模板名称
  levels: ResultLevel[] // 结果等级列表
}

/** 绩效计划 */
export interface PerformancePlan {
  id?: number // 绩效计划编号
  name: string // 计划名称
  cycleType?: number // 考核周期类型
  cycle?: string // 考核周期
  quarter?: number // 季度
  startTime?: number // 开始时间
  endTime?: number // 结束时间
  description?: string // 考核说明
  scopes?: PerformanceScope[] // 考评范围列表
  assessmentTemplateId?: number // 考核模板编号
  assessmentConfig?: AssessmentConfig // 考核配置快照
  resultTemplateId?: number // 结果模板编号
  resultConfig?: PerformanceResultConfig // 结果配置快照
  quotaSettingType?: number // 指标制定方式
  targetConfirmation?: boolean // 是否开启目标确认
  targetConfirmationStage?: PerformanceHandlerStage // 目标确认节点
  reviewStages?: PerformanceReviewStage[] // 评分阶段列表
  resultAudit?: boolean // 是否开启结果审核
  resultAuditStages?: PerformanceHandlerStage[] // 结果审核节点列表
  resultConfirmation?: boolean // 是否开启结果确认
  appealStages?: PerformanceHandlerStage[] // 申诉确认节点列表
  appealTimeoutDays?: number // 申诉超期天数
  appealTimeoutAction?: number // 申诉超期处理动作
  syncToSalary?: boolean // 是否同步薪资
  paidForMonth?: string // 计薪月份
  assessmentTemplateName?: string // 考核模板名称
  resultTemplateName?: string // 结果模板名称
  stageType?: number // 当前阶段
  status?: number // 计划状态
  operationType?: number // 可操作阶段
  terminateTime?: Date | string | number // 终止时间
  employeeCount?: number // 参评员工数量
  finishedCount?: number // 已完成人数
  scoringReady?: boolean // 是否可开启评分
  interviewReady?: boolean // 是否可发起面谈
  archiveReady?: boolean // 是否可归档
  stageCountMap?: Record<number, number> // 各阶段员工数量
  createTime?: Date | string | number // 创建时间
}

/** 创建绩效计划 */
export function createPerformancePlan(data: PerformancePlan) {
  return http.post<number>('/hrm/performance/plan/create', data)
}

/** 修改绩效计划 */
export function updatePerformancePlan(data: PerformancePlan) {
  return http.put<boolean>('/hrm/performance/plan/update', data)
}

/** 删除绩效计划 */
export function deletePerformancePlan(id: number) {
  return http.delete<boolean>(`/hrm/performance/plan/delete?id=${id}`)
}

/** 获得绩效计划详情 */
export function getPerformancePlan(id: number) {
  return http.get<PerformancePlan>(`/hrm/performance/plan/get?id=${id}`)
}

/** 获得绩效计划分页 */
export function getPerformancePlanPage(params: PageParam) {
  return http.get<PageResult<PerformancePlan>>('/hrm/performance/plan/page', params)
}

/** 启动绩效计划 */
export function startPerformancePlan(id: number) {
  return http.post<boolean>(`/hrm/performance/plan/start?id=${id}`)
}

/** 开启绩效评分 */
export function openPerformancePlanScoring(id: number) {
  return http.post<boolean>(`/hrm/performance/plan/open-scoring?id=${id}`)
}

/** 发起绩效面谈 */
export function startPerformancePlanInterview(id: number) {
  return http.post<boolean>(`/hrm/performance/plan/start-interview?id=${id}`)
}

/** 归档绩效计划 */
export function archivePerformancePlan(id: number) {
  return http.post<boolean>(`/hrm/performance/plan/archive?id=${id}`)
}

/** 终止绩效计划 */
export function terminatePerformancePlan(id: number) {
  return http.post<boolean>(`/hrm/performance/plan/terminate?id=${id}`)
}

/** 获得绩效计划状态统计 */
export function getPerformancePlanStatusCount(params: Record<string, any>) {
  return http.get<Record<number, number>>('/hrm/performance/plan/status-count', params)
}

/** 获得绩效计划阶段统计 */
export function getPerformancePlanStageCount(planId: number) {
  return http.get<PerformanceStageCount[]>(`/hrm/performance/plan/stage-count?planId=${planId}`)
}

/** 获得绩效计划等级统计 */
export function getPerformancePlanLevelCount(planId: number) {
  return http.get<PerformanceLevelCount[]>(`/hrm/performance/plan/level-count?planId=${planId}`)
}
