import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 短信模板信息 */
export interface SmsTemplate {
  id?: number
  type?: number
  status: number
  code: string
  name: string
  content: string
  remark?: string
  apiTemplateId: string
  channelId?: number
  channelCode?: string
  params?: string[]
  createTime?: Date
}

/** 发送短信请求 */
export interface SmsSendReqVO {
  mobile: string
  templateCode: string
  templateParams: Record<string, any>
}

/** 获取短信模板分页列表 */
export function getSmsTemplatePage(params: PageParam) {
  return http.get<PageResult<SmsTemplate>>('/system/sms-template/page', params)
}

/** 获取短信模板详情 */
export function getSmsTemplate(id: number) {
  return http.get<SmsTemplate>(`/system/sms-template/get?id=${id}`)
}

/** 创建短信模板 */
export function createSmsTemplate(data: SmsTemplate) {
  return http.post<number>('/system/sms-template/create', data)
}

/** 更新短信模板 */
export function updateSmsTemplate(data: SmsTemplate) {
  return http.put<boolean>('/system/sms-template/update', data)
}

/** 删除短信模板 */
export function deleteSmsTemplate(id: number) {
  return http.delete<boolean>(`/system/sms-template/delete?id=${id}`)
}

/** 发送短信 */
export function sendSms(data: SmsSendReqVO) {
  return http.post<number>('/system/sms-template/send-sms', data)
}
