import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 邮件日志信息 */
export interface MailLog {
  id?: number
  userId?: number
  userType?: number
  templateId?: number
  templateCode?: string
  templateTitle?: string
  templateContent?: string
  templateParams?: Record<string, any>
  accountId?: number
  fromMail?: string
  toMails?: string[]
  ccMails?: string[]
  bccMails?: string[]
  sendStatus?: number
  sendTime?: string
  sendMessageId?: string
  sendException?: string
  createTime?: string
}

export function getMailLogPage(params: PageParam) {
  return http.get<PageResult<MailLog>>('/system/mail-log/page', params)
}
