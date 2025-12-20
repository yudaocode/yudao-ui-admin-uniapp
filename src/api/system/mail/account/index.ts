import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 邮箱账号信息 */
export interface MailAccount {
  id?: number
  mail: string
  username: string
  password?: string
  host: string
  port: number
  sslEnable: boolean
  starttlsEnable: boolean
  createTime?: string
}

export function getMailAccountPage(params: PageParam) {
  return http.get<PageResult<MailAccount>>('/system/mail-account/page', params)
}

export function getSimpleMailAccountList() {
  return http.get<MailAccount[]>('/system/mail-account/simple-list')
}

export function getMailAccount(id: number) {
  return http.get<MailAccount>(`/system/mail-account/get?id=${id}`)
}

export function createMailAccount(data: MailAccount) {
  return http.post<number>('/system/mail-account/create', data)
}

export function updateMailAccount(data: MailAccount) {
  return http.put<boolean>('/system/mail-account/update', data)
}

export function deleteMailAccount(id: number) {
  return http.delete<boolean>(`/system/mail-account/delete?id=${id}`)
}
