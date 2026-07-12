import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 模型 */
export interface ModelVO {
  id?: number
  keyId?: number
  name?: string
  model?: string
  platform?: string
  type?: number
  sort?: number
  status?: number
  temperature?: number
  maxTokens?: number
  maxContexts?: number
  createTime?: string
}

/** 查询模型分页 */
export function getModelPage(params: PageParam) {
  return http.get<PageResult<ModelVO>>('/ai/model/page', params)
}

/** 获得模型列表 */
export function getModelSimpleList(type?: number) {
  return http.get<ModelVO[]>('/ai/model/simple-list', { type })
}

/** 查询模型详情 */
export function getModel(id: number) {
  return http.get<ModelVO>(`/ai/model/get?id=${id}`)
}

/** 新增模型 */
export function createModel(data: ModelVO) {
  return http.post<number>('/ai/model/create', data)
}

/** 修改模型 */
export function updateModel(data: ModelVO) {
  return http.put<boolean>('/ai/model/update', data)
}

/** 删除模型 */
export function deleteModel(id: number) {
  return http.delete<boolean>(`/ai/model/delete?id=${id}`)
}
