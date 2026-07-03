import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT 设备分组信息 */
export interface DeviceGroup {
  id?: number
  name: string
  status: number
  description?: string
  deviceCount?: number
  createTime?: Date
}

/** 获取设备分组分页列表 */
export function getDeviceGroupPage(params: PageParam) {
  return http.get<PageResult<DeviceGroup>>('/iot/device-group/page', params)
}

/** 获取设备分组详情 */
export function getDeviceGroup(id: number) {
  return http.get<DeviceGroup>(`/iot/device-group/get?id=${id}`)
}

/** 创建设备分组 */
export function createDeviceGroup(data: DeviceGroup) {
  return http.post<number>('/iot/device-group/create', data)
}

/** 更新设备分组 */
export function updateDeviceGroup(data: DeviceGroup) {
  return http.put<boolean>('/iot/device-group/update', data)
}

/** 删除设备分组 */
export function deleteDeviceGroup(id: number) {
  return http.delete<boolean>(`/iot/device-group/delete?id=${id}`)
}

/** 获取设备分组精简列表 */
export function getSimpleDeviceGroupList() {
  return http.get<DeviceGroup[]>('/iot/device-group/simple-list')
}
