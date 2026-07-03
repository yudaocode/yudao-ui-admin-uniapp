import { http } from '@/http/http'

/** IoT 统计数据 */
export interface IotStatisticsSummaryResp {
  productCategoryCount: number
  productCount: number
  deviceCount: number
  deviceMessageCount: number
  productCategoryTodayCount: number
  productTodayCount: number
  deviceTodayCount: number
  deviceMessageTodayCount: number
  deviceOnlineCount: number
  deviceOfflineCount: number
  deviceInactiveCount: number
  productCategoryDeviceCounts: Record<string, number>
}

/** IoT 设备消息按时间统计 */
export interface IotStatisticsDeviceMessageSummaryByDateResp {
  time: string
  upstreamCount: number
  downstreamCount: number
}

/** IoT 设备消息统计请求参数 */
export interface IotStatisticsDeviceMessageReq {
  interval: number
  times?: Array<string | Date>
}

/** 查询全局统计 */
export function getStatisticsSummary() {
  return http.get<IotStatisticsSummaryResp>('/iot/statistics/get-summary')
}

/** 获取设备消息统计 */
export function getDeviceMessageSummaryByDate(params: IotStatisticsDeviceMessageReq) {
  return http.get<IotStatisticsDeviceMessageSummaryByDateResp[]>('/iot/statistics/get-device-message-summary-by-date', params)
}
