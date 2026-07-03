import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 数据流转目的基础配置 */
interface BaseDataSinkConfig {
  type?: string
}

/** HTTP 配置 */
export interface HttpConfig extends BaseDataSinkConfig {
  url?: string
  method?: string
  headers?: Record<string, string>
  query?: Record<string, string>
  body?: string
}

/** TCP 配置 */
export interface TcpConfig extends BaseDataSinkConfig {
  host?: string
  port?: number
  connectTimeoutMs?: number
  readTimeoutMs?: number
  ssl?: boolean
  sslCertPath?: string
  dataFormat?: string
  heartbeatIntervalMs?: number
  reconnectIntervalMs?: number
  maxReconnectAttempts?: number
}

/** WebSocket 配置 */
export interface WebSocketConfig extends BaseDataSinkConfig {
  serverUrl?: string
  connectTimeoutMs?: number
  sendTimeoutMs?: number
  heartbeatIntervalMs?: number
  heartbeatMessage?: string
  subprotocols?: string
  customHeaders?: string
  verifySslCert?: boolean
  dataFormat?: string
  reconnectIntervalMs?: number
  maxReconnectAttempts?: number
  enableCompression?: boolean
  sendRetryCount?: number
  sendRetryIntervalMs?: number
}

/** MQTT 配置 */
export interface MqttConfig extends BaseDataSinkConfig {
  url?: string
  username?: string
  password?: string
  clientId?: string
  topic?: string
}

/** Database 配置 */
export interface DatabaseConfig extends BaseDataSinkConfig {
  jdbcUrl?: string
  username?: string
  password?: string
  tableName?: string
}

/** RocketMQ 配置 */
export interface RocketMQConfig extends BaseDataSinkConfig {
  nameServer?: string
  accessKey?: string
  secretKey?: string
  group?: string
  topic?: string
  tags?: string
}

/** Kafka 配置 */
export interface KafkaMQConfig extends BaseDataSinkConfig {
  bootstrapServers?: string
  username?: string
  password?: string
  ssl?: boolean
  topic?: string
}

/** RabbitMQ 配置 */
export interface RabbitMQConfig extends BaseDataSinkConfig {
  host?: string
  port?: number
  virtualHost?: string
  username?: string
  password?: string
  exchange?: string
  routingKey?: string
  queue?: string
}

/** Redis Stream 配置 */
export interface RedisStreamMQConfig extends BaseDataSinkConfig {
  host?: string
  port?: number
  password?: string
  database?: number
  dataStructure?: number
  topic?: string
  hashField?: string
  scoreField?: string
}

/** IoT 数据流转目的配置 */
export type DataSinkConfig = Partial<
  HttpConfig
  & TcpConfig
  & WebSocketConfig
  & MqttConfig
  & DatabaseConfig
  & RocketMQConfig
  & KafkaMQConfig
  & RabbitMQConfig
  & RedisStreamMQConfig
>

/** IoT 数据流转目的信息 */
export interface DataSink {
  id?: number
  name?: string
  description?: string
  status?: number
  direction?: number
  type?: number
  config?: DataSinkConfig
  createTime?: Date
}

/** 数据流转目的类型 */
export const IotDataSinkTypeEnum = {
  HTTP: 1,
  TCP: 2,
  WEBSOCKET: 3,
  MQTT: 10,
  DATABASE: 20,
  REDIS_STREAM: 21,
  ROCKETMQ: 30,
  RABBITMQ: 31,
  KAFKA: 32,
} as const

/** 获取数据流转目的分页列表 */
export function getDataSinkPage(params: PageParam) {
  return http.get<PageResult<DataSink>>('/iot/data-sink/page', params)
}

/** 获取数据流转目的详情 */
export function getDataSink(id: number) {
  return http.get<DataSink>(`/iot/data-sink/get?id=${id}`)
}

/** 创建数据流转目的 */
export function createDataSink(data: DataSink) {
  return http.post<number>('/iot/data-sink/create', data)
}

/** 更新数据流转目的 */
export function updateDataSink(data: DataSink) {
  return http.put<boolean>('/iot/data-sink/update', data)
}

/** 删除数据流转目的 */
export function deleteDataSink(id: number) {
  return http.delete<boolean>(`/iot/data-sink/delete?id=${id}`)
}

/** 获取数据流转目的精简列表 */
export function getSimpleDataSinkList() {
  return http.get<DataSink[]>('/iot/data-sink/simple-list')
}
