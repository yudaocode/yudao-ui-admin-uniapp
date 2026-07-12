import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 知识库分段 */
export interface KnowledgeSegment {
  id?: number
  documentId?: number
  knowledgeId?: number
  vectorId?: string
  content?: string
  contentLength?: number
  tokens?: number
  retrievalCount?: number
  status?: number
  createTime?: number
}

/** 查询知识库分段分页 */
export function getKnowledgeSegmentPage(params: PageParam) {
  return http.get<PageResult<KnowledgeSegment>>('/ai/knowledge/segment/page', params)
}

/** 查询知识库分段详情 */
export function getKnowledgeSegment(id: number) {
  return http.get<KnowledgeSegment>(`/ai/knowledge/segment/get?id=${id}`)
}

/** 删除知识库分段 */
export function deleteKnowledgeSegment(id: number) {
  return http.delete<boolean>(`/ai/knowledge/segment/delete?id=${id}`)
}

/** 新增知识库分段 */
export function createKnowledgeSegment(data: KnowledgeSegment) {
  return http.post<number>('/ai/knowledge/segment/create', data)
}

/** 修改知识库分段 */
export function updateKnowledgeSegment(data: KnowledgeSegment) {
  return http.put<boolean>('/ai/knowledge/segment/update', data)
}

/** 修改知识库分段状态 */
export function updateKnowledgeSegmentStatus(data: any) {
  return http.put<boolean>('/ai/knowledge/segment/update-status', data)
}

/** 切片内容 */
export function splitContent(url: string, segmentMaxTokens: number) {
  return http.get<KnowledgeSegment[]>('/ai/knowledge/segment/split', { url, segmentMaxTokens })
}

/** 获取文档处理列表 */
export function getKnowledgeSegmentProcessList(documentIds: number[]) {
  return http.get<any[]>('/ai/knowledge/segment/get-process-list', { documentIds: documentIds.join(',') })
}

/** 搜索知识库分段 */
export function searchKnowledgeSegment(params: any) {
  return http.get<any[]>('/ai/knowledge/segment/search', params)
}
