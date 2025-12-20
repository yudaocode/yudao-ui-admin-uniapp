import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

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
