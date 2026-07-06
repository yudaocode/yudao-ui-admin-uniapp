import type { PageParam, PageResult } from '@/http/types'
import type { Business } from '@/api/crm/business'
import { http } from '@/http/http'

export interface CrmStatisticFunnelResp {
  customerCount: number
  businessCount: number
  businessWinCount: number
}

export interface CrmStatisticsBusinessSummaryByDateResp {
  time: string
  businessCreateCount: number
  totalPrice: number | string
}

export interface CrmStatisticsBusinessInversionRateSummaryByDateResp {
  time: string
  businessCount: number
  businessWinCount: number
}

export interface CrmStatisticsBusinessSummaryByStatusResp {
  statusId: number
  statusName: string
  statusPercent: number
  sort: number
  businessCount: number
  totalPrice: number | string
}

/** 获取销售漏斗统计数据 */
export function getFunnelSummary(params: Record<string, any>) {
  return http.get<CrmStatisticFunnelResp>('/crm/statistics-funnel/get-funnel-summary', params)
}

/** 获取商机结束状态统计 */
export function getBusinessSummaryByEndStatus(params: Record<string, any>) {
  return http.get<Record<string, any>[]>('/crm/statistics-funnel/get-business-summary-by-end-status', params)
}

/** 获取商机阶段统计 */
export function getBusinessSummaryByStatus(params: Record<string, any>) {
  return http.get<CrmStatisticsBusinessSummaryByStatusResp[]>('/crm/statistics-funnel/get-business-summary-by-status', params)
}

/** 获取新增商机分析，按日期 */
export function getBusinessSummaryByDate(params: Record<string, any>) {
  return http.get<CrmStatisticsBusinessSummaryByDateResp[]>('/crm/statistics-funnel/get-business-summary-by-date', params)
}

/** 获取商机转化率分析，按日期 */
export function getBusinessInversionRateSummaryByDate(params: Record<string, any>) {
  return http.get<CrmStatisticsBusinessInversionRateSummaryByDateResp[]>('/crm/statistics-funnel/get-business-inversion-rate-summary-by-date', params)
}

/** 获取商机列表，按日期 */
export function getBusinessPageByDate(params: PageParam) {
  return http.get<PageResult<Business>>('/crm/statistics-funnel/get-business-page-by-date', params)
}
