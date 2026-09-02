import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** PMS 知识库模板文档 */
export interface KnowledgeLibraryTemplateDocument {
  title: string // 文档标题
  content: string // 文档内容
}

/** PMS 知识库模板 */
export interface KnowledgeLibraryTemplate {
  id?: number // 模板编号
  name: string // 模板名称
  description?: string // 模板简介
  coverUrl?: string // 模板封面地址
  status: number // 模板状态
  sort: number // 显示顺序
  documents?: KnowledgeLibraryTemplateDocument[] // 模板文档列表
  createTime?: number // 创建时间
}

/** PMS 知识库模板保存请求 */
export interface KnowledgeLibraryTemplateSaveReq extends Omit<KnowledgeLibraryTemplate, 'documents'> {
  documents: KnowledgeLibraryTemplateDocument[] // 模板文档列表
}

/** 查询知识库模板分页 */
export function getKnowledgeLibraryTemplatePage(params: PageParam & Record<string, any>) {
  return http.get<PageResult<KnowledgeLibraryTemplate>>('/pms/kb/library-template/page', params)
}

/** 查询知识库模板详情 */
export function getKnowledgeLibraryTemplate(id: number) {
  return http.get<KnowledgeLibraryTemplateSaveReq>('/pms/kb/library-template/get', { id })
}

/** 新增知识库模板 */
export function createKnowledgeLibraryTemplate(data: KnowledgeLibraryTemplateSaveReq) {
  return http.post<number>('/pms/kb/library-template/create', data)
}

/** 修改知识库模板 */
export function updateKnowledgeLibraryTemplate(data: KnowledgeLibraryTemplateSaveReq) {
  return http.put<boolean>('/pms/kb/library-template/update', data)
}

/** 删除知识库模板 */
export function deleteKnowledgeLibraryTemplate(id: number) {
  return http.delete<boolean>('/pms/kb/library-template/delete', undefined, { id })
}
