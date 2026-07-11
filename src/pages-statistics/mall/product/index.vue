<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品统计"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 搜索组件 -->
        <SearchForm
          class="mb-24rpx"
          :initial-start-time="defaultStartTime"
          :initial-end-time="defaultEndTime"
          @search="handleQuery"
          @reset="handleReset"
        />

        <view class="mb-24rpx flex justify-end">
          <wd-button size="small" type="primary" variant="plain" :loading="loading" @click="loadData">
            刷新
          </wd-button>
        </view>

        <!-- 商品概况 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <text class="mb-20rpx block text-30rpx text-[#333] font-semibold">商品概况</text>
          <SummaryGrid :items="summaryItems" reference-label="较前一周期" />
        </view>

        <!-- 分组切换 -->
        <wd-tabs v-model="activeTab" @change="handleTabChange">
          <wd-tab title="商品趋势" />
          <wd-tab title="商品排行" />
        </wd-tabs>
        <view v-if="activeTab === 0" class="pt-24rpx">
          <StatisticsCard :section="trendSection" :rows="trendRows" />
        </view>
        <view v-if="activeTab === 1" class="pt-24rpx">
          <StatisticsCard rank :section="rankSection" :rows="rankRows" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { SummaryItem } from '@/pages-statistics/components/card/summary-grid.vue'
import type { StatisticsSection } from '@/pages-statistics/utils/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getProductStatisticsAnalyse,
  getProductStatisticsList,
  getProductStatisticsRankPage,
} from '@/api/mall/statistics'
import { navigateBackPlus } from '@/utils'
import { formatDateRange } from '@/utils/date'
import SearchForm from '../components/search-form.vue'
import { fenToYuan } from '@/utils/format'
import { normalizeRows } from '@/pages-statistics/utils/statistics'
import StatisticsCard from '@/pages-statistics/components/card/statistics-card.vue'
import SummaryGrid from '@/pages-statistics/components/card/summary-grid.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const now = new Date()
const defaultStartTime = now.getTime() - 3600 * 1000 * 24 * 30 // 默认开始日期
const defaultEndTime = now.getTime() // 默认结束日期
const filters = reactive({
  startTime: defaultStartTime,
  endTime: defaultEndTime,
}) // 筛选条件
const loading = ref(false) // 统计加载状态
const activeTab = ref(0) // 当前分组：0 趋势 / 1 排行
const cache = reactive<Record<string, any>>({}) // 数据缓存：key=`分组@时间区间`

const times = computed(() => formatDateRange([filters.startTime, filters.endTime])) // 查询时间区间
function cacheKey(name: string | number) {
  return `${name}@${times.value}`
}
const summary = computed<Record<string, any>>(() => cache[cacheKey('summary')] ?? { value: {}, reference: {} }) // 商品概况
const trendRows = computed<Record<string, any>[]>(() => cache[cacheKey(0)] ?? []) // 商品趋势明细（已转元）
const rankRows = computed<Record<string, any>[]>(() => cache[cacheKey(1)] ?? []) // 商品排行明细（已转元）

const summaryItems = computed<SummaryItem[]>(() => {
  const value = summary.value.value || {}
  const reference = summary.value.reference || {}
  return [
    { label: '浏览量', value: value.browseCount || 0, reference: reference.browseCount },
    { label: '访客数', value: value.browseUserCount || 0, reference: reference.browseUserCount },
    { label: '支付件数', value: value.orderPayCount || 0, reference: reference.orderPayCount },
    { label: '支付金额', value: fenToYuan(value.orderPayPrice), reference: fenToYuan(reference.orderPayPrice), prefix: '￥' },
    { label: '退款件数', value: value.afterSaleCount || 0, reference: reference.afterSaleCount },
    { label: '退款金额', value: fenToYuan(value.afterSaleRefundPrice), reference: fenToYuan(reference.afterSaleRefundPrice), prefix: '￥' },
  ]
}) // 商品概况卡片

const trendSection: StatisticsSection = {
  title: '商品趋势',
  columns: [
    { prop: 'time', label: '时间' },
    { prop: 'browseCount', label: '浏览量' },
    { prop: 'browseUserCount', label: '访客数' },
    { prop: 'orderPayPrice', label: '支付金额', type: 'money' },
    { prop: 'afterSaleRefundPrice', label: '退款金额', type: 'money' },
  ],
  chart: {
    type: 'line',
    categoryProp: 'time',
    series: [
      { name: '浏览量', prop: 'browseCount', type: 'line' },
      { name: '访客数', prop: 'browseUserCount', type: 'line' },
      { name: '支付金额', prop: 'orderPayPrice', type: 'bar' },
      { name: '退款金额', prop: 'afterSaleRefundPrice', type: 'bar' },
    ],
  },
} // 商品趋势分组配置

const rankSection: StatisticsSection = {
  title: '商品排行（前 20）',
  columns: [
    { prop: 'name', label: '商品' },
    { prop: 'browseCount', label: '浏览量' },
    { prop: 'browseUserCount', label: '访客数' },
    { prop: 'cartCount', label: '加购件数' },
    { prop: 'orderCount', label: '下单件数' },
    { prop: 'orderPayCount', label: '支付件数' },
    { prop: 'orderPayPrice', label: '支付金额', type: 'money' },
    { prop: 'favoriteCount', label: '收藏数' },
    { prop: 'browseConvertPercent', label: '访客-支付转化率', type: 'percent' },
  ],
  chart: {
    type: 'bar',
    categoryProp: 'name',
    series: [{ name: '支付金额', prop: 'orderPayPrice' }],
    money: true,
  },
} // 商品排行分组配置

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载商品概况 */
async function loadSummary() {
  const key = cacheKey('summary')
  const data = await getProductStatisticsAnalyse({ times: times.value }).catch(() => ({ value: {}, reference: {} }))
  cache[key] = data || { value: {}, reference: {} }
}

/** 加载指定分组数据（按时间区间缓存，命中则跳过） */
async function loadTab(tab: number) {
  const key = cacheKey(tab)
  if (cache[key] !== undefined) {
    return
  }
  // 明细金额由分转元，避免金额 ×100
  if (tab === 0) {
    const listData = await getProductStatisticsList({ times: times.value }).catch(() => [])
    cache[key] = normalizeRows(listData).map(item => ({
      ...item,
      orderPayPrice: fenToYuan(item.orderPayPrice),
      afterSaleRefundPrice: fenToYuan(item.afterSaleRefundPrice),
    }))
    return
  }
  const rankData = await getProductStatisticsRankPage({ pageNo: 1, pageSize: 20, times: times.value }).catch(() => ({ list: [] }))
  cache[key] = normalizeRows(rankData?.list).map(item => ({
    ...item,
    orderPayPrice: fenToYuan(item.orderPayPrice),
  }))
}

/** 切换分组 */
async function handleTabChange({ index }: { index: number }) {
  activeTab.value = index
  loading.value = true
  try {
    await loadTab(index)
  } finally {
    loading.value = false
  }
}

/** 搜索 / 刷新：强制刷新当前分组并重载概况 */
async function loadData() {
  delete cache[cacheKey(activeTab.value)]
  loading.value = true
  try {
    await Promise.all([loadSummary(), loadTab(activeTab.value)])
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data: { endTime: number, startTime: number }) {
  filters.startTime = data.startTime
  filters.endTime = data.endTime
  loadData()
}

/** 重置按钮操作 */
function handleReset() {
  filters.startTime = defaultStartTime
  filters.endTime = defaultEndTime
  loadData()
}

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
