import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端频道消息 */
export interface ImManagerChannelMessageVO {
  id: number
  channelId: number
  channelName?: string
  materialId: number
  materialTitle?: string
  materialCoverUrl?: string
  type: number
  content?: string
  receiverUserIds?: number[]
  sendTime?: string
}

/** IM 频道消息推送 */
export interface ImManagerChannelMessageSendReq {
  materialId: number
  receiverUserIds?: number[]
}

/** 立即推送频道消息 */
export function sendManagerChannelMessage(data: ImManagerChannelMessageSendReq) {
  return http.post<number>('/im/manager/channel-message/send', data)
}

/** 删除频道消息 */
export function deleteManagerChannelMessage(id: number) {
  return http.delete<boolean>('/im/manager/channel-message/delete', undefined, { id })
}

/** 获取频道消息分页 */
export function getManagerChannelMessagePage(params: PageParam) {
  return http.get<PageResult<ImManagerChannelMessageVO>>('/im/manager/channel-message/page', params)
}

/** 获取频道消息详情 */
export function getManagerChannelMessage(id: number) {
  return http.get<ImManagerChannelMessageVO>(`/im/manager/channel-message/get?id=${id}`)
}
