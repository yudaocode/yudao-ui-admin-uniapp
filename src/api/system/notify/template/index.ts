import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 站内信模板信息 */
export interface NotifyTemplate {
  id?: number
  name: string
  nickname: string
  code: string
  content: string
  type?: number
  params?: string[]
  status: number
  remark?: string
  createTime?: Date
}

/** 发送站内信请求 */
export interface NotifySendReqVO {
  userId: number
  userType: number
  templateCode: string
  templateParams: Record<string, any>
}

/** 查询站内信模板列表 */
export function getNotifyTemplatePage(params: PageParam) {
  return http.get<PageResult<NotifyTemplate>>('/system/notify-template/page', params)
}

/** 查询站内信模板详情 */
export function getNotifyTemplate(id: number) {
  return http.get<NotifyTemplate>(`/system/notify-template/get`, { id })
}

/** 新增站内信模板 */
export function createNotifyTemplate(data: NotifyTemplate) {
  return http.post<number>('/system/notify-template/create', data)
}

/** 修改站内信模板 */
export function updateNotifyTemplate(data: NotifyTemplate) {
  return http.put<boolean>('/system/notify-template/update', data)
}

/** 删除站内信模板 */
export function deleteNotifyTemplate(id: number) {
  return http.delete<boolean>(`/system/notify-template/delete`, { id })
}

/** 发送站内信 */
export function sendNotify(data: NotifySendReqVO) {
  return http.post<number>('/system/notify-template/send-notify', data)
}
