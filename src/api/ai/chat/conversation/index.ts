import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 聊天对话 */
export interface ChatConversation {
  id?: number
  userId?: number
  title?: string
  pinned?: boolean
  roleId?: number
  modelId?: number
  model?: string
  temperature?: number
  maxTokens?: number
  maxContexts?: number
  createTime?: string
  systemMessage?: string
  modelName?: string
  roleAvatar?: string
  modelMaxTokens?: string
  modelMaxContexts?: string
  roleName?: string
  messageCount?: number
}

/** 获得我的聊天对话 */
export function getChatConversationMy(id: number) {
  return http.get<ChatConversation>(`/ai/chat/conversation/get-my?id=${id}`)
}

/** 新增我的聊天对话 */
export function createChatConversationMy(data?: ChatConversation) {
  return http.post<number>('/ai/chat/conversation/create-my', data || {})
}

/** 更新我的聊天对话 */
export function updateChatConversationMy(data: ChatConversation) {
  return http.put<boolean>('/ai/chat/conversation/update-my', data)
}

/** 删除我的聊天对话 */
export function deleteChatConversationMy(id: number | string) {
  return http.delete<boolean>(`/ai/chat/conversation/delete-my?id=${id}`)
}

/** 删除我的未置顶对话 */
export function deleteChatConversationMyByUnpinned() {
  return http.delete<boolean>('/ai/chat/conversation/delete-by-unpinned')
}

/** 获得我的聊天对话列表 */
export function getChatConversationMyList() {
  return http.get<ChatConversation[]>('/ai/chat/conversation/my-list')
}

/** 获得对话分页 */
export function getChatConversationPage(params: PageParam) {
  return http.get<PageResult<ChatConversation>>('/ai/chat/conversation/page', params)
}

/** 获得对话详情 */
export function getChatConversation(id: number) {
  return http.get<ChatConversation>(`/ai/chat/conversation/get?id=${id}`)
}

/** 管理员删除对话 */
export function deleteChatConversationByAdmin(id: number) {
  return http.delete<boolean>(`/ai/chat/conversation/delete-by-admin?id=${id}`)
}
