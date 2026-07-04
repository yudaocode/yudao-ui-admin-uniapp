<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="IoT 首页" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <scroll-view scroll-y scroll-with-animation class="min-h-0 flex-1">
      <view class="p-24rpx space-y-24rpx">
        <!-- 操作栏 -->
        <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <view>
              <view class="text-30rpx text-[#333] font-semibold">
                IoT 首页
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                设备概览 / 消息趋势 / 设备地图
              </view>
            </view>
            <wd-button size="small" type="primary" :loading="isActiveTabLoading" @click="reloadStatistics">
              刷新
            </wd-button>
          </view>
          <view v-if="activeLoadError" class="border-t border-t-[#f5f5f5] px-24rpx py-16rpx text-24rpx text-[#fa8c16]">
            部分统计数据加载失败，请稍后刷新
          </view>
        </view>

        <!-- 分组切换 -->
        <wd-tabs v-model="activeTab" @change="handleTabChange">
          <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
        </wd-tabs>

        <!-- 概览 -->
        <view v-if="activeTab === IOT_HOME_TAB.OVERVIEW" class="space-y-24rpx">
          <!-- 核心统计 -->
          <view class="grid grid-cols-2 gap-16rpx">
            <Card v-for="item in summaryCards" :key="item.key">
              <view class="flex items-center justify-between">
                <text class="text-26rpx text-[#999]">{{ item.label }}</text>
                <text class="text-22rpx text-[#52c41a]">今日 +{{ formatNumber(item.todayCount) }}</text>
              </view>
              <view class="mt-16rpx text-42rpx text-[#333] font-semibold leading-none">
                <wd-loading v-if="summaryLoading" size="28rpx" />
                <text v-else>{{ formatNumber(item.value) }}</text>
              </view>
            </Card>
          </view>

          <!-- 设备状态 -->
          <Card title="设备状态统计">
            <view v-if="summaryLoading" class="flex justify-center py-48rpx">
              <wd-loading size="32rpx" />
            </view>
            <view v-else>
              <view
                v-for="item in statusItems"
                :key="item.state"
                class="border-b border-[#f5f5f5] py-18rpx last:border-b-0"
              >
                <view class="mb-12rpx flex items-center justify-between">
                  <view class="flex items-center gap-10rpx">
                    <view class="h-16rpx w-16rpx rounded-full" :style="{ backgroundColor: item.color }" />
                    <text class="text-28rpx text-[#666]">{{ item.label }}</text>
                  </view>
                  <text class="text-28rpx text-[#333] font-semibold">{{ formatNumber(item.count) }} 台</text>
                </view>
                <view class="h-12rpx overflow-hidden rounded-full bg-[#f0f2f5]">
                  <view class="h-full rounded-full" :style="{ width: `${item.percent}%`, backgroundColor: item.color }" />
                </view>
                <view class="mt-8rpx text-right text-22rpx text-[#999]">
                  占比 {{ item.percent }}%
                </view>
              </view>
            </view>
          </Card>

          <!-- 产品分类设备数 -->
          <Card title="产品分类设备数">
            <template #extra>
              <wd-tag type="primary" variant="plain">
                {{ categoryRows.length }} 类
              </wd-tag>
            </template>
            <YdChart
              class="mb-20rpx"
              :option="categoryOption"
              height="420rpx"
              :loading="summaryLoading"
              :empty="!summaryLoading && categoryRows.length === 0"
            />
            <view v-if="categoryRows.length > 0">
              <view
                v-for="item in categoryRows"
                :key="item.name"
                class="border-t border-[#f5f5f5] py-16rpx"
              >
                <view class="flex items-center justify-between gap-16rpx text-28rpx">
                  <text class="min-w-0 flex-1 truncate text-[#666]">{{ item.name }}</text>
                  <text class="shrink-0 text-[#333] font-semibold">{{ formatNumber(item.count) }} 台</text>
                </view>
              </view>
            </view>
          </Card>
        </view>

        <!-- 消息趋势 -->
        <Card v-if="activeTab === IOT_HOME_TAB.MESSAGE" title="设备消息趋势">
          <view class="mb-20rpx rounded-8rpx bg-[#f7f8fa] p-8rpx">
            <wd-form-item
              title="开始日期"
              title-width="160rpx"
              is-link
              :value="formatDate(filters.startTime)"
              placeholder="请选择开始日期"
              @click="startVisible = true"
            />
            <wd-datetime-picker
              v-model="filters.startTime"
              v-model:visible="startVisible"
              title="请选择开始日期"
              type="date"
              @confirm="reloadStatistics"
            />
            <wd-form-item
              title="结束日期"
              title-width="160rpx"
              is-link
              :value="formatDate(filters.endTime)"
              placeholder="请选择结束日期"
              @click="endVisible = true"
            />
            <wd-datetime-picker
              v-model="filters.endTime"
              v-model:visible="endVisible"
              title="请选择结束日期"
              type="date"
              @confirm="reloadStatistics"
            />
            <wd-form-item
              title="时间间隔"
              title-width="160rpx"
              is-link
              :value="intervalLabel"
              placeholder="请选择时间间隔"
              @click="intervalVisible = true"
            />
            <wd-picker
              v-model:visible="intervalVisible"
              :model-value="[filters.interval]"
              title="请选择时间间隔"
              :columns="intervalColumns"
              @confirm="handleIntervalConfirm"
            />
          </view>
          <view class="mb-20rpx text-24rpx text-[#999]">
            <text class="text-24rpx text-[#999]">{{ periodText }}</text>
          </view>
          <view class="grid grid-cols-2 mb-16rpx gap-16rpx">
            <view class="rounded-8rpx bg-[#f7f8fa] px-20rpx py-16rpx">
              <text class="block text-24rpx text-[#999]">上行消息</text>
              <text class="mt-8rpx block text-32rpx text-[#1677ff] font-semibold">{{ formatNumber(messageTotal.upstream) }}</text>
            </view>
            <view class="rounded-8rpx bg-[#f7f8fa] px-20rpx py-16rpx">
              <text class="block text-24rpx text-[#999]">下行消息</text>
              <text class="mt-8rpx block text-32rpx text-[#52c41a] font-semibold">{{ formatNumber(messageTotal.downstream) }}</text>
            </view>
          </view>
          <YdChart
            :option="messageTrendOption"
            height="460rpx"
            :loading="trendLoading"
            :empty="!trendLoading && messageRows.length === 0"
          />
        </Card>

        <!-- 设备分布 -->
        <Card v-if="activeTab === IOT_HOME_TAB.MAP" title="设备分布地图">
          <template #extra>
            <wd-tag type="primary" variant="plain">
              {{ deviceLocationList.length }} 台
            </wd-tag>
          </template>
          <view class="mb-20rpx flex flex-wrap gap-16rpx">
            <view v-for="item in stateOptions" :key="item.value" class="flex items-center gap-8rpx">
              <view class="h-14rpx w-14rpx rounded-full" :style="{ backgroundColor: getStateColor(Number(item.value)) }" />
              <text class="text-24rpx text-[#999]">{{ item.label }}</text>
            </view>
          </view>
          <view v-if="deviceLoading" class="flex justify-center py-48rpx">
            <wd-loading size="32rpx" />
          </view>
          <view v-else-if="deviceLocationList.length === 0">
            <wd-empty icon="content" tip="暂无设备位置数据" />
          </view>
          <view v-else>
            <view class="relative h-360rpx overflow-hidden rounded-12rpx bg-[#f7f8fa]">
              <view :id="MAP_CONTAINER_ID" class="h-full w-full" />
              <view v-if="mapLoading" class="absolute inset-0 flex items-center justify-center bg-[#f7f8fa]">
                <wd-loading size="32rpx" />
              </view>
              <view v-else-if="mapLoadError" class="absolute inset-0 flex flex-col items-center justify-center bg-[#f7f8fa] px-24rpx text-center">
                <text class="text-28rpx text-[#666]">{{ mapLoadError }}</text>
                <text class="mt-12rpx text-24rpx text-[#999]">下方展示设备位置明细</text>
              </view>
            </view>
            <view class="mt-20rpx">
              <view
                v-for="item in visibleDeviceLocations"
                :key="item.markerId"
                class="border-t border-[#f5f5f5] py-16rpx"
                @click="handleDeviceDetail(item.id)"
              >
                <view class="mb-8rpx flex items-center justify-between gap-16rpx">
                  <text class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-semibold">
                    {{ getDeviceTitle(item) }}
                  </text>
                  <dict-tag v-if="item.state != null" :type="DICT_TYPE.IOT_DEVICE_STATE" :value="item.state" />
                </view>
                <view class="text-24rpx text-[#999]">
                  {{ item.productName || '-' }} | {{ item.longitude }}, {{ item.latitude }}
                </view>
              </view>
              <view
                v-if="deviceLocationList.length > visibleDeviceLocations.length"
                class="border-t border-[#f5f5f5] pt-16rpx text-center text-26rpx text-[--wot-color-theme]"
                @click="handleDeviceList"
              >
                查看全部设备
              </view>
            </view>
          </view>
        </Card>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { Device } from '@/api/iot/device/device'
