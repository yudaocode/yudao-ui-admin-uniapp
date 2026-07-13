import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端群聊消息 */
export interface ImManagerGroupMessageVO {
  id: number
  clientMessageId?: string
  groupId: number
  groupName?: string
  senderId: number
  senderNickname?: string
  type: number
  content: string
  status: number
  atUserIds?: number[]
  atUserNicknames?: (null | string)[]
  receiptStatus?: number
  sendTime: string
  createTime: string
}

/** 获取群聊消息分页 */
export function getManagerGroupMessagePage(params: PageParam) {
  return http.get<PageResult<ImManagerGroupMessageVO>>('/im/manager/message/group/page', params)
}

/** 获取群聊消息详情 */
export function getManagerGroupMessage(id: number) {
  return http.get<ImManagerGroupMessageVO>('/im/manager/message/group/get', { id })
}
