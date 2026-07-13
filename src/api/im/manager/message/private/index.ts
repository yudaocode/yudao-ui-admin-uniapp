import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端私聊消息 */
export interface ImManagerPrivateMessageVO {
  id: number
  clientMessageId?: string
  senderId: number
  senderNickname?: string
  receiverId: number
  receiverNickname?: string
  type: number
  content: string
  status: number
  receiptStatus: number
  sendTime: string
  createTime: string
}

/** 获得私聊消息分页 */
export function getManagerPrivateMessagePage(params: PageParam) {
  return http.get<PageResult<ImManagerPrivateMessageVO>>('/im/manager/message/private/page', params)
}

/** 获得私聊消息详情 */
export function getManagerPrivateMessage(id: number) {
  return http.get<ImManagerPrivateMessageVO>('/im/manager/message/private/get', { id })
}
