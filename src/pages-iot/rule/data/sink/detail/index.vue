<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="数据目的详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 基本信息 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="目的编号" :value="String(formData?.id || '-')" />
        <wd-cell title="目的名称" :value="formData?.name || '-'" />
        <wd-cell title="目的状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="目的类型">
          <dict-tag :type="DICT_TYPE.IOT_DATA_SINK_TYPE_ENUM" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="目的描述" :value="formData?.description || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 配置信息：按目的类型逐字段展示 -->
      <wd-cell-group class="mt-24rpx" border>
        <!-- HTTP -->
        <template v-if="sinkType === IotDataSinkTypeEnum.HTTP">
          <wd-cell title="请求地址" :value="config.url || '-'" />
          <wd-cell title="请求方法" :value="config.method || '-'" />
          <wd-cell title="请求头" :value="formatObject(config.headers)" />
          <wd-cell title="请求参数" :value="formatObject(config.query)" />
          <wd-cell title="请求体" :value="config.body || '-'" />
        </template>

        <!-- TCP -->
        <template v-else-if="sinkType === IotDataSinkTypeEnum.TCP">
          <wd-cell title="服务器地址" :value="config.host || '-'" />
          <wd-cell title="端口" :value="formatValue(config.port)" />
          <wd-cell title="连接超时" :value="formatValue(config.connectTimeoutMs)" />
          <wd-cell title="读取超时" :value="formatValue(config.readTimeoutMs)" />
          <wd-cell title="启用 SSL" :value="formatBool(config.ssl)" />
          <wd-cell v-if="config.ssl" title="SSL 证书" :value="config.sslCertPath || '-'" />
          <wd-cell title="数据格式" :value="config.dataFormat || '-'" />
          <wd-cell title="心跳间隔" :value="formatValue(config.heartbeatIntervalMs)" />
          <wd-cell title="重连间隔" :value="formatValue(config.reconnectIntervalMs)" />
          <wd-cell title="最大重连" :value="formatValue(config.maxReconnectAttempts)" />
        </template>

        <!-- WebSocket -->
        <template v-else-if="sinkType === IotDataSinkTypeEnum.WEBSOCKET">
          <wd-cell title="服务器地址" :value="config.serverUrl || '-'" />
          <wd-cell title="连接超时" :value="formatValue(config.connectTimeoutMs)" />
          <wd-cell title="发送超时" :value="formatValue(config.sendTimeoutMs)" />
          <wd-cell title="心跳间隔" :value="formatValue(config.heartbeatIntervalMs)" />
          <wd-cell title="心跳消息" :value="config.heartbeatMessage || '-'" />
          <wd-cell title="子协议" :value="config.subprotocols || '-'" />
          <wd-cell title="请求头" :value="config.customHeaders || '-'" />
          <wd-cell title="验证 SSL" :value="formatBool(config.verifySslCert)" />
          <wd-cell title="数据格式" :value="config.dataFormat || '-'" />
          <wd-cell title="重连间隔" :value="formatValue(config.reconnectIntervalMs)" />
          <wd-cell title="最大重连" :value="formatValue(config.maxReconnectAttempts)" />
          <wd-cell title="启用压缩" :value="formatBool(config.enableCompression)" />
          <wd-cell title="重试次数" :value="formatValue(config.sendRetryCount)" />
          <wd-cell title="重试间隔" :value="formatValue(config.sendRetryIntervalMs)" />
        </template>

        <!-- MQTT -->
        <template v-else-if="sinkType === IotDataSinkTypeEnum.MQTT">
          <wd-cell title="服务地址" :value="config.url || '-'" />
          <wd-cell title="用户名" :value="config.username || '-'" />
          <wd-cell title="密码" :value="config.password || '-'" />
          <wd-cell title="客户端 ID" :value="config.clientId || '-'" />
          <wd-cell title="主题" :value="config.topic || '-'" />
        </template>

        <!-- Database -->
        <template v-else-if="sinkType === IotDataSinkTypeEnum.DATABASE">
          <wd-cell title="JDBC 地址" :value="config.jdbcUrl || '-'" />
          <wd-cell title="用户名" :value="config.username || '-'" />
          <wd-cell title="密码" :value="config.password || '-'" />
          <wd-cell title="目标表名" :value="config.tableName || '-'" />
        </template>

        <!-- RocketMQ -->
        <template v-else-if="sinkType === IotDataSinkTypeEnum.ROCKETMQ">
          <wd-cell title="NameServer" :value="config.nameServer || '-'" />
          <wd-cell title="AccessKey" :value="config.accessKey || '-'" />
          <wd-cell title="SecretKey" :value="config.secretKey || '-'" />
          <wd-cell title="消费组" :value="config.group || '-'" />
          <wd-cell title="主题" :value="config.topic || '-'" />
          <wd-cell title="标签" :value="config.tags || '-'" />
        </template>

        <!-- Kafka -->
        <template v-else-if="sinkType === IotDataSinkTypeEnum.KAFKA">
          <wd-cell title="服务地址" :value="config.bootstrapServers || '-'" />
          <wd-cell title="用户名" :value="config.username || '-'" />
          <wd-cell title="密码" :value="config.password || '-'" />
          <wd-cell title="启用 SSL" :value="formatBool(config.ssl)" />
          <wd-cell title="主题" :value="config.topic || '-'" />
        </template>

        <!-- RabbitMQ -->
        <template v-else-if="sinkType === IotDataSinkTypeEnum.RABBITMQ">
          <wd-cell title="主机地址" :value="config.host || '-'" />
          <wd-cell title="端口" :value="formatValue(config.port)" />
          <wd-cell title="虚拟主机" :value="config.virtualHost || '-'" />
          <wd-cell title="用户名" :value="config.username || '-'" />
          <wd-cell title="密码" :value="config.password || '-'" />
          <wd-cell title="交换机" :value="config.exchange || '-'" />
          <wd-cell title="路由键" :value="config.routingKey || '-'" />
          <wd-cell title="队列" :value="config.queue || '-'" />
        </template>

        <!-- RedisStream -->
        <template v-else-if="sinkType === IotDataSinkTypeEnum.REDIS_STREAM">
          <wd-cell title="主机地址" :value="config.host || '-'" />
          <wd-cell title="端口" :value="formatValue(config.port)" />
          <wd-cell title="密码" :value="config.password || '-'" />
          <wd-cell title="数据库" :value="formatValue(config.database)" />
          <wd-cell title="主题" :value="config.topic || '-'" />
        </template>
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['iot:data-sink:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['iot:data-sink:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DataSink, DataSinkConfig } from '@/api/iot/rule/data/sink'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteDataSink, getDataSink, IotDataSinkTypeEnum } from '@/api/iot/rule/data/sink'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<DataSink>() // 详情数据
const deleting = ref(false) // 删除状态
const config = computed<DataSinkConfig>(() => formData.value?.config || {}) // 目的配置
const sinkType = computed(() => formData.value?.type) // 目的类型

/** 格式化标量值，空值兜底 - */
function formatValue(value: any) {
  return value === undefined || value === null || value === '' ? '-' : String(value)
}

/** 格式化布尔值为是/否 */
function formatBool(value: any) {
  if (value === undefined || value === null) {
    return '-'
  }
  return value ? '是' : '否'
}

/** 格式化对象字段为 JSON 文本 */
function formatObject(value: any) {
  if (!value || typeof value !== 'object') {
    return '-'
  }
  if (!Object.keys(value).length) {
    return '-'
  }
  return JSON.stringify(value)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/rule/data/sink/index')
}

/** 加载数据目的详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getDataSink(Number(props.id))
}

/** 编辑数据目的 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-iot/rule/data/sink/form/index?id=${props.id}` })
}

/** 删除数据目的 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该数据目的吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDataSink(Number(props.id))
    toast.success('删除成功')
    uni.$emit('iot:data-sink:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