import type {
  IotStatisticsDeviceMessageSummaryByDateResp,
  IotStatisticsSummaryResp,
} from '@/api/iot/statistics'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { getDeviceLocationList } from '@/api/iot/device/device'
import { getDeviceMessageSummaryByDate, getStatisticsSummary } from '@/api/iot/statistics'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DeviceStateEnum, DICT_TYPE } from '@/utils/constants'
import Card from '@/pages-statistics/components/card/card.vue'
import YdChart from '@/pages-statistics/components/yd-chart/yd-chart.vue'
import { formatDate, formatDateRange } from '@/utils/date'
import { formatNumber, toFiniteNumber } from '@/utils/format'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

interface DeviceLocationItem {
  markerId: number
  id?: number
  deviceName?: string
  nickname?: string
  productName?: string
  state?: number
  longitude: number
  latitude: number
}

declare global {
  interface Window {
    BMapGL?: any
    __BAIDU_MAP_LOAD_CALLBACK__?: () => void
  }
}

const MAP_CONTAINER_ID = 'iot-device-location-map'
const BAIDU_MAP_CALLBACK_NAME = '__BAIDU_MAP_LOAD_CALLBACK__'
let baiduMapLoadPromise: Promise<void> | null = null
let mapInstance: any = null
const markerIconUrls: string[] = []
const IOT_HOME_TAB = {
  OVERVIEW: 0,
  MESSAGE: 1,
  MAP: 2,
} as const
type IotHomeTab = typeof IOT_HOME_TAB[keyof typeof IOT_HOME_TAB]
const tabs = [ // 分组配置
  { key: IOT_HOME_TAB.OVERVIEW, title: '概览' },
  { key: IOT_HOME_TAB.MESSAGE, title: '消息' },
  { key: IOT_HOME_TAB.MAP, title: '地图' },
]
const day = 3600 * 1000 * 24
const now = Date.now()
const filters = reactive({
  startTime: now - 7 * day,
  endTime: now - day,
  interval: 1,
}) // 消息趋势筛选条件
const emptySummary: IotStatisticsSummaryResp = {
  productCategoryCount: 0,
  productCount: 0,
  deviceCount: 0,
  deviceMessageCount: 0,
  productCategoryTodayCount: 0,
  productTodayCount: 0,
  deviceTodayCount: 0,
  deviceMessageTodayCount: 0,
  deviceOnlineCount: 0,
  deviceOfflineCount: 0,
  deviceInactiveCount: 0,
  productCategoryDeviceCounts: {},
}

