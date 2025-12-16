import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** API 访问日志信息 */
export interface ApiAccessLog {
  id: number
  traceId: string
  userId: number
  userType: number
  applicationName: string
  requestMethod: string
  requestParams: string
  responseBody: string
  requestUrl: string
  userIp: string
  userAgent: string
  operateModule: string
  operateName: string
  operateType: number
  beginTime: Date
  endTime: Date
  duration: number
  resultCode: number
  resultMsg: string
  createTime: Date
}

/** 获取 API 访问日志分页列表 */
export function getApiAccessLogPage(params: PageParam) {
  return http.get<PageResult<ApiAccessLog>>('/infra/api-access-log/page', params)
}

/** 获取 API 访问日志详情 */
export function getApiAccessLog(id: number) {
  return http.get<ApiAccessLog>(`/infra/api-access-log/get?id=${id}`)
}
