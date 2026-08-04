import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 绩效结果等级 */
export interface ResultLevel {
  name: string // 等级名称
  minScore: number // 最低分数
  maxScore: number // 最高分数
  coefficient: number // 绩效系数
}

/** 绩效结果模板 */
export interface ResultTemplate {
  id?: number // 结果模板编号
  name: string // 结果模板名称
  levels: ResultLevel[] // 结果等级列表
  status?: number // 状态
  creator?: string // 创建人
  creatorName?: string // 创建人名称
  createTime?: Date | string | number // 创建时间
  updateTime?: Date | string | number // 更新时间
}

/** 创建绩效结果模板 */
export function createPerformanceResultTemplate(data: ResultTemplate) {
  return http.post<number>('/hrm/performance/result-template/create', data)
}

/** 修改绩效结果模板 */
export function updatePerformanceResultTemplate(data: ResultTemplate) {
  return http.put<boolean>('/hrm/performance/result-template/update', data)
}

/** 删除绩效结果模板 */
export function deletePerformanceResultTemplate(id: number) {
  return http.delete<boolean>(`/hrm/performance/result-template/delete?id=${id}`)
}

/** 批量删除绩效结果模板 */
export function deletePerformanceResultTemplateList(ids: number[]) {
  return http.delete<boolean>('/hrm/performance/result-template/delete-list', undefined, {
    ids: ids.join(','),
  })
}

/** 获得绩效结果模板详情 */
export function getPerformanceResultTemplate(id: number) {
  return http.get<ResultTemplate>(`/hrm/performance/result-template/get?id=${id}`)
}

/** 获得绩效结果模板分页 */
export function getPerformanceResultTemplatePage(params: PageParam) {
  return http.get<PageResult<ResultTemplate>>('/hrm/performance/result-template/page', params)
}

/** 获得绩效结果模板精简列表 */
export function getPerformanceResultTemplateSimpleList(params?: { status?: number }) {
  return http.get<ResultTemplate[]>('/hrm/performance/result-template/simple-list', params)
}
