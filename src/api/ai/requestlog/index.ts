import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 请求日志 */
export interface AiRequestLog {
  id: number
  requestId: string
  userId?: number
  userNickname?: string | null // 用户昵称，用户不存在时为空
  bizType: number
  bizId?: number
  platform?: string
  modelId?: number
  model?: string
  status: number
  errorMessage?: string
  beginTime: number
  endTime?: number | null
  duration?: number | null
  inputTokens?: number | null // 未知为空
  outputTokens?: number | null // 未知为空
  totalTokens?: number | null // 未知为空
  responseMetadata?: Record<string, any> | null
  createTime: number
}

/** AI 请求日志统计 */
export interface AiRequestLogStatistics {
  requestCount: number
  successCount: number
  failCount: number
  cancelCount: number
  inputTokens?: number | null // 已知输入合计，无已知值为空
  outputTokens?: number | null // 已知输出合计，无已知值为空
  totalTokens?: number | null // 完整用量记录合计，无完整记录为空
  knownUsageCount: number
  unknownUsageCount: number
}

/** 获取请求日志分页 */
export function getRequestLogPage(params: PageParam) {
  return http.get<PageResult<AiRequestLog>>('/ai/request-log/page', params)
}

/** 获取请求日志详情 */
export function getRequestLog(id: number) {
  return http.get<AiRequestLog>(`/ai/request-log/get?id=${id}`)
}

/** 获取请求日志统计（统计全部匹配记录，不受分页影响） */
export function getRequestLogStatistics(params: Record<string, any>) {
  return http.get<AiRequestLogStatistics>('/ai/request-log/statistics', params)
}
