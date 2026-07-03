import type { PageParam, PageResult } from '@/http/types'
import type { ThingModelDataSpecs } from '@/api/iot/thingmodel'
import { http } from '@/http/http'

/** IoT 设备信息 */
export interface Device {
  id?: number
  deviceName: string
  productId?: number
  productName?: string
  productKey?: string
  deviceType?: number
  nickname?: string
  gatewayId?: number
  state?: number
  onlineTime?: string | Date
  offlineTime?: string | Date
  activeTime?: string | Date
  createTime?: Date
  ip?: string
  firmwareVersion?: string
  picUrl?: string
  deviceSecret?: string
  mqttClientId?: string
  mqttUsername?: string
  mqttPassword?: string
  latitude?: number
  longitude?: number
  areaId?: number
  serialNumber?: string
  config?: string
  groupIds?: number[]
}

/** IoT 设备属性详情 */
export interface IotDevicePropertyResp {
  identifier: string
  value: any
  updateTime?: number
}

/** IoT 设备最新属性请求参数 */
export interface IotDevicePropertyLatestReq {
  deviceId: number
}

/** IoT 设备属性历史列表请求参数 */
export interface IotDevicePropertyHistoryListReq extends IotDevicePropertyLatestReq {
  identifier: string
  times?: Array<string | Date>
}

/** IoT 设备属性详情 */
export interface IotDevicePropertyDetailResp extends IotDevicePropertyResp {
  name: string
  dataType: string
  dataSpecs?: ThingModelDataSpecs
  dataSpecsList?: ThingModelDataSpecs[]
}

/** IoT 设备认证参数 */
export interface IotDeviceAuthInfo {
  clientId: string
  username: string
  password: string
}

/** IoT 设备发送消息参数 */
export interface IotDeviceMessageSendReq {
  deviceId: number
  method: string
  params?: any
}

/** IoT 设备消息 */
export interface IotDeviceMessage {
  id?: string
  reportTime?: string | Date
  ts?: string | Date
  deviceId?: number
  serverId?: string
  upstream?: boolean
  reply?: boolean
  identifier?: string
  requestId?: string
  method?: string
  params?: any
  data?: any
  code?: number
  msg?: string
}

/** IoT 设备消息对 */
export interface IotDeviceMessagePair {
  request?: IotDeviceMessage
  reply?: IotDeviceMessage
}

/** 获取设备分页列表 */
export function getDevicePage(params: PageParam) {
  return http.get<PageResult<Device>>('/iot/device/page', params)
}

/** 获取设备详情 */
export function getDevice(id: number) {
  return http.get<Device>(`/iot/device/get?id=${id}`)
}

/** 创建设备 */
export function createDevice(data: Device) {
  return http.post<number>('/iot/device/create', data)
}

/** 更新设备 */
export function updateDevice(data: Device) {
  return http.put<boolean>('/iot/device/update', data)
}

/** 删除设备 */
export function deleteDevice(id: number) {
  return http.delete<boolean>(`/iot/device/delete?id=${id}`)
}

/** 批量删除设备 */
export function deleteDeviceList(ids: number[]) {
  return http.delete<boolean>('/iot/device/delete-list', undefined, { ids: ids.join(',') })
}

/** 获取设备数量 */
export function getDeviceCount(productId: number) {
  return http.get<number>(`/iot/device/count?productId=${productId}`)
}

/** 获取设备精简列表 */
export function getSimpleDeviceList(deviceType?: number, productId?: number) {
  return http.get<Device[]>('/iot/device/simple-list', { deviceType, productId })
}

/** 根据产品编号获取设备精简列表 */
export function getDeviceListByProductId(productId: number) {
  return http.get<Device[]>('/iot/device/simple-list', { productId })
}

/** 获取设备位置列表 */
export function getDeviceLocationList() {
  return http.get<Device[]>('/iot/device/location-list')
}

/** 获取设备属性最新数据 */
export function getLatestDeviceProperties(params: IotDevicePropertyLatestReq) {
  return http.get<IotDevicePropertyDetailResp[]>('/iot/device/property/get-latest', params)
}

/** 获取设备属性历史数据 */
export function getHistoryDevicePropertyList(params: IotDevicePropertyHistoryListReq) {
  return http.get<IotDevicePropertyResp[]>('/iot/device/property/history-list', params)
}

/** 获取设备认证信息 */
export function getDeviceAuthInfo(id: number) {
  return http.get<IotDeviceAuthInfo>('/iot/device/get-auth-info', { id })
}

/** 查询设备消息分页 */
export function getDeviceMessagePage(params: PageParam) {
  return http.get<PageResult<IotDeviceMessage>>('/iot/device/message/page', params)
}

/** 查询设备消息配对分页 */
export function getDeviceMessagePairPage(params: PageParam) {
  return http.get<PageResult<IotDeviceMessagePair>>('/iot/device/message/pair-page', params)
}

/** 发送设备消息 */
export function sendDeviceMessage(params: IotDeviceMessageSendReq) {
  return http.post<boolean>('/iot/device/message/send', params)
}

/** 绑定子设备到网关 */
export function bindDeviceGateway(data: { subIds: number[], gatewayId: number }) {
  return http.put<boolean>('/iot/device/bind-gateway', data)
}

/** 解绑子设备与网关 */
export function unbindDeviceGateway(data: { subIds: number[], gatewayId: number }) {
  return http.put<boolean>('/iot/device/unbind-gateway', data)
}

/** 获取网关子设备列表 */
export function getSubDeviceList(gatewayId: number) {
  return http.get<Device[]>('/iot/device/sub-device-list', { gatewayId })
}

/** 获取未绑定网关的子设备分页 */
export function getUnboundSubDevicePage(params: PageParam) {
  return http.get<PageResult<Device>>('/iot/device/unbound-sub-device-page', params)
}
