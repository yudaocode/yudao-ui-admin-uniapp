import type { PageParam, PageResult } from '@/http/types'
import type { KnowledgeDocument } from '..'
import { http } from '@/http/http'

/** PMS 知识库文档标签 */
export interface KnowledgeDocumentLabel {
  id: number // 文档标签编号
  name: string // 标签名称
  color: string // 标签颜色
  createTime: number // 创建时间
}

/** 查询文档标签详情 */
export function getKnowledgeDocumentLabel(id: number) {
  return http.get<KnowledgeDocumentLabel>('/pms/kb/document-label/get', { id })
}

/** 查询文档标签列表 */
export function getKnowledgeDocumentLabelList() {
  return http.get<KnowledgeDocumentLabel[]>('/pms/kb/document-label/list')
}

/** 新增文档标签 */
export function createKnowledgeDocumentLabel(data: Partial<KnowledgeDocumentLabel>) {
  return http.post<number>('/pms/kb/document-label/create', data)
}

/** 修改文档标签 */
export function updateKnowledgeDocumentLabel(data: Partial<KnowledgeDocumentLabel>) {
  return http.put<boolean>('/pms/kb/document-label/update', data)
}

/** 删除文档标签 */
export function deleteKnowledgeDocumentLabel(id: number) {
  return http.delete<boolean>('/pms/kb/document-label/delete', undefined, { id })
}

/** 查询标签下的文档分页 */
export function getKnowledgeDocumentPageByLabel(params: PageParam & Record<string, any>) {
  return http.get<PageResult<KnowledgeDocument>>('/pms/kb/document-label/document-page', params)
}
