<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="WMS 首页"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <!-- 统计筛选 -->
        <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <view>
              <view class="text-30rpx text-[#333] font-semibold">
                WMS 首页
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                单据工作台 / 库存概览
              </view>
            </view>
            <wd-button size="small" type="primary" :loading="loading" @click="reloadStatistics">
              刷新
            </wd-button>
          </view>
          <wd-cell-group border>
            <WarehousePicker
              v-model="queryParams.warehouseId"
              label="仓库筛选"
              placeholder="全部仓库"
              @change="handleWarehouseChange"
            />
          </wd-cell-group>
          <view class="flex items-center justify-between px-24rpx py-16rpx text-24rpx text-[#999]">
            <text>统计时间</text>
            <text>{{ statTime || '-' }}</text>
          </view>
          <view v-if="loadError" class="border-t border-t-[#f5f5f5] px-24rpx py-16rpx text-24rpx text-[#fa8c16]">
            部分统计数据加载失败，请稍后刷新
          </view>
        </view>

        <!-- 分组切换 -->
        <wd-tabs v-model="activeTab" @change="handleTabChange">
          <wd-tab title="概览" />
          <wd-tab title="单据" />
          <wd-tab title="库存" />
        </wd-tabs>

        <!-- 概览 -->
        <view v-if="activeTab === WMS_HOME_TAB.OVERVIEW" class="mt-24rpx space-y-24rpx">
          <!-- 库存汇总 -->
          <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-16rpx flex items-center justify-between">
              <text class="text-30rpx text-[#333] font-semibold">库存汇总</text>
              <wd-loading v-if="loading" size="32rpx" />
            </view>
            <view class="text-56rpx text-[#1677ff] font-semibold">
              {{ formatQuantity(inventorySummary?.totalQuantity) || '0.00' }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              当前库存总量
            </view>
          </view>

          <!-- 单据汇总 -->
          <view>
            <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
              单据汇总
            </view>
            <view class="grid grid-cols-2 gap-16rpx">
              <view
                v-for="item in orderSummaryCards"
                :key="item.type"
                class="rounded-12rpx bg-white p-24rpx shadow-sm"
                @click="handleOrderSummaryClick(item.type)"
              >
                <view class="mb-12rpx flex items-center justify-between gap-12rpx">
                  <view class="min-w-0 flex items-center gap-8rpx">
                    <view class="h-14rpx w-14rpx shrink-0 rounded-full" :style="{ backgroundColor: item.color }" />
                    <text class="truncate text-26rpx text-[#666]">{{ item.title }}</text>
                  </view>
                  <text class="text-22rpx text-[#1677ff]">查看</text>
                </view>
                <view class="mb-16rpx flex items-baseline gap-8rpx">
                  <text class="text-42rpx text-[#333] font-semibold">{{ item.total || 0 }}</text>
                  <text class="text-24rpx text-[#999]">单</text>
                </view>
                <view class="mb-16rpx h-12rpx flex overflow-hidden rounded-full bg-[#f0f2f5]">
                  <view
                    v-for="status in statusList"
                    :key="status.status"
                    class="h-full"
                    :style="{ width: getStatusPercent(item, status.status), backgroundColor: status.color }"
                  />
                </view>
                <view
                  v-for="status in statusList"
                  :key="status.status"
                  class="mb-8rpx flex items-center justify-between text-24rpx text-[#999]"
                >
                  <view class="flex items-center gap-8rpx">
                    <view class="h-10rpx w-10rpx rounded-full" :style="{ backgroundColor: status.color }" />
                    <text>{{ status.label }}</text>
                  </view>
                  <text>{{ item.statusCounts[status.status] || 0 }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 单据趋势 -->
        <view v-if="activeTab === WMS_HOME_TAB.ORDER" class="mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="text-30rpx text-[#333] font-semibold">
                  单据趋势
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  入库、出库、移库、盘库单据数量
                </view>
              </view>
              <view class="flex shrink-0 rounded-8rpx bg-[#f5f7fa] p-4rpx">
                <view
                  v-for="item in trendDayOptions"
                  :key="item.value"
                  class="h-56rpx min-w-112rpx flex items-center justify-center rounded-6rpx px-16rpx text-24rpx"
                  :class="trendDays === item.value ? 'bg-white text-[#1677ff] shadow-sm' : 'text-[#666]'"
                  @click="handleTrendDaysChange(item.value)"
                >
                  {{ item.label }}
                </view>
              </view>
            </view>
          </view>
          <view v-if="orderTrend.length > 0" class="px-12rpx py-24rpx">
            <scroll-view scroll-x class="w-full whitespace-nowrap">
              <view class="inline-flex items-end gap-24rpx px-12rpx" :style="{ height: `${trendChartHeight}rpx` }">
                <view
                  v-for="item in orderTrend"
                  :key="String(item.time)"
                  class="flex shrink-0 flex-col items-center justify-end"
                  :style="{ height: `${trendChartHeight}rpx` }"
                >
                  <text class="mb-8rpx text-20rpx text-[#999]">{{ getTrendTotal(item) }}</text>
                  <view class="h-180rpx flex items-end gap-5rpx">
                    <view
                      v-for="definition in orderDefinitions"
                      :key="definition.type"
                      class="w-18rpx rounded-t-6rpx"
                      :style="{
                        height: `${getTrendBarHeight(item, definition.trendField)}rpx`,
                        backgroundColor: definition.color,
                      }"
                    />
                  </view>
                  <text class="mt-12rpx text-20rpx text-[#999]">{{ formatTrendTime(item.time) }}</text>
                </view>
              </view>
            </scroll-view>
            <view class="mt-16rpx flex flex-wrap justify-center gap-x-24rpx gap-y-12rpx text-22rpx text-[#999]">
              <view v-for="item in orderDefinitions" :key="item.type" class="flex items-center gap-8rpx">
                <view class="h-12rpx w-12rpx rounded-full" :style="{ backgroundColor: item.color }" />
                <text>{{ item.title }}</text>
              </view>
            </view>
          </view>
          <view v-else class="px-24rpx py-48rpx text-center text-26rpx text-[#999]">
            暂无趋势数据
          </view>
        </view>

        <!-- 库存 -->
        <view v-if="activeTab === WMS_HOME_TAB.INVENTORY" class="mt-24rpx space-y-24rpx">
          <!-- 货物占比 -->
          <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-8rpx text-30rpx text-[#333] font-semibold">
              货物占比
            </view>
            <view class="mb-20rpx text-24rpx text-[#999]">
              按商品库存数量汇总 Top {{ goodsLimit }}
            </view>
            <view v-if="goodsShareItems.length > 0" class="space-y-20rpx">
              <view v-for="item in goodsShareItems" :key="item.id">
                <view class="mb-8rpx flex items-center justify-between gap-16rpx text-26rpx">
                  <text class="min-w-0 flex-1 truncate text-[#333]">{{ item.name }}</text>
                  <text class="shrink-0 text-[#999]">{{ item.quantityText }} · {{ item.percentText }}</text>
                </view>
                <view class="h-12rpx overflow-hidden rounded-full bg-[#f0f2f5]">
                  <view class="h-full rounded-full bg-[#18a058]" :style="{ width: item.percentWidth }" />
                </view>
              </view>
            </view>
            <view v-else class="py-32rpx text-center text-26rpx text-[#999]">
              暂无商品库存数据
            </view>
          </view>

          <!-- 库存分布 -->
          <view class="mb-32rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-8rpx flex items-center justify-between gap-16rpx">
              <text class="text-30rpx text-[#333] font-semibold">库存分布</text>
              <text class="text-24rpx text-[#999]">总库存 {{ formatQuantity(inventorySummary?.totalQuantity) || '0.00' }}</text>
            </view>
            <view class="mb-20rpx text-24rpx text-[#999]">
              按仓库库存数量汇总 Top {{ warehouseLimit }}
            </view>
            <view v-if="warehouseDistributionItems.length > 0" class="space-y-20rpx">
              <view v-for="item in warehouseDistributionItems" :key="item.id">
                <view class="mb-8rpx flex items-center justify-between gap-16rpx text-26rpx">
                  <text class="min-w-0 flex-1 truncate text-[#333]">{{ item.name }}</text>
                  <text class="shrink-0 text-[#999]">{{ item.quantityText }}</text>
                </view>
                <view class="h-12rpx overflow-hidden rounded-full bg-[#f0f2f5]">
                  <view class="h-full rounded-full bg-[#2f7df6]" :style="{ width: item.percentWidth }" />
                </view>
              </view>
            </view>
            <view v-else class="py-32rpx text-center text-26rpx text-[#999]">
              暂无仓库库存数据
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { WmsHomeInventorySummaryResp, WmsHomeOrderSummaryResp, WmsHomeOrderTrendResp } from '@/api/wms/home'
import { computed, onMounted, reactive, ref } from 'vue'
import { getWmsHomeInventorySummary, getWmsHomeOrderSummary, getWmsHomeOrderTrend } from '@/api/wms/home'
import { getDictLabel } from '@/hooks/useDict'
import WarehousePicker from '@/pages-wms/md/warehouse/components/warehouse-picker.vue'
import { formatQuantity } from '@/pages-wms/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, WmsOrderStatusEnum, WmsOrderTypeEnum } from '@/utils/constants'
import { formatDate, formatDateTime, toTimestamp } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const goodsLimit = 5 // 商品占比数量
const warehouseLimit = 8 // 仓库分布数量
const trendChartHeight = 260 // 趋势图高度
const loading = ref(false) // 统计加载状态
const loadError = ref(false) // 是否存在统计加载失败
const trendDays = ref(7) // 趋势统计天数
const statTime = ref('') // 统计刷新时间
const queryParams = reactive({
  warehouseId: undefined as number | undefined,
}) // 查询参数
const orderSummary = ref<WmsHomeOrderSummaryResp[]>([]) // 单据汇总
const orderTrend = ref<WmsHomeOrderTrendResp[]>([]) // 单据趋势
const inventorySummary = ref<WmsHomeInventorySummaryResp>() // 库存汇总
type OrderTrendField = 'receiptCount' | 'shipmentCount' | 'movementCount' | 'checkCount'

const WMS_HOME_TAB = {
  OVERVIEW: 0,
  ORDER: 1,
  INVENTORY: 2,
} as const
type WmsHomeTab = typeof WMS_HOME_TAB[keyof typeof WMS_HOME_TAB]
const activeTab = ref<WmsHomeTab>(WMS_HOME_TAB.OVERVIEW) // 当前分组
const loadedTabs = reactive<Partial<Record<WmsHomeTab, boolean>>>({}) // 已加载分组

const statusList = [
  { status: WmsOrderStatusEnum.PREPARE, label: getOrderStatusName(WmsOrderStatusEnum.PREPARE, '草稿'), color: '#409eff' },
  { status: WmsOrderStatusEnum.FINISHED, label: getOrderStatusName(WmsOrderStatusEnum.FINISHED, '已完成'), color: '#67c23a' },
  { status: WmsOrderStatusEnum.CANCELED, label: getOrderStatusName(WmsOrderStatusEnum.CANCELED, '已作废'), color: '#909399' },
] // 单据状态分段配置
const orderDefinitions = [
  { type: WmsOrderTypeEnum.RECEIPT, title: getOrderTypeName(WmsOrderTypeEnum.RECEIPT), color: '#2f7df6', route: '/pages-wms/order/receipt/index', trendField: 'receiptCount' as const },
  { type: WmsOrderTypeEnum.SHIPMENT, title: getOrderTypeName(WmsOrderTypeEnum.SHIPMENT), color: '#18a058', route: '/pages-wms/order/shipment/index', trendField: 'shipmentCount' as const },
  { type: WmsOrderTypeEnum.MOVEMENT, title: getOrderTypeName(WmsOrderTypeEnum.MOVEMENT), color: '#f59e0b', route: '/pages-wms/order/movement/index', trendField: 'movementCount' as const },
  { type: WmsOrderTypeEnum.CHECK, title: getOrderTypeName(WmsOrderTypeEnum.CHECK), color: '#7c3aed', route: '/pages-wms/order/check/index', trendField: 'checkCount' as const },
] // 单据类型配置
const trendDayOptions = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 },
] // 趋势天数选项

const orderSummaryCards = computed(() => { // 单据汇总卡片
  return orderDefinitions.map((definition) => {
    const summary = orderSummary.value.find(item => item.type === definition.type)
    const statusCounts = (summary?.statuses || []).reduce<Record<number, number>>((result, item) => {
      result[item.status] = item.count
      return result
    }, {})
    return {
      ...definition,
      total: summary?.total || 0,
      statusCounts,
    }
  })
})
const trendMax = computed(() => { // 趋势图单项最大值
  return Math.max(...orderTrend.value.flatMap(item => getTrendValues(item)), 0)
})
const goodsShareItems = computed(() => { // 货物占比列表
  const list = inventorySummary.value?.goodsShareList || []
  const filteredList = list.filter(item => Number(item.quantity || 0) > 0)
  const total = filteredList.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  return filteredList.map((item) => {
    const quantity = Number(item.quantity || 0)
    return {
      ...item,
      name: item.name || '未命名商品',
      quantityText: formatQuantity(quantity) || '0.00',
      percentText: getPercentText(quantity, total),
      percentWidth: getPercentWidth(quantity, total),
    }
  })
})
const warehouseDistributionItems = computed(() => { // 仓库分布列表
  const list = inventorySummary.value?.warehouseDistributionList || []
  const filteredList = list.filter(item => Number(item.quantity || 0) > 0)
  const max = Math.max(...filteredList.map(item => Number(item.quantity || 0)), 0)
  return filteredList.map((item) => {
    const quantity = Number(item.quantity || 0)
    return {
      ...item,
      name: item.name || '未指定仓库',
      quantityText: formatQuantity(quantity) || '0.00',
      percentWidth: getPercentWidth(quantity, max),
    }
  })
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 构建统计查询参数 */
function buildStatisticsParams() {
  return {
    warehouseId: queryParams.warehouseId,
    goodsLimit,
    warehouseLimit,
  }
}

/** 加载概览统计 */
async function loadOverviewStatistics() {
  const params = buildStatisticsParams()
  const [summary, inventory] = await Promise.all([
    getWmsHomeOrderSummary(params),
    getWmsHomeInventorySummary(params),
  ])
  orderSummary.value = summary
  inventorySummary.value = inventory
}

/** 加载单据趋势 */
async function loadOrderTrendStatistics() {
  orderTrend.value = await getWmsHomeOrderTrend(trendDays.value, buildStatisticsParams())
}

/** 加载库存统计 */
async function loadInventoryStatistics() {
  inventorySummary.value = await getWmsHomeInventorySummary(buildStatisticsParams())
}

/** 加载当前分组统计 */
async function loadActiveTab(force = false) {
  const tab = activeTab.value
  if (!force && loadedTabs[tab]) {
    return
  }
  loading.value = true
  loadError.value = false
  try {
    if (tab === WMS_HOME_TAB.OVERVIEW) {
      await loadOverviewStatistics()
      loadedTabs[WMS_HOME_TAB.INVENTORY] = true
    } else if (tab === WMS_HOME_TAB.ORDER) {
      await loadOrderTrendStatistics()
    } else {
      await loadInventoryStatistics()
    }
    loadedTabs[tab] = true
    statTime.value = formatDateTime(new Date())
  } catch {
    loadedTabs[tab] = false
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 刷新当前分组统计 */
function reloadStatistics() {
  loadActiveTab(true)
}

/** 清空已加载分组 */
function clearLoadedTabs() {
  loadedTabs[WMS_HOME_TAB.OVERVIEW] = false
  loadedTabs[WMS_HOME_TAB.ORDER] = false
  loadedTabs[WMS_HOME_TAB.INVENTORY] = false
}

/** 仓库筛选变化 */
function handleWarehouseChange() {
  clearLoadedTabs()
  loadActiveTab(true)
}

/** 切换分组 */
function handleTabChange({ index }: { index: number }) {
  activeTab.value = index as WmsHomeTab
  loadActiveTab()
}

/** 获取单据类型名称 */
function getOrderTypeName(type: number) {
  const label = getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, type)
  if (label) {
    return label.replace(/单$/, '')
  }
  return ''
}

/** 获取单据状态名称 */
function getOrderStatusName(status: number, fallback: string = `状态 ${status}`) {
  return getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, status) || fallback
}

/** 获取趋势总数 */
function getTrendTotal(item: WmsHomeOrderTrendResp) {
  return getTrendValues(item).reduce((sum, value) => sum + value, 0)
}

/** 获取趋势单项数值 */
function getTrendValues(item: WmsHomeOrderTrendResp) {
  return orderDefinitions.map(definition => Number(item[definition.trendField] || 0))
}

/** 格式化趋势日期 */
function formatTrendTime(time: WmsHomeOrderTrendResp['time']) {
  return formatDate(toTimestamp(time), 'MM-DD')
}

/** 获取趋势柱高度 */
function getTrendBarHeight(item: WmsHomeOrderTrendResp, field: OrderTrendField) {
  if (!trendMax.value) {
    return 0
  }
  const value = Number(item[field] || 0)
  return value > 0 ? Math.max(8, Math.round((value / trendMax.value) * 180)) : 0
}

/** 获取占比文案 */
function getPercentText(value: number, total: number) {
  if (!total) {
    return '0%'
  }
  return `${((value / total) * 100).toFixed(1)}%`
}

/** 获取占比宽度 */
function getPercentWidth(value: number, total: number) {
  if (!total) {
    return '0%'
  }
  return `${Math.max(1, Math.round((value / total) * 100))}%`
}

/** 获取状态占比 */
function getStatusPercent(item: typeof orderSummaryCards.value[number], status: number) {
  const count = item.statusCounts[status] || 0
  if (!item.total || !count) {
    return '0%'
  }
  return `${Math.max(1, Math.round((count / item.total) * 100))}%`
}

/** 切换趋势统计天数 */
function handleTrendDaysChange(days: number) {
  if (trendDays.value === days) {
    return
  }
  trendDays.value = days
  loadedTabs[WMS_HOME_TAB.ORDER] = false
  loadActiveTab(true)
}

/** 跳转单据列表 */
function handleOrderSummaryClick(type: number) {
  const route = orderDefinitions.find(item => item.type === type)?.route
  if (!route) {
    return
  }
  uni.navigateTo({ url: route })
}

/** 初始化 */
onMounted(() => {
  loadActiveTab(true)
})
</script>
