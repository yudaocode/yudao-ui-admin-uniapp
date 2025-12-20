import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

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

export interface MailSendReqVO {
  templateCode: string
  templateParams: Record<string, any>
  toMails: string[]
  ccMails?: string[]
  bccMails?: string[]
}

export function getMailTemplatePage(params: PageParam) {
  return http.get<PageResult<MailTemplate>>('/system/mail-template/page', params)
}

export function getMailTemplate(id: number) {
  return http.get<MailTemplate>(`/system/mail-template/get?id=${id}`)
}

export function createMailTemplate(data: MailTemplate) {
  return http.post<number>('/system/mail-template/create', data)
}

export function updateMailTemplate(data: MailTemplate) {
  return http.put<boolean>('/system/mail-template/update', data)
}

export function deleteMailTemplate(id: number) {
  return http.delete<boolean>(`/system/mail-template/delete?id=${id}`)
}

export function sendMail(data: MailSendReqVO) {
  return http.post<number>('/system/mail-template/send-mail', data)
}
