import { http } from '@/http/http'
import { PageParam, PageResult } from '@/http/types';

/** 角色信息 */
export interface Role {
  id: number
  name: string
  code: string
  sort: number
  status: number
  type?: number
  remark?: string
  dataScope?: number
  dataScopeDeptIds?: number[]
  createTime: string
}

/** 获取角色分页列表 */
export function getRolePage(params: PageParam) {
  return http.get<PageResult<Role>>('/system/role/page', params)
}

/** 获取角色详情 */
export function getRole(id: number) {
  return http.get<Role>(`/system/role/get?id=${id}`)
}

/** 创建角色 */
export function createRole(data: Role) {
  return http.post<number>('/system/role/create', data)
}

/** 更新角色 */
export function updateRole(data: Role) {
  return http.put<boolean>('/system/role/update', data)
}

/** 删除角色 */
export function deleteRole(id: number) {
  return http.delete<boolean>(`/system/role/delete?id=${id}`)
}

/** 获取角色精简列表 */
export function getSimpleRoleList() {
  return http.get<Role[]>('/system/role/simple-list')
}
