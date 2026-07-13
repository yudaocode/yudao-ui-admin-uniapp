import { http } from '@/http/http'

/** IM 会话读位置 */
export interface ImConversationReadRespVO {
  id: number
  conversationType: number
  targetId: number
  messageId: number
  updateTime?: number
}

/** 增量拉取当前用户的会话读位置 */
export function pullMyConversationReadList(params: {
  lastUpdateTime?: number
  lastId?: number
  limit: number
}) {
  return http.get<ImConversationReadRespVO[]>('/im/conversation-read/pull', params)
}
