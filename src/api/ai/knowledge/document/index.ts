import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 知识库文档 */
export interface KnowledgeDocument {
  id?: number
  knowledgeId?: number
  name?: string
  url?: string
  content?: string
  contentLength?: number
  tokens?: number
  segmentMaxTokens?: number
  retrievalCount?: number
  status?: number
  createTime?: number
}

/** AI 知识库文档新增请求 */
export interface KnowledgeDocumentCreateReq {
  knowledgeId: number
  name: string
  url: string
  segmentMaxTokens: number
}

/** AI 知识库文档批量新增请求 */
export interface KnowledgeDocumentCreateListReq {
  knowledgeId: number
  segmentMaxTokens: number
  list: Array<{
    name: string
    url: string
  }>
}

/** AI 知识库文档修改请求 */
export interface KnowledgeDocumentUpdateReq {
  id: number
  name?: string
  segmentMaxTokens?: number
}

/** AI 知识库文档状态修改请求 */
export interface KnowledgeDocumentUpdateStatusReq {
  id: number
  status: number
}

/** 查询知识库文档分页 */
export function getKnowledgeDocumentPage(params: PageParam) {
  return http.get<PageResult<KnowledgeDocument>>('/ai/knowledge/document/page', params)
}

/** 查询知识库文档详情 */
export function getKnowledgeDocument(id: number) {
  return http.get<KnowledgeDocument>(`/ai/knowledge/document/get?id=${id}`)
}

/** 新增知识库文档 */
export function createKnowledgeDocument(data: KnowledgeDocumentCreateReq) {
  return http.post<number>('/ai/knowledge/document/create', data)
}

/** 批量新增知识库文档 */
export function createKnowledgeDocumentList(data: KnowledgeDocumentCreateListReq) {
  return http.post<number[]>('/ai/knowledge/document/create-list', data)
}

/** 修改知识库文档 */
export function updateKnowledgeDocument(data: KnowledgeDocumentUpdateReq) {
  return http.put<boolean>('/ai/knowledge/document/update', data)
}

/** 修改知识库文档状态 */
export function updateKnowledgeDocumentStatus(data: KnowledgeDocumentUpdateStatusReq) {
  return http.put<boolean>('/ai/knowledge/document/update-status', data)
}

/** 删除知识库文档 */
export function deleteKnowledgeDocument(id: number) {
  return http.delete<boolean>(`/ai/knowledge/document/delete?id=${id}`)
}
