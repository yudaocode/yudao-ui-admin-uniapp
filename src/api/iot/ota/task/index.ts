import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT OTA 任务信息 */
export interface OtaTask {
  id?: number
  name: string
  description?: string
  firmwareId?: number
  firmwareName?: string
  firmwareVersion?: string
  productId?: number
  productName?: string
  status?: number
  deviceScope?: number
  deviceIds?: number[]
  deviceTotalCount?: number
  deviceSuccessCount?: number
  createTime?: Date
}

/** 获取 OTA 升级任务分页列表 */
export function getOtaTaskPage(params: PageParam) {
  return http.get<PageResult<OtaTask>>('/iot/ota/task/page', params)
}

/** 获取 OTA 升级任务详情 */
export function getOtaTask(id: number) {
  return http.get<OtaTask>(`/iot/ota/task/get?id=${id}`)
}

/** 创建 OTA 升级任务 */
export function createOtaTask(data: OtaTask) {
  return http.post<number>('/iot/ota/task/create', data)
}

/** 取消 OTA 升级任务 */
export function cancelOtaTask(id: number) {
  return http.post<boolean>(`/iot/ota/task/cancel?id=${id}`)
}
