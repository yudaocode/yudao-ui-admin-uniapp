import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 工艺路线 */
export interface ProRoute {
  id?: number // 编号
  code: string // 工艺路线编码
  name: string // 工艺路线名称
  description?: string // 工艺路线说明
  status?: number // 状态
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询工艺路线分页 */
export function getRoutePage(params: PageParam) {
  return http.get<PageResult<ProRoute>>('/mes/pro/route/page', params)
}

/** 查询工艺路线精简列表 */
export function getRouteSimpleList() {
  return http.get<ProRoute[]>('/mes/pro/route/simple-list')
}

/** 查询工艺路线详情 */
export function getRoute(id: number) {
  return http.get<ProRoute>(`/mes/pro/route/get?id=${id}`)
}

/** 新增工艺路线 */
export function createRoute(data: ProRoute) {
  return http.post<number>('/mes/pro/route/create', data)
}

/** 修改工艺路线 */
export function updateRoute(data: ProRoute) {
  return http.put<boolean>('/mes/pro/route/update', data)
}

/** 修改工艺路线状态 */
export function updateRouteStatus(id: number, status: number) {
  return http.put<boolean>(`/mes/pro/route/update-status?id=${id}&status=${status}`)
}

/** 删除工艺路线 */
export function deleteRoute(id: number) {
  return http.delete<boolean>(`/mes/pro/route/delete?id=${id}`)
}

/** 导出工艺路线 Excel */
export function exportRoute(params: Record<string, any>) {
  return http.get<Blob>('/mes/pro/route/export-excel', params)
}
