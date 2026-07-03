import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT 告警记录信息 */
export interface AlertRecord {
  id?: number
  configId?: number
  configName?: string
  configLevel?: number
  productId?: number
  productName?: string
  deviceId?: number
  deviceName?: string
  deviceMessage?: any
  processStatus?: boolean
  processRemark?: string
  createTime?: Date
}

/** 获取告警记录分页列表 */
export function getAlertRecordPage(params: PageParam) {
  return http.get<PageResult<AlertRecord>>('/iot/alert-record/page', params)
}

/** 获取告警记录详情 */
export function getAlertRecord(id: number) {
  return http.get<AlertRecord>(`/iot/alert-record/get?id=${id}`)
}

/** 处理告警记录 */
export function processAlertRecord(id: number, processRemark: string) {
  return http.put<boolean>('/iot/alert-record/process', { id, processRemark })
}
