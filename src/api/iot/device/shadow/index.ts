import type { ThingModelDataSpecs } from '@/api/iot/thingmodel'
import { http } from '@/http/http'

/** IoT 设备影子属性 */
export interface DeviceShadowProperty {
  identifier: string // 属性标识符
  name: string // 属性名称
  dataType: string // 数据类型
  dataSpecs?: ThingModelDataSpecs // 数据定义（数值型、文本型等）
  dataSpecsList?: ThingModelDataSpecs[] // 数据定义列表（枚举型、布尔型等）
  desiredValue?: any // 期望值
  reportedValue?: any // 上报值
  desiredTime?: number // 期望值更新时间（秒级时间戳）
  reportedTime?: number // 上报值更新时间（秒级时间戳）
}

/** IoT 设备影子 */
export interface DeviceShadow {
  version: number // 版本号
  shadowTime: number // 最后更新时间（秒级时间戳）
  status: number // 影子开关状态
  properties: DeviceShadowProperty[] // 属性对比列表
  desired: Record<string, any> // 期望状态
  reported: Record<string, any> // 上报状态
  metadata: Record<string, any> // 元数据
}

/** IoT 设备影子期望状态更新请求 */
export interface DeviceShadowUpdateDesiredReq {
  deviceId: number // 设备编号
  desired: Record<string, any> // 期望状态
}

/** IoT 设备影子开关更新请求 */
export interface DeviceShadowUpdateStatusReq {
  deviceId: number // 设备编号
  status: number // 影子开关状态
}

/** 获取设备影子 */
export function getDeviceShadow(deviceId: number) {
  return http.get<DeviceShadow>(`/iot/device/shadow/get?deviceId=${deviceId}`)
}

/** 更新设备影子期望状态 */
export function updateDeviceShadowDesired(data: DeviceShadowUpdateDesiredReq) {
  return http.put<boolean>('/iot/device/shadow/update-desired', data)
}

/** 更新设备影子开关 */
export function updateDeviceShadowStatus(data: DeviceShadowUpdateStatusReq) {
  return http.put<boolean>('/iot/device/shadow/update-status', data)
}

/** 重置设备影子 */
export function resetDeviceShadow(deviceId: number) {
  return http.delete<boolean>(`/iot/device/shadow/reset?deviceId=${deviceId}`)
}
