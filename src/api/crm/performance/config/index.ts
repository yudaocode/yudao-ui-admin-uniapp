import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 业绩目标设置 */
export interface PerformanceConfig {
  id?: number
  objectId?: number
  objectName?: string
  objectType?: number
  year?: number | string
  januaryTargetPrice?: number
  februaryTargetPrice?: number
  marchTargetPrice?: number
  aprilTargetPrice?: number
  mayTargetPrice?: number
  juneTargetPrice?: number
  julyTargetPrice?: number
  augustTargetPrice?: number
  septemberTargetPrice?: number
  octoberTargetPrice?: number
  novemberTargetPrice?: number
  decemberTargetPrice?: number
  bizType?: number
  yearTargetPrice?: number
  createTime?: Date | string
}

/** 业绩目标对象类型 */
export enum PerformanceConfigObjectTypeEnum {
  DEPT = 2,
  USER = 3,
}

/** 查询业绩目标设置分页 */
export function getPerformanceConfigPage(params: PageParam) {
  return http.get<PageResult<PerformanceConfig>>('/crm/performance-config/page', params)
}

/** 查询业绩目标设置详情 */
export function getPerformanceConfig(id: number) {
  return http.get<PerformanceConfig>(`/crm/performance-config/get?id=${id}`)
}

/** 新增业绩目标设置 */
export function createPerformanceConfig(data: PerformanceConfig) {
  return http.post<number>('/crm/performance-config/create', data)
}

/** 修改业绩目标设置 */
export function updatePerformanceConfig(data: PerformanceConfig) {
  return http.put<boolean>('/crm/performance-config/update', data)
}

/** 删除业绩目标设置 */
export function deletePerformanceConfig(id: number) {
  return http.delete<boolean>(`/crm/performance-config/delete?id=${id}`)
}
