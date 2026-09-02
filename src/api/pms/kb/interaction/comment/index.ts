import { http } from '@/http/http'

/** PMS 知识库文档评论 */
export interface KnowledgeDocumentComment {
  id: number // 评论编号
  documentId: number // 文档编号
  userId: number // 评论人用户编号
  userName?: string // 评论人昵称
  mainId: number // 主评论编号
  replyUserId?: number // 回复对象用户编号
  replyUserName?: string // 回复对象昵称
  content: string // 评论内容
  createTime: number // 创建时间
  children: KnowledgeDocumentComment[] // 回复列表
}

/** 查询文档评论列表 */
export function getKnowledgeDocumentCommentList(documentId: number) {
  return http.get<KnowledgeDocumentComment[]>('/pms/kb/document-comment/list', { documentId })
}

/** 新增文档评论 */
export function createKnowledgeDocumentComment(data: Partial<KnowledgeDocumentComment>) {
  return http.post<number>('/pms/kb/document-comment/create', data)
}

/** 删除文档评论 */
export function deleteKnowledgeDocumentComment(id: number) {
  return http.delete<boolean>('/pms/kb/document-comment/delete', undefined, { id })
}
