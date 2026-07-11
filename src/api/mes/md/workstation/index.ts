import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 工作站 */
export interface MdWorkstation {
  id?: number
  code: string
  name: string
  address?: string | null
  workshopId: number
  workshopName?: string
  processId: number
  processName?: string
  warehouseId?: number | null
  locationId?: number | null
  areaId?: number | null
  status: number
  remark?: string | null
  createTime?: Date
}

/** 查询工作站分页 */
export function getWorkstationPage(params: PageParam) {
  return http.get<PageResult<MdWorkstation>>(`/mes/md-workstation/page`, params)
}

/** 查询工作站详情 */
export function getWorkstation(id: number) {
  return http.get<MdWorkstation>(`/mes/md-workstation/get?id=${id}`)
}

/** 新增工作站 */
export function createWorkstation(data: MdWorkstation) {
  return http.post<number>(`/mes/md-workstation/create`, data)
}

/** 修改工作站 */
export function updateWorkstation(data: MdWorkstation) {
  return http.put<boolean>(`/mes/md-workstation/update`, data)
}

/** 删除工作站 */
export function deleteWorkstation(id: number) {
  return http.delete<boolean>(`/mes/md-workstation/delete?id=${id}`)
}
