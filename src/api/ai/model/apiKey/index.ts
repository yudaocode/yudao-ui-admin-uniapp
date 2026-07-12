import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI API 密钥 */
export interface ApiKeyVO {
  id?: number
  name?: string
  apiKey?: string
  platform?: string
  url?: string
  status?: number
}

/** 查询 API 密钥分页 */
export function getApiKeyPage(params: PageParam) {
  return http.get<PageResult<ApiKeyVO>>('/ai/api-key/page', params)
}

/** 获得 API 密钥列表 */
export function getApiKeySimpleList() {
  return http.get<ApiKeyVO[]>('/ai/api-key/simple-list')
}

/** 查询 API 密钥详情 */
export function getApiKey(id: number) {
  return http.get<ApiKeyVO>(`/ai/api-key/get?id=${id}`)
}

/** 新增 API 密钥 */
export function createApiKey(data: ApiKeyVO) {
  return http.post<number>('/ai/api-key/create', data)
}

/** 修改 API 密钥 */
export function updateApiKey(data: ApiKeyVO) {
  return http.put<boolean>('/ai/api-key/update', data)
}

/** 删除 API 密钥 */
export function deleteApiKey(id: number) {
  return http.delete<boolean>(`/ai/api-key/delete?id=${id}`)
}
