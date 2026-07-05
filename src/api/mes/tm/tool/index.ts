import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 工具台账 */
export interface TmTool {
  id?: number
  code: string
  name: string
  brand?: string
  specification?: string
  toolTypeId?: number
  toolTypeName?: string
  quantity: number
  availableQuantity: number
  maintenType?: number
  nextMaintenPeriod?: number
  nextMaintenDate?: string | Date
  status: number
  remark?: string
  createTime?: Date
}

/** 查询工具分页 */
export function getToolPage(params: PageParam) {
  return http.get<PageResult<TmTool>>(`/mes/tm/tool/page`, params)
}

/** 查询工具详情 */
export function getTool(id: number) {
  return http.get<TmTool>(`/mes/tm/tool/get?id=${id}`)
}

/** 导出工具 Excel */
export function exportTool(params: Record<string, any>) {
  return http.get<Blob>(`/mes/tm/tool/export-excel`, params)
}

/** 新增工具 */
export function createTool(data: TmTool) {
  return http.post<number>(`/mes/tm/tool/create`, data)
}

/** 修改工具 */
export function updateTool(data: TmTool) {
  return http.put<boolean>(`/mes/tm/tool/update`, data)
}

/** 删除工具 */
export function deleteTool(id: number) {
  return http.delete<boolean>(`/mes/tm/tool/delete?id=${id}`)
}
