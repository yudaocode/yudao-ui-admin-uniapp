import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** Modbus 点位配置 */
export interface DeviceModbusPoint {
  id?: number
  deviceId: number
  thingModelId?: number
  identifier: string
  name: string
  functionCode?: number
  registerAddress?: number
  registerCount?: number
  byteOrder?: string
  rawDataType?: string
  scale?: number
  pollInterval?: number
  status: number
  createTime?: Date
}

/** 获取设备的 Modbus 点位分页 */
export function getModbusPointPage(params: PageParam) {
  return http.get<PageResult<DeviceModbusPoint>>('/iot/device-modbus-point/page', params)
}

/** 获取 Modbus 点位详情 */
export function getModbusPoint(id: number) {
  return http.get<DeviceModbusPoint>(`/iot/device-modbus-point/get?id=${id}`)
}

/** 创建 Modbus 点位配置 */
export function createModbusPoint(data: DeviceModbusPoint) {
  return http.post<number>('/iot/device-modbus-point/create', data)
}

/** 更新 Modbus 点位配置 */
export function updateModbusPoint(data: DeviceModbusPoint) {
  return http.put<boolean>('/iot/device-modbus-point/update', data)
}

/** 删除 Modbus 点位配置 */
export function deleteModbusPoint(id: number) {
  return http.delete<boolean>(`/iot/device-modbus-point/delete?id=${id}`)
}
