import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** API 错误日志信息 */
export interface ApiErrorLog {
  id: number
  traceId: string
  userId: number
  userType: number
  applicationName: string
  requestMethod: string
  requestParams: string
  requestUrl: string
  userIp: string
  userAgent: string
  exceptionTime: Date
  exceptionName: string
  exceptionMessage: string
  exceptionRootCauseMessage: string
  exceptionStackTrace: string
  exceptionClassName: string
  exceptionFileName: string
  exceptionMethodName: string
  exceptionLineNumber: number
  processUserId: number
  processStatus: number
  processTime: Date
  resultCode: number
  createTime: Date
}

/** 获取 API 错误日志分页列表 */
export function getApiErrorLogPage(params: PageParam) {
  return http.get<PageResult<ApiErrorLog>>('/infra/api-error-log/page', params)
}

/** 获取 API 错误日志详情 */
export function getApiErrorLog(id: number) {
  return http.get<ApiErrorLog>(`/infra/api-error-log/get?id=${id}`)
}

/** 更新 API 错误日志的处理状态 */
export function updateApiErrorLogStatus(id: number, processStatus: number) {
  return http.put<boolean>(`/infra/api-error-log/update-status?id=${id}&processStatus=${processStatus}`)
}