const summary = ref<IotStatisticsSummaryResp>({ ...emptySummary }) // 全局统计
const messageRows = ref<IotStatisticsDeviceMessageSummaryByDateResp[]>([]) // 设备消息趋势
const deviceLocationList = ref<DeviceLocationItem[]>([]) // 设备位置列表
const summaryLoading = ref(false) // 全局统计加载状态
const trendLoading = ref(false) // 消息趋势加载状态
const deviceLoading = ref(false) // 设备位置加载状态
const mapLoading = ref(false) // 地图加载状态
const mapLoadError = ref('') // 地图加载异常
const startVisible = ref(false) // 开始日期选择器显隐
const endVisible = ref(false) // 结束日期选择器显隐
const intervalVisible = ref(false) // 时间间隔选择器显隐
const activeTab = ref<IotHomeTab>(IOT_HOME_TAB.OVERVIEW) // 当前分组
const loadedTabs = reactive<Partial<Record<IotHomeTab, boolean>>>({}) // 已加载分组
const loadingTabs = reactive<Partial<Record<IotHomeTab, boolean>>>({}) // 加载中分组
const loadErrors = reactive<Partial<Record<IotHomeTab, boolean>>>({}) // 加载失败分组

const stateColorMap: Record<number, string> = {
  [DeviceStateEnum.INACTIVE]: '#faad14',
  [DeviceStateEnum.ONLINE]: '#52c41a',
  [DeviceStateEnum.OFFLINE]: '#8c8c8c',
} // 设备状态颜色
const summaryCards = computed(() => [
  { key: 'productCategory', label: '产品分类', value: summary.value.productCategoryCount, todayCount: summary.value.productCategoryTodayCount },
  { key: 'product', label: '产品数量', value: summary.value.productCount, todayCount: summary.value.productTodayCount },
  { key: 'device', label: '设备数量', value: summary.value.deviceCount, todayCount: summary.value.deviceTodayCount },
  { key: 'message', label: '消息数量', value: summary.value.deviceMessageCount, todayCount: summary.value.deviceMessageTodayCount },
]) // 核心统计卡片
const statusItems = computed(() => { // 设备状态占比
  const total = summary.value.deviceCount || 0
  return [
    { state: DeviceStateEnum.ONLINE, label: '在线设备', count: summary.value.deviceOnlineCount, color: stateColorMap[DeviceStateEnum.ONLINE] },
    { state: DeviceStateEnum.OFFLINE, label: '离线设备', count: summary.value.deviceOfflineCount, color: stateColorMap[DeviceStateEnum.OFFLINE] },
    { state: DeviceStateEnum.INACTIVE, label: '待激活设备', count: summary.value.deviceInactiveCount, color: stateColorMap[DeviceStateEnum.INACTIVE] },
  ].map(item => ({
    ...item,
    percent: total > 0 ? Math.round((item.count * 100) / total) : 0,
  }))
})
const categoryRows = computed(() => Object.entries(summary.value.productCategoryDeviceCounts || {})
  .map(([name, count]) => ({ name, count: Number(count || 0) }))
  .sort((a, b) => b.count - a.count)) // 产品分类设备数
