import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 工具 */
export interface Tool {
  id?: number
  name?: string
  description?: string
  status?: number
  createTime?: string
}

/** 查询工具分页 */
export function getToolPage(params: PageParam) {
  return http.get<PageResult<Tool>>('/ai/tool/page', params)
}

/** 查询工具详情 */
export function getTool(id: number) {
  return http.get<Tool>(`/ai/tool/get?id=${id}`)
}

/** 新增工具 */
export function createTool(data: Tool) {
  return http.post<number>('/ai/tool/create', data)
}

/** 修改工具 */
export function updateTool(data: Tool) {
  return http.put<boolean>('/ai/tool/update', data)
}

/** 删除工具 */
export function deleteTool(id: number) {
  return http.delete<boolean>(`/ai/tool/delete?id=${id}`)
}

/** 获取工具简单列表 */
export function getToolSimpleList() {
  return http.get<Tool[]>('/ai/tool/simple-list')
}
