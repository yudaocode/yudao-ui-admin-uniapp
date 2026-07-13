import { http } from '@/http/http'

/** IM 统计概览 */
export interface ImStatisticsOverviewVO {
  totalUser: number
  newUserToday: number
  totalGroup: number
  newGroupToday: number
  activeUserDaily: number
  activeUserWeekly: number
  activeUserMonthly: number
  privateMessageToday: number
  groupMessageToday: number
  privateMessageYesterday: number
  groupMessageYesterday: number
}

/** IM 趋势数据 */
export interface ImStatisticsTrendVO {
  dates: string[]
  series: Record<string, number[]>
}

/** IM 消息类型分布 */
export interface ImStatisticsMessageTypeVO {
  type: number
  value: number
}

/** IM 群规模分布 */
export interface ImStatisticsGroupSizeVO {
  range: string
  count: number
}

/** IM 消息发送 TOP 用户 */
export interface ImStatisticsTopSenderVO {
  userId: number
  nickname: string
  messageCount: number
}

/** 获取 KPI 概览 */
export function getStatisticsOverview() {
  return http.get<ImStatisticsOverviewVO>('/im/manager/statistics/overview')
}

/** 获取消息趋势 */
export function getMessageTrend(days: number) {
  return http.get<ImStatisticsTrendVO>('/im/manager/statistics/message-trend', { days })
}

/** 获取用户趋势 */
export function getUserTrend(days: number) {
  return http.get<ImStatisticsTrendVO>('/im/manager/statistics/user-trend', { days })
}

/** 获取消息类型分布 */
export function getMessageTypeDistribution() {
  return http.get<ImStatisticsMessageTypeVO[]>('/im/manager/statistics/message-type-distribution')
}

/** 获取群规模分布 */
export function getGroupSizeDistribution() {
  return http.get<ImStatisticsGroupSizeVO[]>('/im/manager/statistics/group-size-distribution')
}

/** 获取消息 TOP 发送者 */
export function getTopSenders() {
  return http.get<ImStatisticsTopSenderVO[]>('/im/manager/statistics/top-senders')
}
