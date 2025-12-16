import { http } from '@/http/http'

/** 菜单信息 */
export interface Menu {
  id?: number
  name: string
  permission: string
  type: number
  sort: number
  parentId: number
  path: string
  icon: string
  component: string
  componentName?: string
  status: number
  visible: boolean
  keepAlive: boolean
  alwaysShow?: boolean
  createTime?: Date
  children?: Menu[]
}

/** 获取菜单列表 */
export function getMenuList(params?: { name?: string, status?: number }) {
  return http.get<Menu[]>('/system/menu/list', params)
}

/** 获取菜单精简列表 */
export function getSimpleMenuList() {
  return http.get<Menu[]>('/system/menu/simple-list')
}

/** 获取菜单详情 */
export function getMenu(id: number) {
  return http.get<Menu>(`/system/menu/get?id=${id}`)
}

/** 创建菜单 */
export function createMenu(data: Menu) {
  return http.post<number>('/system/menu/create', data)
}

/** 更新菜单 */
export function updateMenu(data: Menu) {
  return http.put<boolean>('/system/menu/update', data)
}

/** 删除菜单 */
export function deleteMenu(id: number) {
  return http.delete<boolean>(`/system/menu/delete?id=${id}`)
}
