import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 邮件模板信息 */
export interface MailTemplate {
  id?: number
  name: string
  code: string
  accountId?: number
  nickname?: string
  title: string
  content: string
  status: number
  remark?: string
  params?: string[]
  createTime?: string
}

/** 发送邮件请求 */
export interface MailSendReqVO {
  templateCode: string
  templateParams: Record<string, any>
  toMails: string[]
  ccMails?: string[]
  bccMails?: string[]
}

/** 获取邮件模板分页列表 */
export function getMailTemplatePage(params: PageParam) {
  return http.get<PageResult<MailTemplate>>('/system/mail-template/page', params)
}

/** 获取邮件模板详情 */
export function getMailTemplate(id: number) {
  return http.get<MailTemplate>(`/system/mail-template/get?id=${id}`)
}

/** 创建邮件模板 */
export function createMailTemplate(data: MailTemplate) {
  return http.post<number>('/system/mail-template/create', data)
}

/** 更新邮件模板 */
export function updateMailTemplate(data: MailTemplate) {
  return http.put<boolean>('/system/mail-template/update', data)
}

/** 删除邮件模板 */
export function deleteMailTemplate(id: number) {
  return http.delete<boolean>(`/system/mail-template/delete?id=${id}`)
}

/** 发送邮件 */
export function sendMail(data: MailSendReqVO) {
  return http.post<number>('/system/mail-template/send-mail', data)
}
