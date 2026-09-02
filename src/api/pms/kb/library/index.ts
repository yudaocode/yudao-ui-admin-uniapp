import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** PMS 知识库 */
export interface KnowledgeLibrary {
  id: number // 知识库编号
  name: string // 知识库名称
  description?: string // 知识库简介
  openStatus: boolean // 是否公开
  coverUrl?: string // 知识库封面
  adminUserIds?: number[] // 创建时的初始管理员用户编号列表
  memberUserIds?: number[] // 创建时的初始普通成员用户编号列表
  templateId?: number // 模板编号，仅创建时有效
  creatorUserId?: number // 创建人用户编号
  creatorUserName?: string // 创建人姓名
  memberCount?: number // 成员数量
  documentCount?: number // 文档数量
  fileCount?: number // 文件数量
  writeStatus?: boolean // 当前用户是否可以编辑内容
  adminStatus?: boolean // 当前用户是否为知识库管理员
  exitStatus?: boolean // 当前用户是否可以主动退出知识库
  favoriteStatus?: boolean // 当前用户是否已关注
  createTime?: number // 创建时间
}

/** PMS 知识库模板选项 */
export interface KnowledgeLibraryTemplateOption {
  id: number // 模板编号
  name: string // 模板名称
  description?: string // 模板简介
  coverUrl?: string // 模板封面
  documents?: Array<{ title: string }> // 模板文档列表（仅标题）
}

/** 查询知识库分页 */
export function getKnowledgeLibraryPage(params: PageParam & Record<string, any>) {
  return http.get<PageResult<KnowledgeLibrary>>('/pms/kb/library/page', params)
}

/** 查询知识库详情 */
export function getKnowledgeLibrary(id: number) {
  return http.get<KnowledgeLibrary>('/pms/kb/library/get', { id })
}

/** 查询知识库模板列表 */
export function getKnowledgeLibraryTemplateList() {
  return http.get<KnowledgeLibraryTemplateOption[]>('/pms/kb/library-template/simple-list')
}

/** 新增知识库 */
export function createKnowledgeLibrary(data: Partial<KnowledgeLibrary>) {
  return http.post<number>('/pms/kb/library/create', data)
}

/** 修改知识库 */
export function updateKnowledgeLibrary(data: Partial<KnowledgeLibrary>) {
  return http.put<boolean>('/pms/kb/library/update', data)
}

/** 删除知识库 */
export function deleteKnowledgeLibrary(id: number) {
  return http.delete<boolean>('/pms/kb/library/delete', undefined, { id })
}
