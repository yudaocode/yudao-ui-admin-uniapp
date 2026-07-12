import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 知识库分段 */
export interface KnowledgeSegment {
  id?: number
  documentId?: number
  documentName?: string
  knowledgeId?: number
  vectorId?: string
  content?: string
  contentLength?: number
  tokens?: number
  retrievalCount?: number
  status?: number
  createTime?: number
}

/** AI 知识库分段新增请求 */
export interface KnowledgeSegmentCreateReq {
  documentId: number
  content: string
}

/** AI 知识库分段修改请求 */
export interface KnowledgeSegmentUpdateReq {
  id: number
  content: string
}

/** AI 知识库分段状态修改请求 */
export interface KnowledgeSegmentUpdateStatusReq {
  id: number
  status: number
}

/** AI 知识库分段处理进度 */
export interface KnowledgeSegmentProcess {
  documentId: number
  count: number
  embeddingCount: number
}

/** AI 知识库分段搜索请求 */
export interface KnowledgeSegmentSearchReq {
  knowledgeId: number
  content: string
  topK?: number
  similarityThreshold?: number
}

/** AI 知识库分段搜索结果 */
export interface KnowledgeSegmentSearch extends KnowledgeSegment {
  documentName: string
  score: number
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
export function createKnowledgeSegment(data: KnowledgeSegmentCreateReq) {
  return http.post<number>('/ai/knowledge/segment/create', data)
}

/** 修改知识库分段 */
export function updateKnowledgeSegment(data: KnowledgeSegmentUpdateReq) {
  return http.put<boolean>('/ai/knowledge/segment/update', data)
}

/** 修改知识库分段状态 */
export function updateKnowledgeSegmentStatus(data: KnowledgeSegmentUpdateStatusReq) {
  return http.put<boolean>('/ai/knowledge/segment/update-status', data)
}

/** 切片内容 */
export function splitContent(url: string, segmentMaxTokens: number) {
  return http.get<KnowledgeSegment[]>('/ai/knowledge/segment/split', { url, segmentMaxTokens })
}

/** 获取文档处理列表 */
export function getKnowledgeSegmentProcessList(documentIds: number[]) {
  return http.get<KnowledgeSegmentProcess[]>('/ai/knowledge/segment/get-process-list', { documentIds: documentIds.join(',') })
}

/** 搜索知识库分段 */
export function searchKnowledgeSegment(params: KnowledgeSegmentSearchReq) {
  return http.get<KnowledgeSegmentSearch[]>('/ai/knowledge/segment/search', params)
}
