<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="目的名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入目的名称" clearable />
          </wd-form-item>
          <wd-form-item title="目的类型" title-width="200rpx" center prop="type">
            <wd-radio-group v-model="formData.type" type="button" @change="handleTypeChange">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.IOT_DATA_SINK_TYPE_ENUM)"
                :key="dict.value"
                :name="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="目的状态" title-width="200rpx" center prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :name="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="目的描述" title-width="200rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入目的描述" :maxlength="200" show-word-limit />
          </wd-form-item>
        </wd-cell-group>

        <wd-cell-group class="mt-24rpx" border>
          <template v-if="formData.type === IotDataSinkTypeEnum.HTTP">
            <wd-form-item title="请求地址" title-width="200rpx">
              <wd-input v-model="config.url" placeholder="请输入请求地址" clearable />
            </wd-form-item>
            <wd-form-item title="请求方法" title-width="200rpx" center>
              <wd-radio-group v-model="config.method" type="button">
                <wd-radio
                  v-for="item in requestMethodOptions"
                  :key="item.value"
                  :name="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <view class="border-t border-[#f2f3f5] px-24rpx py-20rpx">
              <view class="mb-16rpx flex items-center justify-between">
                <text class="text-28rpx text-[#333]">请求头</text>
                <wd-button size="small" type="primary" variant="plain" @click="addHttpHeader">
                  新增
                </wd-button>
              </view>
              <view v-if="httpHeaderRows.length === 0" class="rounded-8rpx bg-[#f7f8fa] px-20rpx py-16rpx text-26rpx text-[#999]">
                暂无请求头
              </view>
              <view
                v-for="(item, index) in httpHeaderRows"
                :key="`header-${index}`"
                class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx"
              >
                <wd-input v-model="item.key" class="mb-12rpx" placeholder="请输入请求头名称" clearable />
                <view class="flex items-center gap-12rpx">
                  <wd-input v-model="item.value" class="min-w-0 flex-1" placeholder="请输入请求头值" clearable />
                  <wd-button size="small" type="danger" variant="plain" @click="removeHttpHeader(index)">
                    删除
                  </wd-button>
                </view>
              </view>
            </view>
            <view class="border-t border-[#f2f3f5] px-24rpx py-20rpx">
              <view class="mb-16rpx flex items-center justify-between">
                <text class="text-28rpx text-[#333]">请求参数</text>
                <wd-button size="small" type="primary" variant="plain" @click="addHttpQuery">
                  新增
                </wd-button>
              </view>
              <view v-if="httpQueryRows.length === 0" class="rounded-8rpx bg-[#f7f8fa] px-20rpx py-16rpx text-26rpx text-[#999]">
                暂无请求参数
              </view>
              <view
                v-for="(item, index) in httpQueryRows"
                :key="`query-${index}`"
                class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx"
              >
                <wd-input v-model="item.key" class="mb-12rpx" placeholder="请输入参数名称" clearable />
                <view class="flex items-center gap-12rpx">
                  <wd-input v-model="item.value" class="min-w-0 flex-1" placeholder="请输入参数值" clearable />
                  <wd-button size="small" type="danger" variant="plain" @click="removeHttpQuery(index)">
                    删除
                  </wd-button>
                </view>
              </view>
            </view>
            <wd-form-item title="请求体" title-width="200rpx">
              <wd-textarea v-model="config.body" placeholder="请输入请求体" :maxlength="4000" show-word-limit />
            </wd-form-item>
          </template>

          <template v-else-if="formData.type === IotDataSinkTypeEnum.TCP">
            <wd-form-item title="服务器地址" title-width="220rpx">
              <wd-input v-model="config.host" placeholder="请输入 TCP 服务器地址" clearable />
            </wd-form-item>
            <wd-form-item title="端口" title-width="220rpx" center>
              <wd-input-number v-model="config.port" :min="1" :max="65535" />
            </wd-form-item>
            <wd-form-item title="连接超时" title-width="220rpx" center>
              <wd-input-number v-model="config.connectTimeoutMs" :min="1000" :step="1000" />
            </wd-form-item>
            <wd-form-item title="读取超时" title-width="220rpx" center>
              <wd-input-number v-model="config.readTimeoutMs" :min="1000" :step="1000" />
            </wd-form-item>
            <wd-form-item title="启用 SSL" title-width="220rpx" center>
              <wd-switch v-model="config.ssl" />
            </wd-form-item>
            <wd-form-item v-if="config.ssl" title="SSL 证书" title-width="220rpx">
              <wd-input v-model="config.sslCertPath" placeholder="请输入 SSL 证书路径" clearable />
            </wd-form-item>
            <wd-form-item title="数据格式" title-width="220rpx" center>
              <wd-radio-group v-model="config.dataFormat" type="button">
                <wd-radio
                  v-for="item in dataFormatOptions"
                  :key="item.value"
                  :name="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item title="心跳间隔" title-width="220rpx" center>
              <wd-input-number v-model="config.heartbeatIntervalMs" :min="0" :step="1000" />
            </wd-form-item>
            <wd-form-item title="重连间隔" title-width="220rpx" center>
              <wd-input-number v-model="config.reconnectIntervalMs" :min="1000" :step="1000" />
            </wd-form-item>
            <wd-form-item title="最大重连" title-width="220rpx" center>
              <wd-input-number v-model="config.maxReconnectAttempts" :min="0" />
            </wd-form-item>
          </template>

          <template v-else-if="formData.type === IotDataSinkTypeEnum.WEBSOCKET">
            <wd-form-item title="服务器地址" title-width="220rpx">
              <wd-input v-model="config.serverUrl" placeholder="请输入 WebSocket 地址" clearable />
            </wd-form-item>
            <wd-form-item title="连接超时" title-width="220rpx" center>
              <wd-input-number v-model="config.connectTimeoutMs" :min="1000" :step="1000" />
            </wd-form-item>
            <wd-form-item title="发送超时" title-width="220rpx" center>
              <wd-input-number v-model="config.sendTimeoutMs" :min="1000" :step="1000" />
            </wd-form-item>
            <wd-form-item title="心跳间隔" title-width="220rpx" center>
              <wd-input-number v-model="config.heartbeatIntervalMs" :min="0" :step="1000" />
            </wd-form-item>
            <wd-form-item title="心跳消息" title-width="220rpx">
              <wd-input v-model="config.heartbeatMessage" placeholder="请输入心跳消息" clearable />
            </wd-form-item>
            <wd-form-item title="子协议" title-width="220rpx">
              <wd-input v-model="config.subprotocols" placeholder="多个子协议用逗号分隔" clearable />
            </wd-form-item>
            <wd-form-item title="请求头" title-width="220rpx">
              <wd-textarea v-model="config.customHeaders" placeholder="请输入自定义请求头 JSON" :maxlength="3000" show-word-limit />
            </wd-form-item>
            <wd-form-item title="验证 SSL" title-width="220rpx" center>
              <wd-switch v-model="config.verifySslCert" />
            </wd-form-item>
            <wd-form-item title="数据格式" title-width="220rpx" center>
              <wd-radio-group v-model="config.dataFormat" type="button">
                <wd-radio
                  v-for="item in webSocketDataFormatOptions"
                  :key="item.value"
                  :name="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item title="重连间隔" title-width="220rpx" center>
              <wd-input-number v-model="config.reconnectIntervalMs" :min="1000" :step="1000" />
            </wd-form-item>
            <wd-form-item title="最大重连" title-width="220rpx" center>
              <wd-input-number v-model="config.maxReconnectAttempts" :min="0" />
            </wd-form-item>
            <wd-form-item title="启用压缩" title-width="220rpx" center>
              <wd-switch v-model="config.enableCompression" />
            </wd-form-item>
            <wd-form-item title="重试次数" title-width="220rpx" center>
              <wd-input-number v-model="config.sendRetryCount" :min="0" />
            </wd-form-item>
            <wd-form-item title="重试间隔" title-width="220rpx" center>
              <wd-input-number v-model="config.sendRetryIntervalMs" :min="100" :step="500" />
            </wd-form-item>
          </template>

          <template v-else-if="formData.type === IotDataSinkTypeEnum.MQTT">
            <wd-form-item title="服务地址" title-width="200rpx">
              <wd-input v-model="config.url" placeholder="例如 mqtt://localhost:1883" clearable />
            </wd-form-item>
            <wd-form-item title="用户名" title-width="200rpx">
              <wd-input v-model="config.username" placeholder="请输入用户名" clearable />
            </wd-form-item>
            <wd-form-item title="密码" title-width="200rpx">
              <wd-input v-model="config.password" placeholder="请输入密码" show-password clearable />
            </wd-form-item>
            <wd-form-item title="客户端 ID" title-width="200rpx">
              <wd-input v-model="config.clientId" placeholder="请输入客户端 ID" clearable />
            </wd-form-item>
            <wd-form-item title="主题" title-width="200rpx">
              <wd-input v-model="config.topic" placeholder="请输入主题" clearable />
            </wd-form-item>
          </template>

          <template v-else-if="formData.type === IotDataSinkTypeEnum.DATABASE">
            <wd-form-item title="JDBC 地址" title-width="200rpx">
              <wd-input v-model="config.jdbcUrl" placeholder="请输入 JDBC 连接地址" clearable />
            </wd-form-item>
            <wd-form-item title="用户名" title-width="200rpx">
              <wd-input v-model="config.username" placeholder="请输入数据库用户名" clearable />
            </wd-form-item>
            <wd-form-item title="密码" title-width="200rpx">
              <wd-input v-model="config.password" placeholder="请输入数据库密码" show-password clearable />
            </wd-form-item>
            <wd-form-item title="目标表名" title-width="200rpx">
              <wd-input v-model="config.tableName" placeholder="请输入目标表名" clearable />
            </wd-form-item>
          </template>

          <template v-else-if="formData.type === IotDataSinkTypeEnum.ROCKETMQ">
            <wd-form-item title="NameServer" title-width="220rpx">
              <wd-input v-model="config.nameServer" placeholder="请输入 NameServer 地址" clearable />
            </wd-form-item>
            <wd-form-item title="AccessKey" title-width="220rpx">
              <wd-input v-model="config.accessKey" placeholder="请输入 AccessKey" clearable />
            </wd-form-item>
            <wd-form-item title="SecretKey" title-width="220rpx">
              <wd-input v-model="config.secretKey" placeholder="请输入 SecretKey" show-password clearable />
            </wd-form-item>
            <wd-form-item title="消费组" title-width="220rpx">
              <wd-input v-model="config.group" placeholder="请输入消费组" clearable />
            </wd-form-item>
            <wd-form-item title="主题" title-width="220rpx">
              <wd-input v-model="config.topic" placeholder="请输入主题" clearable />
            </wd-form-item>
            <wd-form-item title="标签" title-width="220rpx">
              <wd-input v-model="config.tags" placeholder="请输入标签" clearable />
            </wd-form-item>
          </template>

          <template v-else-if="formData.type === IotDataSinkTypeEnum.KAFKA">
            <wd-form-item title="服务地址" title-width="200rpx">
              <wd-input v-model="config.bootstrapServers" placeholder="例如 localhost:9092" clearable />
            </wd-form-item>
            <wd-form-item title="用户名" title-width="200rpx">
              <wd-input v-model="config.username" placeholder="请输入用户名" clearable />
            </wd-form-item>
            <wd-form-item title="密码" title-width="200rpx">
              <wd-input v-model="config.password" placeholder="请输入密码" show-password clearable />
            </wd-form-item>
            <wd-form-item title="启用 SSL" title-width="200rpx" center>
              <wd-switch v-model="config.ssl" />
            </wd-form-item>
            <wd-form-item title="主题" title-width="200rpx">
              <wd-input v-model="config.topic" placeholder="请输入主题" clearable />
            </wd-form-item>
          </template>

          <template v-else-if="formData.type === IotDataSinkTypeEnum.RABBITMQ">
            <wd-form-item title="主机地址" title-width="200rpx">
              <wd-input v-model="config.host" placeholder="请输入主机地址" clearable />
            </wd-form-item>
            <wd-form-item title="端口" title-width="200rpx" center>
              <wd-input-number v-model="config.port" :min="1" :max="65535" />
            </wd-form-item>
            <wd-form-item title="虚拟主机" title-width="200rpx">
              <wd-input v-model="config.virtualHost" placeholder="请输入虚拟主机" clearable />
            </wd-form-item>
            <wd-form-item title="用户名" title-width="200rpx">
              <wd-input v-model="config.username" placeholder="请输入用户名" clearable />
            </wd-form-item>
            <wd-form-item title="密码" title-width="200rpx">
              <wd-input v-model="config.password" placeholder="请输入密码" show-password clearable />
            </wd-form-item>
            <wd-form-item title="交换机" title-width="200rpx">
              <wd-input v-model="config.exchange" placeholder="请输入交换机" clearable />
            </wd-form-item>
            <wd-form-item title="路由键" title-width="200rpx">
              <wd-input v-model="config.routingKey" placeholder="请输入路由键" clearable />
            </wd-form-item>
            <wd-form-item title="队列" title-width="200rpx">
              <wd-input v-model="config.queue" placeholder="请输入队列" clearable />
            </wd-form-item>
          </template>

          <template v-else-if="formData.type === IotDataSinkTypeEnum.REDIS_STREAM">
            <wd-form-item title="主机地址" title-width="200rpx">
              <wd-input v-model="config.host" placeholder="请输入主机地址" clearable />
            </wd-form-item>
            <wd-form-item title="端口" title-width="200rpx" center>
              <wd-input-number v-model="config.port" :min="1" :max="65535" />
            </wd-form-item>
            <wd-form-item title="密码" title-width="200rpx">
              <wd-input v-model="config.password" placeholder="请输入密码" show-password clearable />
            </wd-form-item>
            <wd-form-item title="数据库" title-width="200rpx" center>
              <wd-input-number v-model="config.database" :min="0" :max="15" />
            </wd-form-item>
            <wd-form-item title="主题" title-width="200rpx">
              <wd-input v-model="config.topic" placeholder="请输入主题" clearable />
            </wd-form-item>
          </template>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DataSink, DataSinkConfig } from '@/api/iot/rule/data/sink'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createDataSink, getDataSink, IotDataSinkTypeEnum, updateDataSink } from '@/api/iot/rule/data/sink'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

