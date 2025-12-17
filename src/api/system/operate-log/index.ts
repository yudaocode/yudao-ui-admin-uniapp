import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 操作日志信息 */
export interface OperateLog {
  id?: number
  traceId?: string
  userId?: number
  userType?: number
  userName?: string
  type?: string
  subType?: string
  bizId?: number
  action?: string
  extra?: string
  requestMethod?: string
  requestUrl?: string
  userIp?: string
  userAgent?: string
  createTime?: Date
}

/** 获取操作日志分页列表 */
export function getOperateLogPage(params: PageParam) {
  return http.get<PageResult<OperateLog>>('/system/operate-log/page', params)
}

/** 获取操作日志详情 */
export function getOperateLog(id: number) {
  return http.get<OperateLog>(`/system/operate-log/get?id=${id}`)
}