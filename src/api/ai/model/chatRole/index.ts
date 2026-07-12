import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 聊天角色 */
export interface ChatRoleVO {
  id?: number
  modelId?: number
  modelName?: string
  model?: string
  name?: string
  avatar?: string
  category?: string
  sort?: number
  description?: string
  systemMessage?: string
  welcomeMessage?: string
  publicStatus?: boolean
  status?: number
  knowledgeIds?: number[]
  toolIds?: number[]
  mcpClientNames?: string[]
  createTime?: string
}

/** AI 聊天角色分页请求 */
export interface ChatRolePageReq extends PageParam {
  name?: string
  category?: string
  publicStatus?: boolean
}

/** 查询聊天角色分页 */
export function getChatRolePage(params: PageParam) {
  return http.get<PageResult<ChatRoleVO>>('/ai/chat-role/page', params)
}

/** 查询聊天角色详情 */
export function getChatRole(id: number) {
  return http.get<ChatRoleVO>(`/ai/chat-role/get?id=${id}`)
}

/** 新增聊天角色 */
export function createChatRole(data: ChatRoleVO) {
  return http.post<number>('/ai/chat-role/create', data)
}

/** 修改聊天角色 */
export function updateChatRole(data: ChatRoleVO) {
  return http.put<boolean>('/ai/chat-role/update', data)
}

/** 删除聊天角色 */
export function deleteChatRole(id: number) {
  return http.delete<boolean>(`/ai/chat-role/delete?id=${id}`)
}

/** 获取我的角色分页 */
export function getMyPage(params: ChatRolePageReq) {
  return http.get<PageResult<ChatRoleVO>>('/ai/chat-role/my-page', params)
}

/** 获取角色分类 */
export function getCategoryList() {
  return http.get<string[]>('/ai/chat-role/category-list')
}

/** 创建我的角色 */
export function createMy(data: ChatRoleVO) {
  return http.post<number>('/ai/chat-role/create-my', data)
}

/** 更新我的角色 */
export function updateMy(data: ChatRoleVO) {
  return http.put<boolean>('/ai/chat-role/update-my', data)
}

/** 删除我的角色 */
export function deleteMy(id: number) {
  return http.delete<boolean>(`/ai/chat-role/delete-my?id=${id}`)
}
