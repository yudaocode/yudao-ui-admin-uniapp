<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="模拟设备" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-26rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon name="list" size="40rpx" color="#333" @click="handleDeviceMessage" />
        </view>
      </template>
    </wd-navbar>

    <!-- 调试模式 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="上行指令" />
        <wd-tab title="下行指令" />
        <wd-tab v-if="canRawSend" title="raw 下发" />
      </wd-tabs>
    </view>

    <!-- 指令类型 -->
    <view v-if="tabType !== 'raw'" class="p-24rpx pb-0">
      <wd-radio-group v-if="tabType === 'upstream'" v-model="upstreamMethod" type="button">
        <wd-radio :name="IotDeviceMessageMethodEnum.PROPERTY_POST.method" :value="IotDeviceMessageMethodEnum.PROPERTY_POST.method">
          属性上报
        </wd-radio>
        <wd-radio :name="IotDeviceMessageMethodEnum.EVENT_POST.method" :value="IotDeviceMessageMethodEnum.EVENT_POST.method">
          事件上报
        </wd-radio>
        <wd-radio :name="IotDeviceMessageMethodEnum.STATE_UPDATE.method" :value="IotDeviceMessageMethodEnum.STATE_UPDATE.method">
          状态变更
        </wd-radio>
      </wd-radio-group>
      <wd-radio-group v-else v-model="downstreamMethod" type="button">
        <wd-radio :name="IotDeviceMessageMethodEnum.PROPERTY_SET.method" :value="IotDeviceMessageMethodEnum.PROPERTY_SET.method">
          属性设置
        </wd-radio>
        <wd-radio :name="IotDeviceMessageMethodEnum.SERVICE_INVOKE.method" :value="IotDeviceMessageMethodEnum.SERVICE_INVOKE.method">
          服务调用
        </wd-radio>
      </wd-radio-group>
    </view>

    <!-- 调试内容 -->
    <scroll-view scroll-y class="box-border min-h-0 w-full flex-1 p-24rpx pb-180rpx">
      <wd-loading v-if="loading" />

      <view v-else-if="tabType === 'raw'">
        <!-- raw 下发 -->
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
            透传下发
          </view>
          <view v-if="!rawSupported" class="mb-16rpx">
            <wd-notice-bar type="warning" wrapable :scrollable="false" text="HTTP / CoAP 产品不支持 raw 下发" />
          </view>
          <view class="mb-16rpx text-24rpx text-[#999]">
            {{ rawPayloadHint }}
          </view>
          <view class="rounded-8rpx bg-[#f7f8fa] p-8rpx">
            <wd-textarea
              v-model="rawHex"
              placeholder="载荷 HEX，空格可选，例如 AA 01 00 DC"
              :disabled="!rawSupported"
              custom-textarea-class="!h-200rpx !font-mono !text-24rpx"
            />
          </view>
          <view class="mt-16rpx text-24rpx text-[#999]">
            将真实发送给设备。不提供 raw 上报的模拟，验证脚本请用产品「数据解析 → 调试」。
          </view>
          <wd-button class="mt-24rpx" block type="primary" :loading="sending" :disabled="!rawSupported" @click="handleRawPush">
            发送
          </wd-button>
        </view>
      </view>

      <view v-else-if="showPropertyPanel">
        <!-- 属性调试 -->
        <view v-if="propertyList.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无物模型属性
        </view>
        <view v-else>
          <view v-for="item in propertyList" :key="item.identifier" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 text-30rpx text-[#333] font-semibold">
                {{ item.name || item.identifier }}
              </view>
              <view class="shrink-0 rounded-6rpx bg-[#f0f5ff] px-12rpx py-4rpx text-24rpx text-[#2f54eb]">
                {{ getThingModelDataType(item) || '-' }}
              </view>
            </view>
            <view class="mb-16rpx text-24rpx text-[#999]">
              标识符：{{ item.identifier || '-' }}
            </view>
            <wd-input
              :model-value="getFormValue(item.identifier)"
              placeholder="请输入属性值"
              clearable
              @update:model-value="setFormValue(item.identifier, $event)"
            />
          </view>
        </view>
      </view>

      <view v-else-if="upstreamMethod === IotDeviceMessageMethodEnum.EVENT_POST.method && tabType === 'upstream'">
        <!-- 事件上报 -->
        <view v-if="eventList.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无物模型事件
        </view>
        <view v-else>
          <view v-for="item in eventList" :key="item.identifier" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
              {{ item.name || item.identifier }}
            </view>
            <view class="mb-16rpx text-24rpx text-[#999]">
              标识符：{{ item.identifier || '-' }}
            </view>
            <wd-textarea
              :model-value="getFormValue(item.identifier)"
              placeholder="请输入事件参数 JSON"
              :maxlength="4000"
              show-word-limit
              @update:model-value="setFormValue(item.identifier, $event)"
            />
            <wd-button class="mt-16rpx" block type="primary" :loading="sendingKey === item.identifier" @click="handleEventPost(item)">
              上报事件
            </wd-button>
          </view>
        </view>
      </view>

      <view v-else-if="upstreamMethod === IotDeviceMessageMethodEnum.STATE_UPDATE.method && tabType === 'upstream'">
        <!-- 状态变更 -->
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-24rpx text-28rpx text-[#666]">
            模拟设备上线或离线状态变更。
          </view>
          <view class="flex gap-16rpx">
            <wd-button class="flex-1" type="primary" :loading="sending" @click="handleDeviceState(DeviceStateEnum.ONLINE)">
              设备上线
            </wd-button>
            <wd-button class="flex-1" type="danger" :loading="sending" @click="handleDeviceState(DeviceStateEnum.OFFLINE)">
              设备离线
            </wd-button>
          </view>
        </view>
      </view>

      <view v-else>
        <!-- 服务调用 -->
        <view v-if="serviceList.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无物模型服务
        </view>
        <view v-else>
          <view v-for="item in serviceList" :key="item.identifier" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
              {{ item.name || item.identifier }}
            </view>
            <view class="mb-16rpx text-24rpx text-[#999]">
              标识符：{{ item.identifier || '-' }}
            </view>
            <wd-textarea
              :model-value="getFormValue(item.identifier)"
              placeholder="请输入服务参数 JSON"
              :maxlength="4000"
              show-word-limit
              @update:model-value="setFormValue(item.identifier, $event)"
            />
            <wd-button class="mt-16rpx" block type="primary" :loading="sendingKey === item.identifier" @click="handleServiceInvoke(item)">
              服务调用
            </wd-button>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="showPropertyPanel" class="yd-detail-footer">
      <wd-button type="primary" block :loading="sending" :disabled="propertyList.length === 0" @click="handlePropertySend">
        {{ propertySendText }}
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Device } from '@/api/iot/device/device'
import type { Product } from '@/api/iot/product/product'
import type { ThingModelData } from '@/api/iot/thingmodel'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getDevice, sendDeviceMessage } from '@/api/iot/device/device'
import { getProduct, ProtocolTypeEnum } from '@/api/iot/product/product'
import { getThingModelList } from '@/api/iot/thingmodel'
import { useAccess } from '@/hooks/useAccess'
import {
  hexToBase64,
  IotRawMessageMethodEnum,
  MODBUS_PDU_MAX_BYTES,
  MODBUS_PDU_MIN_BYTES,
  MODBUS_WRITE_FUNCTION_CODES,
  parseHex,
  RAW_PAYLOAD_MAX_BYTES,
} from '@/pages-iot/utils/raw'
import { DeviceStateEnum, IotDeviceMessageMethodEnum, IoTThingModelTypeEnum } from '@/utils/constants'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{ deviceId?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const tabTypes = ['upstream', 'downstream', 'raw'] as const
const tabIndex = ref(0) // 当前调试模式
const tabType = computed(() => tabTypes[tabIndex.value])
const upstreamMethod = ref<string>(IotDeviceMessageMethodEnum.PROPERTY_POST.method) // 上行方法
const downstreamMethod = ref<string>(IotDeviceMessageMethodEnum.PROPERTY_SET.method) // 下行方法
const loading = ref(false) // 页面加载状态
const sending = ref(false) // 批量发送状态
const sendingKey = ref<string>() // 单项发送标识符
const deviceData = ref<Device>() // 设备详情
const productData = ref<Product>() // 产品详情，raw 下发按协议校验
const rawHex = ref('') // raw 下发载荷 HEX
const canRawSend = computed(() => { // 是否有 raw 下发权限：需要同时拥有消息发送、透传下发权限（hasAccessByCodes 为任一匹配，需分别判断）
  return hasAccessByCodes(['iot:device:message-send']) && hasAccessByCodes(['iot:device:message-raw-send'])
})
const thingModelList = ref<ThingModelData[]>([]) // 物模型列表
const formData = ref<Record<string, string>>({}) // 调试参数
const propertyList = computed(() => getFilteredThingModelList(IoTThingModelTypeEnum.PROPERTY))
const eventList = computed(() => getFilteredThingModelList(IoTThingModelTypeEnum.EVENT))
const serviceList = computed(() => getFilteredThingModelList(IoTThingModelTypeEnum.SERVICE))
const showPropertyPanel = computed(() => {
  return (tabType.value === 'upstream' && upstreamMethod.value === IotDeviceMessageMethodEnum.PROPERTY_POST.method)
    || (tabType.value === 'downstream' && downstreamMethod.value === IotDeviceMessageMethodEnum.PROPERTY_SET.method)
})
const propertySendText = computed(() => tabType.value === 'upstream' ? '发送属性上报' : '发送属性设置') // 属性调试主操作
const isModbusProduct = computed(() => { // 是否 Modbus 产品
  return [ProtocolTypeEnum.MODBUS_TCP_CLIENT, ProtocolTypeEnum.MODBUS_TCP_SERVER].includes(productData.value?.protocolType as ProtocolTypeEnum)
})
const rawSupported = computed(() => { // 是否支持 raw 下发，HTTP / CoAP 不支持
  return ![ProtocolTypeEnum.HTTP, ProtocolTypeEnum.COAP].includes(productData.value?.protocolType as ProtocolTypeEnum)
})
const rawPayloadHint = computed(() => { // raw 下发载荷说明
  if (isModbusProduct.value) {
    return `Modbus 产品填写 PDU（功能码 + 数据，不含从站地址和 CRC），${MODBUS_PDU_MIN_BYTES}~${MODBUS_PDU_MAX_BYTES} 字节；写功能码 05/06/0F/10 需要二次确认`
  }
  return `载荷 1~${RAW_PAYLOAD_MAX_BYTES} 字节`
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.deviceId}`)
}

/** 跳转设备消息 */
function handleDeviceMessage() {
  if (!props.deviceId) {
    return
  }
  uni.navigateTo({ url: `/pages-iot/device/device/message/index?deviceId=${props.deviceId}` })
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 筛选物模型 */
function getFilteredThingModelList(type: number) {
  return thingModelList.value.filter(item => item.type === type)
}

/** 获取表单值 */
function getFormValue(identifier?: string | number) {
  if (!identifier) {
    return ''
  }
  return formData.value[String(identifier)] || ''
}

/** 设置表单值 */
function setFormValue(identifier: string | number | undefined, value: string) {
  if (!identifier) {
    return
  }
  formData.value[String(identifier)] = value
}

/** 获取物模型数据类型 */
function getThingModelDataType(item: ThingModelData) {
  return item.property?.dataType || item.dataType || ''
}

/** 解析 JSON 参数 */
function parseJsonParams(value: string, label: string) {
  try {
    return value ? JSON.parse(value) : {}
  } catch {
    toast.warning(`${label}格式不正确`)
    return undefined
  }
}

/** 发送设备消息 */
async function sendMessage(method: string, params: any) {
  if (!props.deviceId) {
    return
  }
  await sendDeviceMessage({
    deviceId: props.deviceId as number,
    method,
    params,
  })
}

/** 发送属性消息 */
async function handlePropertySend() {
  const data: Record<string, string> = {}
  propertyList.value.forEach((item) => {
    const value = getFormValue(item.identifier)
    if (value && item.identifier) {
      data[String(item.identifier)] = value
    }
  })
  if (Object.keys(data).length === 0) {
    toast.warning('请至少填写一个属性值')
    return
  }
  sending.value = true
  try {
    const method = tabType.value === 'upstream'
      ? IotDeviceMessageMethodEnum.PROPERTY_POST.method
      : IotDeviceMessageMethodEnum.PROPERTY_SET.method
    await sendMessage(method, data)
    toast.success(tabType.value === 'upstream' ? '属性上报成功' : '属性设置成功')
  } finally {
    sending.value = false
  }
}

/** 上报事件 */
async function handleEventPost(item: ThingModelData) {
  if (!item.identifier) {
    return
  }
  const params = parseJsonParams(getFormValue(item.identifier), '事件参数')
  if (params === undefined) {
    return
  }
  sendingKey.value = item.identifier
  try {
    await sendMessage(IotDeviceMessageMethodEnum.EVENT_POST.method, {
      identifier: item.identifier,
      value: params,
      time: Date.now(),
    })
    toast.success('事件上报成功')
  } finally {
    sendingKey.value = undefined
  }
}

/** 模拟设备状态 */
async function handleDeviceState(state: DeviceStateEnum) {
  sending.value = true
  try {
    await sendMessage(IotDeviceMessageMethodEnum.STATE_UPDATE.method, { state })
    toast.success(state === DeviceStateEnum.ONLINE ? '设备上线成功' : '设备离线成功')
  } finally {
    sending.value = false
  }
}

/** 服务调用 */
async function handleServiceInvoke(item: ThingModelData) {
  if (!item.identifier) {
    return
  }
  const params = parseJsonParams(getFormValue(item.identifier), '服务参数')
  if (params === undefined) {
    return
  }
  sendingKey.value = item.identifier
  try {
    await sendMessage(IotDeviceMessageMethodEnum.SERVICE_INVOKE.method, {
      identifier: item.identifier,
      inputParams: params,
    })
    toast.success('服务调用成功')
  } finally {
    sendingKey.value = undefined
  }
}

/** raw 下发：确认后发送；Modbus 写操作需要二次确认 */
async function handleRawPush() {
  if (!canRawSend.value || !rawSupported.value || sending.value) {
    return
  }
  const hex = parseHex(rawHex.value)
  if (!hex) {
    toast.warning('请输入合法的 HEX 载荷')
    return
  }
  const length = hex.length / 2
  const minBytes = isModbusProduct.value ? MODBUS_PDU_MIN_BYTES : 1
  const maxBytes = isModbusProduct.value ? MODBUS_PDU_MAX_BYTES : RAW_PAYLOAD_MAX_BYTES
  if (length < minBytes || length > maxBytes) {
    toast.warning(`载荷需为 ${minBytes}~${maxBytes} 字节，当前 ${length} 字节`)
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `将真实发送给设备（${length} 字节），确定发送吗？` })
  } catch {
    return
  }
  // Modbus 写功能码：展示功能码和寄存器地址，再次确认
  const functionCode = Number.parseInt(hex.slice(0, 2), 16)
  if (isModbusProduct.value && MODBUS_WRITE_FUNCTION_CODES.includes(functionCode)) {
    const addressHex = hex.slice(2, 6).toUpperCase()
    try {
      await dialog.confirm({
        title: 'Modbus 写操作',
        msg: `功能码 0x${hex.slice(0, 2).toUpperCase()}，寄存器地址 ${Number.parseInt(addressHex, 16)}（0x${addressHex}），将写入设备，确定继续吗？`,
      })
    } catch {
      return
    }
  }
  sending.value = true
  try {
    await sendMessage(IotRawMessageMethodEnum.RAW_PUSH.method, { payload: hexToBase64(hex) })
    toast.success('发送成功')
  } finally {
    sending.value = false
  }
}

/** 加载设备和物模型 */
async function getDetail() {
  if (!props.deviceId) {
    return
  }
  loading.value = true
  try {
    deviceData.value = await getDevice(props.deviceId as number)
    if (deviceData.value.productId) {
      thingModelList.value = await getThingModelList({ productId: deviceData.value.productId })
      // raw 下发需要按产品协议校验载荷
      if (canRawSend.value) {
        productData.value = await getProduct(deviceData.value.productId)
      }
    }
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
