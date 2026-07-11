<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="物模型数据" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 物模型运行态分类 -->
    <view class="bg-white">
      <wd-tabs v-model="activeTab" line-theme="text" @change="handleTabChange">
        <wd-tab title="属性" :name="0" />
        <wd-tab title="事件" :name="1" />
        <wd-tab title="服务" :name="2" />
      </wd-tabs>
    </view>

    <!-- 属性 -->
    <template v-if="activeTab === 0">
      <!-- 搜索组件 -->
      <view class="p-24rpx pb-0" @click="visible = true">
        <wd-search :placeholder="placeholder" hide-cancel disabled />
      </view>

      <!-- 刷新工具栏 -->
      <view class="mx-24rpx mt-16rpx flex justify-end">
        <view class="flex items-center gap-8rpx rounded-12rpx bg-white px-20rpx py-12rpx">
          <text class="text-24rpx text-[#666]">定时刷新</text>
          <wd-switch v-model="autoRefresh" size="20px" />
        </view>
      </view>

      <!-- 搜索弹窗 -->
      <wd-popup
        v-model="visible"
        position="top"
        :custom-style="getTopPopupStyle()"
        :modal-style="getTopPopupModalStyle()"
        @close="visible = false"
      >
        <view class="yd-search-form-container">
          <view class="yd-search-form-item">
            <view class="yd-search-form-label">
              属性关键字
            </view>
            <wd-input v-model="formData.keyword" placeholder="请输入属性名称或标识符" clearable />
          </view>
          <view class="yd-search-form-actions">
            <wd-button class="flex-1" variant="plain" @click="handleReset">
              重置
            </wd-button>
            <wd-button class="flex-1" type="primary" @click="handleSearch">
              搜索
            </wd-button>
          </view>
        </view>
      </wd-popup>

      <!-- 属性列表 -->
      <view class="min-h-0 flex-1 overflow-y-auto p-24rpx">
        <wd-loading v-if="loading" />
        <view v-else-if="list.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无物模型属性数据
        </view>
        <view v-else>
          <view v-for="item in list" :key="item.identifier" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 break-all text-32rpx text-[#333] font-semibold leading-40rpx">
                {{ item.name || item.identifier }}
              </view>
              <view class="shrink-0 rounded-6rpx bg-[#f0f5ff] px-12rpx py-4rpx text-24rpx text-[#2f54eb]">
                {{ item.dataType || '-' }}
              </view>
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">标识符：</text>{{ item.identifier || '-' }}
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">属性值：</text><text class="break-all">{{ formatValueWithUnit(item) }}</text>
            </view>
            <view class="mb-16rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">更新时间：</text>{{ formatDateTime(item.updateTime) || '-' }}
            </view>
            <view class="flex justify-end">
              <wd-button size="small" type="primary" variant="plain" @click="handleHistory(item)">
                查看历史
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 事件 -->
    <view v-else-if="activeTab === 1" class="min-h-0 flex flex-1 flex-col">
      <view class="p-24rpx pb-0" @click="openMessageSearch">
        <wd-search :placeholder="eventPlaceholder" hide-cancel disabled />
      </view>
      <z-paging
        ref="eventPagingRef"
        v-model="eventList"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无事件上报数据"
        @query="queryEventList"
      >
        <view class="p-24rpx">
          <view v-for="(item, index) in eventList" :key="index" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 break-all text-32rpx text-[#333] font-semibold leading-40rpx">
                {{ getEventName(item.request?.identifier) }}
              </view>
              <view class="shrink-0 rounded-6rpx bg-[#f0f5ff] px-12rpx py-4rpx text-24rpx text-[#2f54eb]">
                {{ getEventType(item.request?.identifier) }}
              </view>
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">标识符：</text>{{ item.request?.identifier || '-' }}
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">输入参数：</text><text class="break-all">{{ parseParams(item.request?.params) }}</text>
            </view>
            <view class="text-24rpx text-[#999]">
              <text class="mr-8rpx">上报时间：</text>{{ formatDateTime(item.request?.reportTime) || '-' }}
            </view>
          </view>
        </view>
      </z-paging>
    </view>

    <!-- 服务 -->
    <view v-else class="min-h-0 flex flex-1 flex-col">
      <view class="p-24rpx pb-0" @click="openMessageSearch">
        <wd-search :placeholder="servicePlaceholder" hide-cancel disabled />
      </view>
      <z-paging
        ref="servicePagingRef"
        v-model="serviceList"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无服务调用数据"
        @query="queryServiceList"
      >
        <view class="p-24rpx">
          <view v-for="(item, index) in serviceList" :key="index" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 break-all text-32rpx text-[#333] font-semibold leading-40rpx">
                {{ getServiceName(item.request?.identifier) }}
              </view>
              <view class="shrink-0 rounded-6rpx bg-[#f0f5ff] px-12rpx py-4rpx text-24rpx text-[#2f54eb]">
                {{ getCallType(item.request?.identifier) }}
              </view>
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">标识符：</text>{{ item.request?.identifier || '-' }}
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">输入参数：</text><text class="break-all">{{ parseParams(item.request?.params) }}</text>
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">输出参数：</text><text class="break-all">{{ formatReply(item.reply) }}</text>
            </view>
            <view class="mb-8rpx text-24rpx text-[#999]">
              <text class="mr-8rpx">调用时间：</text>{{ formatDateTime(item.request?.reportTime) || '-' }}
            </view>
            <view class="text-24rpx text-[#999]">
              <text class="mr-8rpx">响应时间：</text>{{ formatDateTime(item.reply?.reportTime) || '-' }}
            </view>
          </view>
        </view>
      </z-paging>
    </view>

    <!-- 事件/服务搜索弹窗 -->
    <wd-popup
      v-model="messageSearchVisible"
      position="top"
      :custom-style="getTopPopupStyle()"
      :modal-style="getTopPopupModalStyle()"
      @close="messageSearchVisible = false"
    >
      <view class="yd-search-form-container">
        <yd-search-picker
          v-model="messageSearchData.identifier"
          :label="activeTab === 1 ? '事件标识符' : '服务标识符'"
          :columns="currentMessageIdentifierOptions"
          all-option
        />
        <yd-search-date-range v-model="messageSearchData.times" label="时间范围" />
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" variant="plain" @click="handleMessageReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleMessageSearch">
            搜索
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 历史数据弹窗 -->
    <wd-popup v-model="historyVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="max-h-[70vh] p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ currentProperty?.name || currentProperty?.identifier || '属性历史' }}
        </view>
        <view v-if="historyLoading" class="py-60rpx text-center">
          <wd-loading />
        </view>
        <view v-else-if="historyList.length === 0" class="py-60rpx text-center text-28rpx text-[#999]">
          最近 7 天暂无历史数据
        </view>
        <scroll-view v-else scroll-y class="max-h-[48vh]">
          <view v-for="item in historyList" :key="String(item.updateTime) + String(item.value)" class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx">
            <view class="break-all text-28rpx text-[#333]">
              {{ formatJson(item.value, '-') }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              {{ formatDateTime(item.updateTime) || '-' }}
            </view>
          </view>
        </scroll-view>
        <wd-button class="mt-24rpx" block @click="historyVisible = false">
          关闭
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { IotDeviceMessagePair, IotDevicePropertyDetailResp, IotDevicePropertyResp } from '@/api/iot/device/device'
import type { ThingModelData } from '@/api/iot/thingmodel'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { getDevice, getDeviceMessagePairPage, getHistoryDevicePropertyList, getLatestDeviceProperties } from '@/api/iot/device/device'
import { getThingModelList } from '@/api/iot/thingmodel'
import { getIotOptionLabel, IotDeviceMessageMethodEnum, IoTThingModelEventTypeEnum, IoTThingModelServiceCallTypeEnum, IoTThingModelTypeEnum } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle, navigateBackPlus } from '@/utils'
import { formatDateRange, formatDateTime } from '@/utils/date'
import { formatJson } from '@/utils/format'
import { isEmptyValue } from '@/utils/is'

type MessageSearchTimes = [number | undefined, number | undefined]

const props = defineProps<{ deviceId?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const activeTab = ref(0) // 当前 tab：0 属性 / 1 事件 / 2 服务
const loading = ref(false) // 属性列表加载状态
const allList = ref<IotDevicePropertyDetailResp[]>([]) // 完整属性列表
const list = ref<IotDevicePropertyDetailResp[]>([]) // 展示属性列表
const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({ keyword: '' }) // 搜索表单数据
const autoRefresh = ref(false) // 属性定时刷新开关
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null // 属性定时刷新定时器
const historyVisible = ref(false) // 历史弹窗显示状态
const historyLoading = ref(false) // 历史加载状态
const historyList = ref<IotDevicePropertyResp[]>([]) // 历史数据
const currentProperty = ref<IotDevicePropertyDetailResp>() // 当前属性
const placeholder = computed(() => formData.keyword ? `关键字:${formData.keyword}` : '搜索物模型属性')

const thingModelList = ref<ThingModelData[]>([]) // 物模型列表（用于反查事件/服务名称与类型）
const eventList = ref<IotDeviceMessagePair[]>([]) // 事件上报列表
const serviceList = ref<IotDeviceMessagePair[]>([]) // 服务调用列表
const eventPagingRef = ref<any>() // 事件分页组件引用
const servicePagingRef = ref<any>() // 服务分页组件引用
const messageSearchVisible = ref(false) // 事件/服务搜索弹窗显示状态
const messageSearchData = reactive({
  identifier: undefined as string | undefined,
  times: [undefined, undefined] as MessageSearchTimes,
}) // 事件/服务搜索表单数据
const eventQueryParams = ref<Record<string, any>>({}) // 事件查询参数
const serviceQueryParams = ref<Record<string, any>>({}) // 服务查询参数

/** 事件类型的物模型数据 */
const eventThingModels = computed(() => {
  return thingModelList.value.filter(item => item.type === IoTThingModelTypeEnum.EVENT)
})

/** 服务类型的物模型数据 */
const serviceThingModels = computed(() => {
  return thingModelList.value.filter(item => item.type === IoTThingModelTypeEnum.SERVICE)
})
const currentMessageIdentifierOptions = computed(() => { // 当前事件/服务标识符选项
  const options = activeTab.value === 1 ? eventThingModels.value : serviceThingModels.value
  return options
    .filter(item => item.identifier)
    .map(item => ({ label: `${item.name}(${item.identifier})`, value: item.identifier }))
})
const eventPlaceholder = computed(() => buildMessagePlaceholder(eventQueryParams.value, '搜索事件上报'))
const servicePlaceholder = computed(() => buildMessagePlaceholder(serviceQueryParams.value, '搜索服务调用'))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.deviceId}`)
}

/** 查询最新属性 */
async function getList() {
  if (!props.deviceId) {
    allList.value = []
    list.value = []
    return
  }
  loading.value = true
  try {
    allList.value = await getLatestDeviceProperties({ deviceId: Number(props.deviceId) })
    handleFilter()
  } finally {
    loading.value = false
  }
}

/** 前端筛选属性 */
function handleFilter() {
  const keyword = formData.keyword.trim().toLowerCase()
  if (!keyword) {
    list.value = allList.value
    return
  }
  list.value = allList.value.filter((item) => {
    return item.identifier?.toLowerCase().includes(keyword) || item.name?.toLowerCase().includes(keyword)
  })
}

/** 格式化属性值 */
function formatValueWithUnit(item: IotDevicePropertyDetailResp) {
  if (isEmptyValue(item.value)) {
    return '-'
  }
  const value = typeof item.value === 'object' ? formatJson(item.value, '-', 0) : String(item.value)
  const unitName = item.dataSpecs && 'unitName' in item.dataSpecs ? item.dataSpecs.unitName : undefined
  return unitName ? `${value} ${unitName}` : value
}

/** 最近 7 天时间范围 */
function getDefaultTimes() {
  const end = new Date()
  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return [formatDateTime(start), formatDateTime(end)]
}

/** 查看历史数据 */
async function handleHistory(item: IotDevicePropertyDetailResp) {
  if (!props.deviceId || !item.identifier) {
    return
  }
  currentProperty.value = item
  historyVisible.value = true
  historyLoading.value = true
  try {
    historyList.value = await getHistoryDevicePropertyList({
      deviceId: Number(props.deviceId),
      identifier: item.identifier,
      times: getDefaultTimes(),
    })
  } finally {
    historyLoading.value = false
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  handleFilter()
}

/** 重置按钮操作 */
function handleReset() {
  formData.keyword = ''
  visible.value = false
  handleFilter()
}

/** 加载物模型列表（先取设备 productId 再查物模型，用于反查名称/类型） */
async function loadThingModelList() {
  if (!props.deviceId || thingModelList.value.length > 0) {
    return
  }
  const device = await getDevice(Number(props.deviceId))
  if (!device?.productId) {
    return
  }
  thingModelList.value = await getThingModelList({ productId: device.productId })
}

/** 查询事件上报列表 */
async function queryEventList(pageNo: number, pageSize: number) {
  if (!props.deviceId) {
    eventPagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    await loadThingModelList()
    const data = await getDeviceMessagePairPage({
      ...eventQueryParams.value,
      times: formatDateRange(eventQueryParams.value.times),
      deviceId: Number(props.deviceId),
      method: IotDeviceMessageMethodEnum.EVENT_POST.method,
      pageNo,
      pageSize,
    })
    eventPagingRef.value?.completeByTotal(data.list || [], data.total)
  } catch {
    eventPagingRef.value?.complete(false)
  }
}

/** 查询服务调用列表 */
async function queryServiceList(pageNo: number, pageSize: number) {
  if (!props.deviceId) {
    servicePagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    await loadThingModelList()
    const data = await getDeviceMessagePairPage({
      ...serviceQueryParams.value,
      times: formatDateRange(serviceQueryParams.value.times),
      deviceId: Number(props.deviceId),
      method: IotDeviceMessageMethodEnum.SERVICE_INVOKE.method,
      pageNo,
      pageSize,
    })
    servicePagingRef.value?.completeByTotal(data.list || [], data.total)
  } catch {
    servicePagingRef.value?.complete(false)
  }
}

/** 切换 tab：首次进入对应 tab 时再加载数据 */
function handleTabChange({ index }: { index: number }) {
  activeTab.value = index
  messageSearchVisible.value = false
}

/** 获取事件名称 */
function getEventName(identifier?: string) {
  if (!identifier) {
    return '-'
  }
  return eventThingModels.value.find(item => item.identifier === identifier)?.name || identifier
}

/** 获取事件类型 */
function getEventType(identifier?: string) {
  if (!identifier) {
    return '-'
  }
  const event = eventThingModels.value.find(item => item.identifier === identifier)
  const type = event?.event?.type
  if (!type) {
    return '-'
  }
  // 映射类型 label，找不到则显示原始值
  return getIotOptionLabel(Object.values(IoTThingModelEventTypeEnum), type) || type
}

/** 获取服务名称 */
function getServiceName(identifier?: string) {
  if (!identifier) {
    return '-'
  }
  return serviceThingModels.value.find(item => item.identifier === identifier)?.name || identifier
}

/** 获取服务调用方式 */
function getCallType(identifier?: string) {
  if (!identifier) {
    return '-'
  }
  const service = serviceThingModels.value.find(item => item.identifier === identifier)
  const callType = service?.service?.callType
  if (!callType) {
    return '-'
  }
  // 映射调用方式 label，找不到则显示原始值
  return getIotOptionLabel(Object.values(IoTThingModelServiceCallTypeEnum), callType) || callType
}

/** 解析输入参数：JSON.parse 后取 .params */
function parseParams(params?: unknown) {
  if (isEmptyValue(params)) {
    return '-'
  }
  if (typeof params !== 'string') {
    const result = typeof params === 'object' && params && 'params' in params ? params.params : params
    return typeof result === 'object' ? formatJson(result, '-', 0) : String(result)
  }
  try {
    const parsed = JSON.parse(params)
    const result = parsed.params ?? parsed
    return typeof result === 'object' ? formatJson(result, '-', 0) : String(result)
  } catch {
    return params
  }
}

/** 格式化服务输出参数（reply：code/msg/data） */
function formatReply(reply?: IotDeviceMessagePair['reply']) {
  if (!reply) {
    return '-'
  }
  return formatJson({ code: reply.code, msg: reply.msg ?? '', data: reply.data }, '-', 0)
}

/** 构造事件/服务搜索文案 */
function buildMessagePlaceholder(params: Record<string, any>, fallback: string) {
  const conditions: string[] = []
  if (params.identifier) {
    conditions.push(`标识符:${params.identifier}`)
  }
  if (params.times?.[0] && params.times?.[1]) {
    conditions.push('已选时间')
  }
  return conditions.length > 0 ? conditions.join(' | ') : fallback
}

/** 打开事件/服务搜索 */
function openMessageSearch() {
  const params = activeTab.value === 1 ? eventQueryParams.value : serviceQueryParams.value
  messageSearchData.identifier = params.identifier
  messageSearchData.times = (params.times || [undefined, undefined]) as MessageSearchTimes
  messageSearchVisible.value = true
}

/** 事件/服务搜索按钮操作 */
function handleMessageSearch() {
  const params = {
    identifier: messageSearchData.identifier,
    times: messageSearchData.times,
  }
  if (activeTab.value === 1) {
    eventQueryParams.value = params
    nextTick(() => eventPagingRef.value?.reload())
  } else {
    serviceQueryParams.value = params
    nextTick(() => servicePagingRef.value?.reload())
  }
  messageSearchVisible.value = false
}

/** 事件/服务重置按钮操作 */
function handleMessageReset() {
  messageSearchData.identifier = undefined
  messageSearchData.times = [undefined, undefined] as MessageSearchTimes
  if (activeTab.value === 1) {
    eventQueryParams.value = {}
    nextTick(() => eventPagingRef.value?.reload())
  } else {
    serviceQueryParams.value = {}
    nextTick(() => servicePagingRef.value?.reload())
  }
  messageSearchVisible.value = false
}

watch(autoRefresh, (value) => {
  if (value) {
    autoRefreshTimer = setInterval(() => getList(), 5000)
    return
  }
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})

/** 清理定时器 */
onBeforeUnmount(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
