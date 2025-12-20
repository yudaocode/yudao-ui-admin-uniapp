import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 短信日志信息 */
export interface SmsLog {
  id?: number
  channelId?: number
  channelCode: string
  templateId?: number
  templateCode: string
  templateType?: number
  templateContent: string
  templateParams?: Record<string, any>
  apiTemplateId: string
  mobile: string
  userId?: number
  userType?: number
  sendStatus?: number
  sendTime?: string
  apiSendCode?: string
  apiSendMsg?: string
  apiRequestId?: string
  apiSerialNo?: string
  receiveStatus?: number
  receiveTime?: string
  apiReceiveCode?: string
  apiReceiveMsg?: string
  createTime?: string
}

/** 获取短信日志分页列表 */
export function getSmsLogPage(params: PageParam) {
  return http.get<PageResult<SmsLog>>('/system/sms-log/page', params)
}

/** 获取短信日志详情 */
export function getSmsLog(id: number) {
  return http.get<SmsLog>(`/system/sms-log/get?id=${id}`)
}
