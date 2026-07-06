import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 客户限制配置 */
export interface CustomerLimitConfig {
  id?: number
  type?: number
  userIds?: number[]
  deptIds?: number[]
  users?: { id?: number, nickname?: string }[]
  depts?: { id?: number, name?: string }[]
  maxCount?: number
  dealCountEnabled?: boolean
}

/** 客户限制配置类型 */
export enum LimitConfType {
  CUSTOMER_QUANTITY_LIMIT = 1,
  CUSTOMER_LOCK_LIMIT = 2,
}

/** 查询客户限制配置分页列表 */
export function getCustomerLimitConfigPage(params: PageParam) {
  return http.get<PageResult<CustomerLimitConfig>>('/crm/customer-limit-config/page', params)
}

/** 查询客户限制配置详情 */
export function getCustomerLimitConfig(id: number) {
  return http.get<CustomerLimitConfig>(`/crm/customer-limit-config/get?id=${id}`)
}

/** 新增客户限制配置 */
export function createCustomerLimitConfig(data: CustomerLimitConfig) {
  return http.post<number>('/crm/customer-limit-config/create', data)
}

/** 修改客户限制配置 */
export function updateCustomerLimitConfig(data: CustomerLimitConfig) {
  return http.put<boolean>('/crm/customer-limit-config/update', data)
}

/** 删除客户限制配置 */
export function deleteCustomerLimitConfig(id: number) {
  return http.delete<boolean>(`/crm/customer-limit-config/delete?id=${id}`)
}
