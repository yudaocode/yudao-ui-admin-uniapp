import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 设备 */
export interface DvMachinery {
  id?: number
  code: string
  name: string
  brand?: string
  specification?: string
  machineryTypeId?: number
  machineryTypeName?: string
  workshopId?: number
  workshopName?: string
  status: number
  lastMaintenTime?: string | Date
  lastCheckTime?: string | Date
  remark?: string
  createTime?: Date
}

/** 查询设备分页 */
export function getMachineryPage(params: PageParam) {
  return http.get<PageResult<DvMachinery>>(`/mes/dv/machinery/page`, params)
}

/** 查询设备详情 */
export function getMachinery(id: number) {
  return http.get<DvMachinery>(`/mes/dv/machinery/get?id=${id}`)
}

/** 导出设备 Excel */
export function exportMachinery(params: Record<string, any>) {
  return http.get<Blob>(`/mes/dv/machinery/export-excel`, params)
}

/** 新增设备 */
export function createMachinery(data: DvMachinery) {
  return http.post<number>(`/mes/dv/machinery/create`, data)
}

/** 修改设备 */
export function updateMachinery(data: DvMachinery) {
  return http.put<boolean>(`/mes/dv/machinery/update`, data)
}

/** 删除设备 */
export function deleteMachinery(id: number) {
  return http.delete<boolean>(`/mes/dv/machinery/delete?id=${id}`)
}
