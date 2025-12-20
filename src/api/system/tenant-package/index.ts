import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 租户套餐信息 */
export interface TenantPackage {
  id?: number
  name: string
  status: number
  remark: string
  menuIds: number[]
  createTime?: Date
}

/** 获取租户套餐分页列表 */
export function getTenantPackagePage(params: PageParam) {
  return http.get<PageResult<TenantPackage>>('/system/tenant-package/page', params)
}

/** 获取租户套餐精简信息列表 */
export function getTenantPackageList() {
  return http.get<TenantPackage[]>('/system/tenant-package/get-simple-list')
}

/** 获取租户套餐详情 */
export function getTenantPackage(id: number) {
  return http.get<TenantPackage>(`/system/tenant-package/get?id=${id}`)
}

/** 创建租户套餐 */
export function createTenantPackage(data: TenantPackage) {
  return http.post<number>('/system/tenant-package/create', data)
}

/** 更新租户套餐 */
export function updateTenantPackage(data: TenantPackage) {
  return http.put<boolean>('/system/tenant-package/update', data)
}

/** 删除租户套餐 */
export function deleteTenantPackage(id: number) {
  return http.delete<boolean>(`/system/tenant-package/delete?id=${id}`)
}
