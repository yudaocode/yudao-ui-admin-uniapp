import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT OTA 固件信息 */
export interface OtaFirmware {
  id?: number
  name?: string
  description?: string
  version?: string
  productId?: number
  productName?: string
  fileUrl?: string
  fileSize?: number
  fileDigestAlgorithm?: string
  fileDigestValue?: string
  createTime?: Date
  updateTime?: Date
}

/** 获取 OTA 固件分页列表 */
export function getOtaFirmwarePage(params: PageParam) {
  return http.get<PageResult<OtaFirmware>>('/iot/ota/firmware/page', params)
}

/** 获取 OTA 固件详情 */
export function getOtaFirmware(id: number) {
  return http.get<OtaFirmware>(`/iot/ota/firmware/get?id=${id}`)
}

/** 创建 OTA 固件 */
export function createOtaFirmware(data: OtaFirmware) {
  return http.post<number>('/iot/ota/firmware/create', data)
}

/** 更新 OTA 固件 */
export function updateOtaFirmware(data: OtaFirmware) {
  return http.put<boolean>('/iot/ota/firmware/update', data)
}

/** 删除 OTA 固件 */
export function deleteOtaFirmware(id: number) {
  return http.delete<boolean>(`/iot/ota/firmware/delete?id=${id}`)
}
