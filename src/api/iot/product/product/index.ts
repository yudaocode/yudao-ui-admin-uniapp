import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT 产品信息 */
export interface Product {
  id?: number
  name: string
  productKey: string
  productSecret?: string
  registerEnabled?: boolean
  protocolId?: number
  categoryId?: number
  categoryName?: string
  icon?: string
  picUrl?: string
  description?: string
  status?: number
  deviceType?: number
  netType?: number
  protocolType?: string
  serializeType?: string
  deviceCount?: number
  createTime?: Date
}

/** IoT 产品设备类型枚举 */
export enum DeviceTypeEnum {
  DEVICE = 0,
  GATEWAY_SUB = 1,
  GATEWAY = 2,
}

/** IoT 协议类型枚举 */
export enum ProtocolTypeEnum {
  TCP = 'tcp',
  UDP = 'udp',
  WEBSOCKET = 'websocket',
  HTTP = 'http',
  MQTT = 'mqtt',
  EMQX = 'emqx',
  COAP = 'coap',
  MODBUS_TCP_CLIENT = 'modbus_tcp_client',
  MODBUS_TCP_SERVER = 'modbus_tcp_server',
}

/** IoT 序列化类型枚举 */
export enum SerializeTypeEnum {
  JSON = 'json',
  BINARY = 'binary',
}

/** 获取产品分页列表 */
export function getProductPage(params: PageParam) {
  return http.get<PageResult<Product>>('/iot/product/page', params)
}

/** 获取产品详情 */
export function getProduct(id: number) {
  return http.get<Product>(`/iot/product/get?id=${id}`)
}

/** 创建产品 */
export function createProduct(data: Product) {
  return http.post<number>('/iot/product/create', data)
}

/** 更新产品 */
export function updateProduct(data: Product) {
  return http.put<boolean>('/iot/product/update', data)
}

/** 删除产品 */
export function deleteProduct(id: number) {
  return http.delete<boolean>(`/iot/product/delete?id=${id}`)
}

/** 更新产品状态 */
export function updateProductStatus(id: number, status: number) {
  return http.put<boolean>(`/iot/product/update-status?id=${id}&status=${status}`)
}

/** 获取产品精简列表 */
export function getSimpleProductList(deviceType?: number) {
  return http.get<Product[]>('/iot/product/simple-list', { deviceType })
}

/** 根据 ProductKey 获取产品信息 */
export function getProductByKey(productKey: string) {
  return http.get<Product>('/iot/product/get-by-key', { productKey })
}
