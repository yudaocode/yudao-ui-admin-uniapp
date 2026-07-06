import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 车间 */
export interface MdWorkshop {
  id?: number
  code: string
  name: string
  area?: number
  chargeUserId?: number
  chargeUserName?: string
  status: number
  remark?: string | null
  createTime?: Date
}

/** 查询车间分页 */
export function getWorkshopPage(params: PageParam) {
  return http.get<PageResult<MdWorkshop>>(`/mes/md-workshop/page`, params)
}

/** 查询车间精简列表 */
export function getWorkshopSimpleList() {
  return http.get<MdWorkshop[]>(`/mes/md-workshop/simple-list`)
}

/** 查询车间详情 */
export function getWorkshop(id: number) {
  return http.get<MdWorkshop>(`/mes/md-workshop/get?id=${id}`)
}

/** 新增车间 */
export function createWorkshop(data: MdWorkshop) {
  return http.post<number>(`/mes/md-workshop/create`, data)
}

/** 修改车间 */
export function updateWorkshop(data: MdWorkshop) {
  return http.put<boolean>(`/mes/md-workshop/update`, data)
}

/** 删除车间 */
export function deleteWorkshop(id: number) {
  return http.delete<boolean>(`/mes/md-workshop/delete?id=${id}`)
}

/** 导出车间 Excel */
export function exportWorkshop(params: Record<string, any>) {
  return http.get<Blob>(`/mes/md-workshop/export-excel`, params)
}
