import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 租户信息 */
export interface Tenant {
  id?: number
  name: string
  packageId: number
  contactName: string
  contactMobile: string
  accountCount: number
  expireTime: Date | any
  websites: string[]
  status: number
  createTime?: Date
}

/** 获取租户分页列表 */
export function getTenantPage(params: PageParam) {
  return http.get<PageResult<Tenant>>('/system/tenant/page', params)
}

/** 获取租户精简信息列表 */
export function getSimpleTenantList() {
  return http.get<Tenant[]>('/system/tenant/simple-list')
}

/** 获取租户详情 */
export function getTenant(id: number) {
  return http.get<Tenant>(`/system/tenant/get?id=${id}`)
}

/** 创建租户 */
export function createTenant(data: Tenant) {
  return http.post<number>('/system/tenant/create', data)
}

/** 更新租户 */
export function updateTenant(data: Tenant) {
  return http.put<boolean>('/system/tenant/update', data)
}

/** 删除租户 */
export function deleteTenant(id: number) {
  return http.delete<boolean>(`/system/tenant/delete?id=${id}`)
}
