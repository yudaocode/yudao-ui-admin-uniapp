import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT 数据流转规则信息 */
export interface DataRule {
  id?: number
  name?: string
  description?: string
  status?: number
  sourceConfigs?: any[]
  sinkIds?: number[]
  createTime?: Date
}

/** 获取数据流转规则分页列表 */
export function getDataRulePage(params: PageParam) {
  return http.get<PageResult<DataRule>>('/iot/data-rule/page', params)
}

/** 获取数据流转规则详情 */
export function getDataRule(id: number) {
  return http.get<DataRule>(`/iot/data-rule/get?id=${id}`)
}

/** 创建数据流转规则 */
export function createDataRule(data: DataRule) {
  return http.post<number>('/iot/data-rule/create', data)
}

/** 更新数据流转规则 */
export function updateDataRule(data: DataRule) {
  return http.put<boolean>('/iot/data-rule/update', data)
}

/** 删除数据流转规则 */
export function deleteDataRule(id: number) {
  return http.delete<boolean>(`/iot/data-rule/delete?id=${id}`)
}
