import { http } from '@/http/http'

/** 点赞文档 */
export function createKnowledgeDocumentLike(documentId: number) {
  return http.post<boolean>('/pms/kb/document-like/create', undefined, { documentId })
}

/** 取消点赞文档 */
export function deleteKnowledgeDocumentLike(documentId: number) {
  return http.delete<boolean>('/pms/kb/document-like/delete', undefined, { documentId })
}
