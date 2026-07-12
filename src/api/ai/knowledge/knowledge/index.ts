import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 知识库 */
export interface Knowledge {
  id?: number
  name?: string
  description?: string
  embeddingModelId?: number
  embeddingModel?: string
  topK?: number
  similarityThreshold?: number
  status?: number
  createTime?: number
}

/** 查询知识库分页 */
export function getKnowledgePage(params: PageParam) {
  return http.get<PageResult<Knowledge>>('/ai/knowledge/page', params)
}

/** 查询知识库详情 */
export function getKnowledge(id: number) {
  return http.get<Knowledge>(`/ai/knowledge/get?id=${id}`)
}

/** 新增知识库 */
export function createKnowledge(data: Knowledge) {
  return http.post<number>('/ai/knowledge/create', data)
}

/** 修改知识库 */
export function updateKnowledge(data: Knowledge) {
  return http.put<boolean>('/ai/knowledge/update', data)
}

/** 删除知识库 */
export function deleteKnowledge(id: number) {
  return http.delete<boolean>(`/ai/knowledge/delete?id=${id}`)
}

/** 获取知识库简单列表 */
export function getSimpleKnowledgeList() {
  return http.get<Knowledge[]>('/ai/knowledge/simple-list')
}
