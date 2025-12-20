import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 登录日志信息 */
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

/** 获取登录日志分页列表 */
export function getLoginLogPage(params: PageParam) {
  return http.get<PageResult<LoginLog>>('/system/login-log/page', params)
}

/** 获取登录日志详情 */
export function getLoginLog(id: number) {
  return http.get<LoginLog>(`/system/login-log/get?id=${id}`)
}