const categoryOption = computed(() => { // 产品分类设备数饼图
  if (categoryRows.value.length === 0) {
    return undefined
  }
  return {
    color: ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#faad14', '#f5222d'],
    tooltip: { trigger: 'item', confine: true, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll', textStyle: { color: '#666', fontSize: 11 } },
    series: [
      {
        name: '产品分类设备数',
        type: 'pie',
        radius: ['35%', '62%'],
        center: ['50%', '45%'],
        label: { show: true, formatter: '{b}\n{d}%', color: '#666', fontSize: 10 },
        data: categoryRows.value.map(item => ({ name: item.name, value: item.count })),
      },
    ],
  }
})
const intervalColumns = computed(() => // 时间间隔选项
  getIntDictOptions(DICT_TYPE.DATE_INTERVAL).map(dict => ({ value: dict.value, label: dict.label })),
)
const intervalLabel = computed(() => getDictLabel(DICT_TYPE.DATE_INTERVAL, filters.interval) || String(filters.interval)) // 时间间隔文案
const messageQuery = computed(() => ({
  interval: filters.interval,
  times: formatDateRange([filters.startTime, filters.endTime]),
})) // 消息趋势查询参数
const periodText = computed(() => {
  const times = messageQuery.value.times || []
  return times.length === 2 ? `${formatDate(times[0])} 至 ${formatDate(times[1])}` : '默认统计周期'
}) // 统计周期文案
const messageTotal = computed(() => messageRows.value.reduce((total, item) => ({
  upstream: total.upstream + Number(item.upstreamCount || 0),
  downstream: total.downstream + Number(item.downstreamCount || 0),
}), { upstream: 0, downstream: 0 })) // 消息上下行汇总
const messageTrendOption = computed(() => { // 消息趋势折线图
  if (messageRows.value.length === 0) {
    return undefined
  }
  return {
    color: ['#1677ff', '#52c41a'],
    tooltip: { trigger: 'axis', confine: true },
    legend: { top: 0, textStyle: { color: '#666', fontSize: 11 } },
    grid: { left: 12, right: 12, top: 52, bottom: 34, containLabel: true },
    xAxis: {
      type: 'category',
      data: messageRows.value.map(item => formatTrendTime(item.time)),
      axisLabel: { color: '#999', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#999', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      { name: '上行消息', type: 'line', smooth: true, data: messageRows.value.map(item => Number(item.upstreamCount || 0)) },
      { name: '下行消息', type: 'line', smooth: true, data: messageRows.value.map(item => Number(item.downstreamCount || 0)) },
    ],
  }
})
const stateOptions = computed(() => getIntDictOptions(DICT_TYPE.IOT_DEVICE_STATE)) // 设备状态图例
const visibleDeviceLocations = computed(() => deviceLocationList.value.slice(0, 6)) // 可见设备位置
const isActiveTabLoading = computed(() => !!loadingTabs[activeTab.value]) // 当前分组是否加载中
const activeLoadError = computed(() => !!loadErrors[activeTab.value]) // 当前分组是否加载失败

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 格式化趋势时间 */
function formatTrendTime(time?: string) {
  if (!time) {
    return '-'
  }
  if (filters.interval === 1) {
    return formatDate(time, 'MM-DD')
  }
  return time
}

/** 获取设备标题 */
function getDeviceTitle(item: Pick<DeviceLocationItem, 'deviceName' | 'nickname'>) {
  return item.nickname || item.deviceName || '未命名设备'
}

/** 获取设备状态颜色 */
function getStateColor(state?: number) {
  return state != null ? stateColorMap[state] || '#999999' : '#999999'
}

/** 获取设备状态配置 */
function getStateConfig(state?: number) {
  return {
    name: state != null ? getDictLabel(DICT_TYPE.IOT_DEVICE_STATE, state) || '未知' : '未知',
    color: getStateColor(state),
  }
}

/** 转义地图弹窗内容 */
function escapeHtml(value?: number | string) {
  return String(value ?? '-').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }[char] || char))
}

