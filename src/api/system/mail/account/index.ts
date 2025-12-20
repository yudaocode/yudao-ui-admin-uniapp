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

/** 获取邮箱账号分页列表 */
export function getMailAccountPage(params: PageParam) {
  return http.get<PageResult<MailAccount>>('/system/mail-account/page', params)
}

/** 获取邮箱账号（精简）列表 */
export function getSimpleMailAccountList() {
  return http.get<MailAccount[]>('/system/mail-account/simple-list')
}

/** 获取邮箱账号详情 */
export function getMailAccount(id: number) {
  return http.get<MailAccount>(`/system/mail-account/get?id=${id}`)
}

/** 创建邮箱账号 */
export function createMailAccount(data: MailAccount) {
  return http.post<number>('/system/mail-account/create', data)
}

/** 更新邮箱账号 */
export function updateMailAccount(data: MailAccount) {
  return http.put<boolean>('/system/mail-account/update', data)
}

/** 删除邮箱账号 */
export function deleteMailAccount(id: number) {
  return http.delete<boolean>(`/system/mail-account/delete?id=${id}`)
}
