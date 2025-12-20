import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface LoginLog {
  id?: number
  traceId?: string
  userId?: number
  userType?: number
  logType?: number
  username?: string
  userIp?: string
  userAgent?: string
  result?: number
  createTime?: Date
}

export function getLoginLogPage(params: PageParam) {
  return http.get<PageResult<LoginLog>>('/system/login-log/page', params)
}

export function getLoginLog(id: number) {
  return http.get<LoginLog>(`/system/login-log/get?id=${id}`)
}
