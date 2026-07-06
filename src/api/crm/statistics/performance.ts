import { http } from '@/http/http'

export interface StatisticsPerformanceResp {
  time: string
  currentMonthCount: number
  lastMonthCount: number
  lastYearCount: number
}

export interface StatisticsPerformanceSummaryResp {
  time: string
  contractCount: number
  contractPrice: number
  receivablePrice: number
  unreceivedPrice: number
}

/** 员工获得合同金额统计 */
export function getContractPricePerformance(params: Record<string, any>) {
  return http.get<StatisticsPerformanceResp[]>('/crm/statistics-performance/get-contract-price-performance', params)
}

/** 员工获得回款统计 */
export function getReceivablePricePerformance(params: Record<string, any>) {
  return http.get<StatisticsPerformanceResp[]>('/crm/statistics-performance/get-receivable-price-performance', params)
}

/** 员工获得签约合同数量统计 */
export function getContractCountPerformance(params: Record<string, any>) {
  return http.get<StatisticsPerformanceResp[]>('/crm/statistics-performance/get-contract-count-performance', params)
}

/** 获得合同汇总表 */
export function getContractSummary(params: Record<string, any>) {
  return http.get<StatisticsPerformanceSummaryResp[]>('/crm/statistics-performance/get-contract-summary', params)
}
