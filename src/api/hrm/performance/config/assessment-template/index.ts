import type { PageParam, PageResult } from '@/http/types'
import type { AssessmentConfig } from '@/api/hrm/performance/assessment'
import { http } from '@/http/http'

/** 绩效考核模板 */
export interface AssessmentTemplate extends AssessmentConfig {
  id?: number // 模板编号
  illustrate?: string // 模板说明
  dimensionCount?: number // 维度数量
  quotaCount?: number // 指标数量
  creator?: string // 创建人
  creatorName?: string // 创建人名称
  createTime?: Date | string | number // 创建时间
  updateTime?: Date | string | number // 更新时间
}

/** 创建绩效考核模板 */
export function createPerformanceAssessmentTemplate(data: AssessmentTemplate) {
  return http.post<number>('/hrm/performance/assessment-template/create', data)
}

/** 修改绩效考核模板 */
export function updatePerformanceAssessmentTemplate(data: AssessmentTemplate) {
  return http.put<boolean>('/hrm/performance/assessment-template/update', data)
}

/** 删除绩效考核模板 */
export function deletePerformanceAssessmentTemplate(id: number) {
  return http.delete<boolean>(`/hrm/performance/assessment-template/delete?id=${id}`)
}

/** 批量删除绩效考核模板 */
export function deletePerformanceAssessmentTemplateList(ids: number[]) {
  return http.delete<boolean>('/hrm/performance/assessment-template/delete-list', undefined, {
    ids: ids.join(','),
  })
}

/** 获得绩效考核模板详情 */
export function getPerformanceAssessmentTemplate(id: number) {
  return http.get<AssessmentTemplate>(`/hrm/performance/assessment-template/get?id=${id}`)
}

/** 获得绩效考核模板分页 */
export function getPerformanceAssessmentTemplatePage(params: PageParam) {
  return http.get<PageResult<AssessmentTemplate>>('/hrm/performance/assessment-template/page', params)
}

/** 获得绩效考核模板精简列表 */
export function getPerformanceAssessmentTemplateSimpleList() {
  return http.get<AssessmentTemplate[]>('/hrm/performance/assessment-template/simple-list')
}