/** 标准化设备位置 */
function normalizeDeviceLocation(item: Device, index: number): DeviceLocationItem | undefined {
  const longitude = toFiniteNumber(item.longitude)
  const latitude = toFiniteNumber(item.latitude)
  if (longitude === undefined || latitude === undefined) {
    return undefined
  }
  return {
    markerId: index + 1,
    id: item.id,
    deviceName: item.deviceName,
    nickname: item.nickname,
    productName: item.productName,
    state: item.state,
    longitude,
    latitude,
  }
}

/** 加载百度地图 SDK */
function loadBaiduMapSdk(timeout = 10000): Promise<void> {
  const baiduWindow = window
  if (baiduWindow.BMapGL) {
    return Promise.resolve()
  }
  if (baiduMapLoadPromise) {
    return baiduMapLoadPromise
  }

  const mapKey = import.meta.env.VITE_BAIDU_MAP_KEY
  if (!mapKey) {
    return Promise.reject(new Error('百度地图 Key 未配置'))
  }

  baiduMapLoadPromise = new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      baiduMapLoadPromise = null
      reject(new Error('百度地图 SDK 加载超时'))
    }, timeout)

    baiduWindow[BAIDU_MAP_CALLBACK_NAME] = () => {
      clearTimeout(timeoutId)
      delete baiduWindow[BAIDU_MAP_CALLBACK_NAME]
      resolve()
    }

    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${mapKey}&callback=${BAIDU_MAP_CALLBACK_NAME}`
    script.onerror = () => {
      clearTimeout(timeoutId)
      baiduMapLoadPromise = null
      delete baiduWindow[BAIDU_MAP_CALLBACK_NAME]
      script.remove()
      reject(new Error('百度地图 SDK 加载失败'))
    }
    document.body.appendChild(script)
  })

  return baiduMapLoadPromise
}

/** 销毁地图实例 */
function destroyDeviceMap() {
  if (mapInstance) {
    mapInstance.destroy?.()
    mapInstance = null
  }
  markerIconUrls.splice(0).forEach(url => URL.revokeObjectURL(url))
}

/** 创建地图标记图标 */
function createMarkerIcon(color: string, isOnline: boolean) {
  const baiduWindow = window
  const size = isOnline ? 24 : 20
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
      ${isOnline ? `<circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>` : ''}
    </svg>
  `
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  markerIconUrls.push(url)
  return new baiduWindow.BMapGL.Icon(url, new baiduWindow.BMapGL.Size(size, size), {
    anchor: new baiduWindow.BMapGL.Size(size / 2, size / 2),
  })
}