interface KeyValueRow {
  key: string
  value: string
}

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑数据目的' : '新增数据目的')
const formLoading = ref(false) // 表单提交状态
const formData = ref<DataSink>({
  id: undefined,
  name: '',
  description: '',
  status: CommonStatusEnum.ENABLE,
  type: IotDataSinkTypeEnum.HTTP,
  config: createDefaultConfig(IotDataSinkTypeEnum.HTTP),
}) // 表单数据
const httpHeaderRows = ref<KeyValueRow[]>([]) // HTTP 请求头
const httpQueryRows = ref<KeyValueRow[]>([]) // HTTP 请求参数
const formSchema = createFormSchema({
  name: [{ required: true, message: '目的名称不能为空' }],
  type: [{ required: true, message: '目的类型不能为空' }],
  status: [{ required: true, message: '目的状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const requestMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
]
const dataFormatOptions = [
  { label: 'JSON', value: 'JSON' },
  { label: 'BINARY', value: 'BINARY' },
]
const webSocketDataFormatOptions = [
  { label: 'JSON', value: 'JSON' },
  { label: 'TEXT', value: 'TEXT' },
]
const config = computed<DataSinkConfig>(() => formData.value.config || createDefaultConfig(formData.value.type)) // 目的配置

/** 创建默认配置 */
function createDefaultConfig(type: number = IotDataSinkTypeEnum.HTTP): DataSinkConfig {
  const base = { type: String(type) }
  switch (type) {
    case IotDataSinkTypeEnum.TCP:
      return { ...base, host: '', port: 8080, connectTimeoutMs: 5000, readTimeoutMs: 10000, ssl: false, sslCertPath: '', dataFormat: 'JSON', heartbeatIntervalMs: 30000, reconnectIntervalMs: 5000, maxReconnectAttempts: 3 }
    case IotDataSinkTypeEnum.WEBSOCKET:
      return { ...base, serverUrl: '', connectTimeoutMs: 5000, sendTimeoutMs: 10000, heartbeatIntervalMs: 30000, heartbeatMessage: '{"type":"heartbeat"}', subprotocols: '', customHeaders: '', verifySslCert: true, dataFormat: 'JSON', reconnectIntervalMs: 5000, maxReconnectAttempts: 3, enableCompression: false, sendRetryCount: 1, sendRetryIntervalMs: 1000 }
    case IotDataSinkTypeEnum.MQTT:
      return { ...base, url: '', username: '', password: '', clientId: '', topic: '' }
    case IotDataSinkTypeEnum.DATABASE:
      return { ...base, jdbcUrl: '', username: '', password: '', tableName: 'iot_device_message_sink' }
    case IotDataSinkTypeEnum.REDIS_STREAM:
      return { ...base, host: '', port: 6379, password: '', database: 0, topic: '' }
    case IotDataSinkTypeEnum.ROCKETMQ:
      return { ...base, nameServer: '', accessKey: '', secretKey: '', group: '', topic: '', tags: '' }
    case IotDataSinkTypeEnum.RABBITMQ:
      return { ...base, host: '', port: 5672, virtualHost: '/', username: '', password: '', exchange: '', routingKey: '', queue: '' }
    case IotDataSinkTypeEnum.KAFKA:
      return { ...base, bootstrapServers: '', username: '', password: '', ssl: false, topic: '' }
    case IotDataSinkTypeEnum.HTTP:
    default:
      return { ...base, url: '', method: 'POST', headers: {}, query: {}, body: '' }
  }
}

/** 合并默认配置 */
function normalizeConfig(type?: number, source?: DataSinkConfig) {
  const currentType = type || IotDataSinkTypeEnum.HTTP
  return { ...createDefaultConfig(currentType), ...(source || {}), type: String(currentType) }
}

/** 对象转换为 Key/Value 行 */
function objectToKeyValueRows(data?: unknown): KeyValueRow[] {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    return []
  }
  return Object.entries(data as Record<string, any>).map(([key, value]) => ({
    key,
    value: value === undefined || value === null ? '' : String(value),
  }))
}

/** 同步 HTTP Key/Value 行 */
function syncHttpConfigRows() {
  if (formData.value.type !== IotDataSinkTypeEnum.HTTP) {
    return
  }
  httpHeaderRows.value = objectToKeyValueRows(config.value.headers)
  httpQueryRows.value = objectToKeyValueRows(config.value.query)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/rule/data/sink/index')
}

/** 加载数据目的详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDataSink(Number(props.id))
  formData.value.type = formData.value.type || IotDataSinkTypeEnum.HTTP
  formData.value.config = normalizeConfig(formData.value.type, formData.value.config)
  syncHttpConfigRows()
}

/** 类型变更时重置配置 */
function handleTypeChange() {
  formData.value.config = createDefaultConfig(formData.value.type)
  syncHttpConfigRows()
}

/** 新增 HTTP 请求头 */
function addHttpHeader() {
  httpHeaderRows.value.push({ key: '', value: '' })
}

/** 删除 HTTP 请求头 */
function removeHttpHeader(index: number) {
  httpHeaderRows.value.splice(index, 1)
}

/** 新增 HTTP 请求参数 */
function addHttpQuery() {
  httpQueryRows.value.push({ key: '', value: '' })
}

/** 删除 HTTP 请求参数 */
function removeHttpQuery(index: number) {
  httpQueryRows.value.splice(index, 1)
}

/** 判断字段为空 */
function isBlank(value: unknown) {
  return value === undefined || value === null || value === ''
}

/** 校验必填配置 */
function validateRequired(fields: Array<{ key: string, label: string }>) {
  const missing = fields.find(item => isBlank(config.value[item.key]))
  if (missing) {
    toast.warning(`${missing.label}不能为空`)
    return false
  }
  return true
}

/** 构建 Key/Value 对象 */
function buildKeyValueObject(rows: KeyValueRow[], label: string) {
  const data: Record<string, string> = {}
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const key = String(row.key ?? '').trim()
    const value = String(row.value ?? '')
    if (!key && !value.trim()) {
      continue
    }
    if (!key) {
      toast.warning(`${label}第 ${index + 1} 行名称不能为空`)
      return undefined
    }
    if (data[key] !== undefined) {
      toast.warning(`${label}「${key}」不能重复`)
      return undefined
    }
    data[key] = value
  }
  return data
}

/** 构建提交配置 */
function buildSubmitConfig() {
  switch (formData.value.type) {
    case IotDataSinkTypeEnum.HTTP: {
      if (!validateRequired([{ key: 'url', label: '请求地址' }, { key: 'method', label: '请求方法' }])) {
        return undefined
      }
      const headers = buildKeyValueObject(httpHeaderRows.value, '请求头')
      if (headers === undefined) {
        return undefined
      }
      const query = buildKeyValueObject(httpQueryRows.value, '请求参数')
      if (query === undefined) {
        return undefined
      }
      return { ...config.value, headers, query }
    }
    case IotDataSinkTypeEnum.TCP:
      if (!validateRequired([{ key: 'host', label: '服务器地址' }, { key: 'port', label: '端口' }, { key: 'connectTimeoutMs', label: '连接超时' }, { key: 'readTimeoutMs', label: '读取超时' }, { key: 'dataFormat', label: '数据格式' }])) {
        return undefined
      }
      return { ...config.value }
    case IotDataSinkTypeEnum.WEBSOCKET:
      if (!validateRequired([{ key: 'serverUrl', label: '服务器地址' }, { key: 'connectTimeoutMs', label: '连接超时' }, { key: 'sendTimeoutMs', label: '发送超时' }, { key: 'dataFormat', label: '数据格式' }])) {
        return undefined
      }
      return { ...config.value }
    case IotDataSinkTypeEnum.MQTT:
      if (!validateRequired([{ key: 'url', label: '服务地址' }, { key: 'username', label: '用户名' }, { key: 'password', label: '密码' }, { key: 'clientId', label: '客户端 ID' }, { key: 'topic', label: '主题' }])) {
        return undefined
      }
      return { ...config.value }
    case IotDataSinkTypeEnum.DATABASE:
      if (!validateRequired([{ key: 'jdbcUrl', label: 'JDBC 地址' }, { key: 'tableName', label: '目标表名' }])) {
        return undefined
      }
      return { ...config.value }
    case IotDataSinkTypeEnum.ROCKETMQ:
      if (!validateRequired([{ key: 'nameServer', label: 'NameServer' }, { key: 'accessKey', label: 'AccessKey' }, { key: 'secretKey', label: 'SecretKey' }, { key: 'group', label: '消费组' }, { key: 'topic', label: '主题' }])) {
        return undefined
      }
      return { ...config.value }
    case IotDataSinkTypeEnum.KAFKA:
      if (!validateRequired([{ key: 'bootstrapServers', label: '服务地址' }, { key: 'topic', label: '主题' }])) {
        return undefined
      }
      return { ...config.value }
    case IotDataSinkTypeEnum.RABBITMQ:
      if (!validateRequired([{ key: 'host', label: '主机地址' }, { key: 'port', label: '端口' }, { key: 'virtualHost', label: '虚拟主机' }, { key: 'exchange', label: '交换机' }, { key: 'routingKey', label: '路由键' }, { key: 'queue', label: '队列' }])) {
        return undefined
      }
      return { ...config.value }
    case IotDataSinkTypeEnum.REDIS_STREAM:
      if (!validateRequired([{ key: 'host', label: '主机地址' }, { key: 'port', label: '端口' }, { key: 'database', label: '数据库' }, { key: 'topic', label: '主题' }])) {
        return undefined
      }
      return { ...config.value }
    default:
      toast.warning('请选择目的类型')
      return undefined
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  const submitConfig = buildSubmitConfig()
  if (!submitConfig) {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value, config: submitConfig }
    if (props.id) {
      await updateDataSink(data)
      toast.success('修改成功')
    } else {
      await createDataSink(data)
      toast.success('新增成功')
    }
    uni.$emit('iot:data-sink:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
