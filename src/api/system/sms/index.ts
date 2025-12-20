import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @AI：拆成三个文件：channel.ts、template.ts、log.ts

// ==================== 短信渠道 ====================

/** 短信渠道信息 */
export interface SmsChannel {
  id?: number
  code: string
  status: number
  signature: string
  remark?: string
  apiKey: string
  apiSecret?: string
  callbackUrl?: string
  createTime?: Date
}

/** 获取短信渠道分页列表 */
export function getSmsChannelPage(params: PageParam) {
  return http.get<PageResult<SmsChannel>>('/system/sms-channel/page', params)
}

/** 获取短信渠道精简列表 */
export function getSimpleSmsChannelList() {
  return http.get<SmsChannel[]>('/system/sms-channel/simple-list')
}

/** 获取短信渠道详情 */
export function getSmsChannel(id: number) {
  return http.get<SmsChannel>(`/system/sms-channel/get?id=${id}`)
}

/** 创建短信渠道 */
export function createSmsChannel(data: SmsChannel) {
  return http.post<number>('/system/sms-channel/create', data)
}

/** 更新短信渠道 */
export function updateSmsChannel(data: SmsChannel) {
  return http.put<boolean>('/system/sms-channel/update', data)
}

/** 删除短信渠道 */
export function deleteSmsChannel(id: number) {
  return http.delete<boolean>(`/system/sms-channel/delete?id=${id}`)
}

// ==================== 短信模板 ====================

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

// ==================== 短信日志 ====================

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
