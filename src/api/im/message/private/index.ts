import { http } from '@/http/http'

/** IM 私聊消息 */
export interface ImPrivateMessageRespVO {
  id: number
  clientMessageId: string
  senderId: number
  receiverId: number
  type: number
  content: string
  status: number
  receiptStatus: number
  sendTime: string
}

/** IM 私聊消息发送 */
export interface ImPrivateMessageSendReq {
  clientMessageId: string
  receiverId: number
  type: number
  content: string
  receipt?: boolean
}

/** IM 私聊历史消息查询 */
export interface ImPrivateMessageListReq {
  receiverId: number | string
  maxId?: number | string
  limit: number
}

/** 发送私聊消息 */
export function sendPrivateMessage(data: ImPrivateMessageSendReq) {
  return http.post<ImPrivateMessageRespVO>('/im/message/private/send', data)
}

/** 拉取私聊消息 */
export function pullPrivateMessages(params: { minId: number | string, size: number }) {
  return http.get<ImPrivateMessageRespVO[]>('/im/message/private/pull', params)
}

/** 查询私聊历史消息 */
export function getPrivateMessageList(params: ImPrivateMessageListReq) {
  return http.get<ImPrivateMessageRespVO[]>('/im/message/private/list', params)
}

/** 标记私聊消息已读 */
export function readPrivateMessages(receiverId: number | string, messageId: number | string) {
  return http.put<boolean>('/im/message/private/read', undefined, { receiverId, messageId })
}

/** 查询对方已读到我发的最大消息编号 */
export function getPrivateMaxReadMessageId(peerId: number | string) {
  return http.get<number | null>('/im/message/private/max-read-message-id', { peerId })
}

/** 撤回私聊消息 */
export function recallPrivateMessage(id: number | string) {
  return http.delete<ImPrivateMessageRespVO>('/im/message/private/recall', undefined, { id })
}