/** 创建地图信息窗 */
function createInfoWindowContent(device: DeviceLocationItem) {
  const config = getStateConfig(device.state)
  const linkId = `iot-device-map-link-${device.markerId}`
  return {
    linkId,
    content: `
      <div style="padding: 8px; min-width: 180px;">
        <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">${escapeHtml(getDeviceTitle(device))}</div>
        <div style="color: #666; font-size: 12px; line-height: 1.8;">
          <div>产品: ${escapeHtml(device.productName)}</div>
          <div>状态: <span style="color: ${config.color}; font-weight: 500;">${escapeHtml(config.name)}</span></div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
          <a id="${linkId}" href="javascript:void(0)" style="color: #1677ff; font-size: 12px; text-decoration: none;">点击查看详情</a>
        </div>
      </div>
    `,
  }
}

/** 初始化设备分布地图 */
function initDeviceMap() {
  const baiduWindow = window
  const container = document.getElementById(MAP_CONTAINER_ID)
  if (!container || !baiduWindow.BMapGL) {
    return
  }

  destroyDeviceMap()
  mapInstance = new baiduWindow.BMapGL.Map(container)
  mapInstance.centerAndZoom(new baiduWindow.BMapGL.Point(106, 37.5), 5)
  mapInstance.enableScrollWheelZoom()
  mapInstance.addControl(new baiduWindow.BMapGL.ScaleControl())
  mapInstance.addControl(new baiduWindow.BMapGL.ZoomControl())

  const points = deviceLocationList.value.map(device => new baiduWindow.BMapGL.Point(device.longitude, device.latitude))
  deviceLocationList.value.forEach((device, index) => {
    const config = getStateConfig(device.state)
    const point = points[index]
    const marker = new baiduWindow.BMapGL.Marker(point, {
      icon: createMarkerIcon(config.color, device.state === DeviceStateEnum.ONLINE),
    })
    const { content, linkId } = createInfoWindowContent(device)

    marker.addEventListener('click', () => {
      const infoWindow = new baiduWindow.BMapGL.InfoWindow(content, {
        width: 220,
        height: 140,
        title: '',
      })
      infoWindow.addEventListener('open', () => {
        setTimeout(() => {
          document.getElementById(linkId)?.addEventListener('click', (event) => {
            event.preventDefault()
            handleDeviceDetail(device.id)
          })
        }, 100)
      })
      mapInstance.openInfoWindow(infoWindow, point)
    })
    mapInstance.addOverlay(marker)
  })

  if (points.length === 1) {
    mapInstance.centerAndZoom(points[0], 12)
  } else if (points.length > 1 && mapInstance.getViewport) {
    const viewport = mapInstance.getViewport(points)
    mapInstance.centerAndZoom(viewport.center, viewport.zoom)
  }
}

