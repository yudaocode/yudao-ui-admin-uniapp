import { http } from '@/http/http'

/** 业绩目标完成情况 */
export interface CrmStatisticsPerformanceTargetResp {
  month: number
  targetPrice: number
  currentPrice: number
  completionRate: number
}

/** 获得业绩目标完成情况 */
export function getPerformanceTargetSummary(params: Record<string, any>) {
  return http.get<CrmStatisticsPerformanceTargetResp[]>('/crm/statistics-performance-target/get-performance-target-summary', params)
}
