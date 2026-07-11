import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 工具类型 */
export interface TmToolType {
  id?: number
  code: string
  name: string
  codeFlag: boolean
  maintenType?: number
  maintenPeriod?: number
  remark?: string
  createTime?: Date
}

/** 查询工具类型分页 */
export function getToolTypePage(params: PageParam) {
  return http.get<PageResult<TmToolType>>(`/mes/tm/tool-type/page`, params)
}

/** 查询工具类型精简列表 */
export function getToolTypeSimpleList() {
  return http.get<TmToolType[]>(`/mes/tm/tool-type/simple-list`)
}

/** 查询工具类型详情 */
export function getToolType(id: number) {
  return http.get<TmToolType>(`/mes/tm/tool-type/get?id=${id}`)
}

/** 新增工具类型 */
export function createToolType(data: TmToolType) {
  return http.post<number>(`/mes/tm/tool-type/create`, data)
}

/** 修改工具类型 */
export function updateToolType(data: TmToolType) {
  return http.put<boolean>(`/mes/tm/tool-type/update`, data)
}

/** 删除工具类型 */
export function deleteToolType(id: number) {
  return http.delete<boolean>(`/mes/tm/tool-type/delete?id=${id}`)
}
