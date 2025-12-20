import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 站内信消息信息 */
export interface NotifyMessage {
  id: number
  userId: number
  userType: number
  templateId: number
  templateCode: string
  templateNickname: string
  templateContent: string
  templateType: number
  templateParams: string
  readStatus: boolean
  readTime: Date
  createTime?: Date
}

/** 查询站内信消息列表 */
export function getNotifyMessagePage(params: PageParam) {
  return http.get<PageResult<NotifyMessage>>('/system/notify-message/page', params)
}

/** 查询站内信消息详情 */
export function getNotifyMessage(id: number) {
  return http.get<NotifyMessage>(`/system/notify-message/get`, { id })
}

/** 获取我的站内信分页 */
export function getMyNotifyMessagePage(params: PageParam) {
  return http.get<PageResult<NotifyMessage>>('/system/notify-message/my-page', params)
}

/** 获取我的站内信详情 */
export function getMyNotifyMessage(id: number) {
  return http.get<NotifyMessage>(`/system/notify-message/get`, { id })
}

/** 批量标记站内信已读 */
export function updateNotifyMessageRead(ids: number | number[]) {
  const idsArray = Array.isArray(ids) ? ids : [ids]
  return http.put<boolean>('/system/notify-message/update-read', undefined, { ids: idsArray })
}

/** 标记所有站内信为已读 */
export function updateAllNotifyMessageRead() {
  return http.put<boolean>('/system/notify-message/update-all-read')
}

/** 获取当前用户的未读站内信数量 */
export function getUnreadNotifyMessageCount() {
  return http.get<number>('/system/notify-message/get-unread-count')
}
