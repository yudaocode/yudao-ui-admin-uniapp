<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="ERP 管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx space-y-24rpx">
        <!-- 操作栏 -->
        <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <text class="text-30rpx text-[#333] font-semibold">ERP 统计</text>
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

        <view v-if="isActiveTabLoading && !isActiveTabLoaded" class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm">
          <wd-loading size="32rpx" />
          <view class="mt-12rpx">
            正在加载统计数据
          </view>
        </view>

        <!-- 销售统计 -->
        <view v-else-if="activeTab === ERP_HOME_TAB.SALE" class="space-y-24rpx">
          <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
              销售概况
            </view>
            <view class="grid grid-cols-2 gap-16rpx p-24rpx">
              <SummaryCard
                v-for="card in saleCards"
                :key="card.label"
                :title="card.label"
                :value="card.value"
              />
            </view>
          </view>

          <TimeSummaryChart title="销售统计" :value="saleTimeSummaryList" color="#1677ff" />
        </view>

        <!-- 采购统计 -->
        <view v-else-if="activeTab === ERP_HOME_TAB.PURCHASE" class="space-y-24rpx">
          <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
              采购概况
            </view>
            <view class="grid grid-cols-2 gap-16rpx p-24rpx">
              <SummaryCard
                v-for="card in purchaseCards"
                :key="card.label"
                :title="card.label"
                :value="card.value"
              />
            </view>
          </view>

          <TimeSummaryChart title="采购统计" :value="purchaseTimeSummaryList" color="#fa8c16" />
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="h-40rpx" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ErpPurchaseSummaryResp, ErpPurchaseTimeSummaryResp } from '@/api/erp/statistics/purchase'
import type { ErpSaleSummaryResp, ErpSaleTimeSummaryResp } from '@/api/erp/statistics/sale'
import { computed, onMounted, reactive, ref } from 'vue'
import { getPurchaseSummary, getPurchaseTimeSummary } from '@/api/erp/statistics/purchase'
import { getSaleSummary, getSaleTimeSummary } from '@/api/erp/statistics/sale'
import { navigateBackPlus } from '@/utils'
import SummaryCard from '@/pages-statistics/components/card/summary-card.vue'
import TimeSummaryChart from '@/pages-statistics/components/card/time-summary-chart.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const ERP_HOME_TAB = {
  SALE: 0,
  PURCHASE: 1,
} as const

const tabs = [ // 分组配置
  { key: ERP_HOME_TAB.SALE, title: '销售统计' },
  { key: ERP_HOME_TAB.PURCHASE, title: '采购统计' },
]
const activeTab = ref<number>(ERP_HOME_TAB.SALE) // 当前分组
const loadedTabs = reactive<Record<number, boolean>>({}) // 已加载分组
const loadingTabs = reactive<Record<number, boolean>>({}) // 加载中分组
const loadErrors = reactive<Record<number, boolean>>({}) // 加载失败分组
const saleSummary = ref<Partial<ErpSaleSummaryResp>>({}) // 销售概况统计
const purchaseSummary = ref<Partial<ErpPurchaseSummaryResp>>({}) // 采购概况统计
const saleTimeSummaryList = ref<ErpSaleTimeSummaryResp[]>([]) // 销售时段统计
const purchaseTimeSummaryList = ref<ErpPurchaseTimeSummaryResp[]>([]) // 采购时段统计
const isActiveTabLoaded = computed(() => !!loadedTabs[activeTab.value]) // 当前分组是否已加载
const isActiveTabLoading = computed(() => !!loadingTabs[activeTab.value]) // 当前分组是否加载中
const activeLoadError = computed(() => !!loadErrors[activeTab.value]) // 当前分组是否加载失败

/** 销售概况卡片 */
const saleCards = computed(() => [
  { label: '今日销售', value: saleSummary.value.todayPrice },
  { label: '昨日销售', value: saleSummary.value.yesterdayPrice },
  { label: '本月销售', value: saleSummary.value.monthPrice },
  { label: '今年销售', value: saleSummary.value.yearPrice },
])

/** 采购概况卡片 */
const purchaseCards = computed(() => [
  { label: '今日采购', value: purchaseSummary.value.todayPrice },
  { label: '昨日采购', value: purchaseSummary.value.yesterdayPrice },
  { label: '本月采购', value: purchaseSummary.value.monthPrice },
  { label: '今年采购', value: purchaseSummary.value.yearPrice },
])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载销售统计 */
async function loadSaleSummary() {
  const [summary, timeSummary] = await Promise.all([
    getSaleSummary(),
    getSaleTimeSummary(),
  ])
  saleSummary.value = summary || {}
  saleTimeSummaryList.value = timeSummary || []
}

/** 加载采购统计 */
async function loadPurchaseSummary() {
  const [summary, timeSummary] = await Promise.all([
    getPurchaseSummary(),
    getPurchaseTimeSummary(),
  ])
  purchaseSummary.value = summary || {}
  purchaseTimeSummaryList.value = timeSummary || []
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
    if (tab === ERP_HOME_TAB.SALE) {
      await loadSaleSummary()
    } else {
      await loadPurchaseSummary()
    }
    loadedTabs[tab] = true
  } catch {
    loadedTabs[tab] = false
    loadErrors[tab] = true
  } finally {
    loadingTabs[tab] = false
  }
}

/** 刷新统计 */
function reloadStatistics() {
  loadActiveTab(true)
}

/** 切换分组 */
function handleTabChange({ index }: { index: number }) {
  activeTab.value = index
  loadActiveTab()
}

/** 初始化 */
onMounted(() => {
  loadActiveTab()
})
</script>
