import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 用户信息 */
export interface User {
  id?: number
  username: string
  nickname: string
  password?: string
  deptId?: number
  deptName?: string
  postIds?: number[]
  email?: string
  mobile?: string
  sex?: number
  avatar?: string
  status: number
  remark?: string
  loginIp?: string
  loginDate?: string
  createTime?: string
}

/** 获取用户分页列表 */
export function getUserPage(params: PageParam) {
  return http.get<PageResult<User>>('/system/user/page', params)
}

/** 获取用户详情 */
export function getUser(id: number) {
  return http.get<User>(`/system/user/get?id=${id}`)
}

/** 创建用户 */
export function createUser(data: User) {
  return http.post<number>('/system/user/create', data)
}

/** 更新用户 */
export function updateUser(data: User) {
  return http.put<boolean>('/system/user/update', data)
}

/** 删除用户 */
export function deleteUser(id: number) {
  return http.delete<boolean>(`/system/user/delete?id=${id}`)
}

/** 重置用户密码 */
export function resetUserPassword(id: number, password: string) {
  return http.put<boolean>('/system/user/update-password', { id, password })
}

/** 修改用户状态 */
export function updateUserStatus(id: number, status: number) {
  return http.put<boolean>('/system/user/update-status', { id, status })
}

/** 获取用户拥有的角色列表 */
export function getUserRoleIds(userId: number) {
  return http.get<number[]>(`/system/permission/list-user-roles?userId=${userId}`)
}

/** 分配用户角色 */
export function assignUserRole(userId: number, roleIds: number[]) {
  return http.post<boolean>('/system/permission/assign-user-role', { userId, roleIds })
}

/** 获取用户精简列表 */
export function getSimpleUserList() {
  return http.get<User[]>('/system/user/simple-list')
}