/** 渲染设备分布地图 */
async function renderDeviceMap() {
  mapLoadError.value = ''
  destroyDeviceMap()
  if (deviceLocationList.value.length === 0) {
    return
  }

  mapLoading.value = true
  try {
    await nextTick()
    await loadBaiduMapSdk()
    await nextTick()
    initDeviceMap()
  } catch (error) {
    mapLoadError.value = error instanceof Error ? error.message : '百度地图加载失败'
  } finally {
    mapLoading.value = false
  }
}

/** 查询全局统计 */
async function loadSummary() {
  summaryLoading.value = true
  try {
    summary.value = await getStatisticsSummary()
  } finally {
    summaryLoading.value = false
  }
}

/** 查询设备消息趋势 */
async function loadMessageTrend() {
  trendLoading.value = true
  try {
    messageRows.value = await getDeviceMessageSummaryByDate(messageQuery.value)
  } finally {
    trendLoading.value = false
  }
}

/** 查询设备位置 */
async function loadDeviceLocations() {
  deviceLoading.value = true
  try {
    const data = await getDeviceLocationList()
    deviceLocationList.value = data
      .map((item, index) => normalizeDeviceLocation(item, index))
      .filter((item): item is DeviceLocationItem => !!item)
  } finally {
    deviceLoading.value = false
  }
  await renderDeviceMap()
}

/** 时间间隔确认 */
function handleIntervalConfirm({ value }: { value: (number | string)[] }) {
  filters.interval = Number(value[0])
  reloadStatistics()
}

/** 查看设备详情 */
function handleDeviceDetail(id?: number) {
  if (!id) {
    return
  }
  uni.navigateTo({ url: `/pages-iot/device/device/detail/index?id=${id}` })
}

/** 查看设备列表 */
function handleDeviceList() {
  uni.navigateTo({ url: '/pages-iot/device/device/index' })
}

/** 加载当前分组统计 */
async function loadActiveTab(force = false) {
  const tab = activeTab.value
  if (loadingTabs[tab] || (!force && loadedTabs[tab])) {
    return
  }

  loadingTabs[tab] = true
  loadErrors[tab] = false
  try {
    if (tab === IOT_HOME_TAB.OVERVIEW) {
      await loadSummary()
    } else if (tab === IOT_HOME_TAB.MESSAGE) {
      await loadMessageTrend()
    } else {
      await loadDeviceLocations()
    }
    loadedTabs[tab] = true
  } catch {
    loadedTabs[tab] = false
    loadErrors[tab] = true
  } finally {
    loadingTabs[tab] = false
  }
}

/** 刷新当前分组统计 */
function reloadStatistics() {
  loadActiveTab(true)
}

/** 切换分组 */
async function handleTabChange({ index }: { index: number }) {
  const nextTab = index as IotHomeTab
  if (activeTab.value === IOT_HOME_TAB.MAP && nextTab !== IOT_HOME_TAB.MAP) {
    destroyDeviceMap()
  }
  activeTab.value = nextTab
  await nextTick()
  if (nextTab === IOT_HOME_TAB.MAP && loadedTabs[nextTab]) {
    renderDeviceMap()
    return
  }
  loadActiveTab()
}

/** 初始化 */
onMounted(() => {
  loadActiveTab()
})

/** 页面卸载 */
onUnmounted(() => {
  destroyDeviceMap()
})
</script>
