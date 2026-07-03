import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT OTA 任务记录信息 */
export interface OtaTaskRecord {
  id?: number
  firmwareId?: number
  firmwareVersion?: string
  taskId?: number
  deviceId?: number
  deviceName?: string
  currentVersion?: string
  fromFirmwareId?: number
  fromFirmwareVersion?: string
  status?: number
  progress?: number
  description?: string
  updateTime?: Date
  createTime?: Date
}

/** 获取 OTA 任务记录状态统计 */
export function getOtaTaskRecordStatusStatistics(firmwareId?: number, taskId?: number) {
  return http.get<Record<string, number>>('/iot/ota/task/record/get-status-statistics', { firmwareId, taskId })
}

/** 获取 OTA 任务记录分页列表 */
export function getOtaTaskRecordPage(params: PageParam) {
  return http.get<PageResult<OtaTaskRecord>>('/iot/ota/task/record/page', params)
}

/** 取消 OTA 任务记录 */
export function cancelOtaTaskRecord(id: number) {
  return http.put<boolean>(`/iot/ota/task/record/cancel?id=${id}`)
}
