import { http } from '@/http/http'

/** Modbus 连接配置 */
export interface DeviceModbusConfig {
  id?: number
  deviceId: number
  deviceName?: string
  ip: string
  port: number
  slaveId: number
  timeout: number
  retryInterval: number
  mode: number
  frameFormat: number
  status: number
  createTime?: Date
}

/** 获取设备的 Modbus 连接配置 */
export function getModbusConfig(deviceId: number) {
  return http.get<DeviceModbusConfig>('/iot/device-modbus-config/get', { deviceId })
}

/** 保存 Modbus 连接配置 */
export function saveModbusConfig(data: DeviceModbusConfig) {
  return http.post<boolean>('/iot/device-modbus-config/save', data)
}
