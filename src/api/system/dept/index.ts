import { http } from '@/http/http'

/** 部门信息 */
export interface Dept {
  id?: number
  name: string
  parentId: number
  status: number
  sort: number
  leaderUserId?: number
  phone?: string
  email?: string
  createTime?: string
  children?: Dept[]
}

/** 获取部门列表 */
export function getDeptList(params?: { name?: string, status?: number }) {
  return http.get<Dept[]>('/system/dept/list', params)
}

/** 获取部门精简列表 */
export function getSimpleDeptList() {
  return http.get<Dept[]>('/system/dept/simple-list')
}

/** 获取部门详情 */
export function getDept(id: number) {
  return http.get<Dept>(`/system/dept/get?id=${id}`)
}

/** 创建部门 */
export function createDept(data: Dept) {
  return http.post<number>('/system/dept/create', data)
}

/** 更新部门 */
export function updateDept(data: Dept) {
  return http.put<boolean>('/system/dept/update', data)
}

/** 删除部门 */
export function deleteDept(id: number) {
  return http.delete<boolean>(`/system/dept/delete?id=${id}`)
}
