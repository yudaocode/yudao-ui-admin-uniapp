import { http } from '@/http/http'

/** IM 群聊消息 */
export interface ImGroupMessageRespVO {
  id: number
  clientMessageId: string
  senderId: number
  groupId: number
  type: number
  content: string
  status: number
  sendTime: string
  atUserIds?: number[]
  receiverUserIds?: number[]
  receiptStatus?: number
  readCount?: number
}

/** IM 群聊消息发送 */
export interface ImGroupMessageSendReq {
  clientMessageId: string
  groupId: number
  type: number
  content: string
  atUserIds?: number[]
  receipt?: boolean
}

/** IM 群聊历史消息查询 */
export interface ImGroupMessageListReq {
  groupId: number | string
  maxId?: number | string
  limit: number
}

/** 发送群聊消息 */
export function sendGroupMessage(data: ImGroupMessageSendReq) {
  return http.post<ImGroupMessageRespVO>('/im/message/group/send', data)
}

/** 拉取群聊消息 */
export function pullGroupMessages(params: { minId: number | string, size: number }) {
  return http.get<ImGroupMessageRespVO[]>('/im/message/group/pull', params)
}

/** 查询群聊历史消息 */
export function getGroupMessageList(params: ImGroupMessageListReq) {
  return http.get<ImGroupMessageRespVO[]>('/im/message/group/list', params)
}

/** 标记群聊消息已读 */
export function readGroupMessages(groupId: number | string, messageId: number | string) {
  return http.put<boolean>('/im/message/group/read', undefined, { groupId, messageId })
}

/** 撤回群聊消息 */
export function recallGroupMessage(id: number | string) {
  return http.delete<ImGroupMessageRespVO>('/im/message/group/recall', undefined, { id })
}

/** 获取群消息已读用户列表 */
export function getGroupReadUsers(params: { groupId: number | string, messageId: number | string }) {
  return http.get<number[]>('/im/message/group/get-read-user-ids', params)
}
