<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="财务首页"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="hasAccessByCodes(['fms:home:query'])">
      <template v-if="fmsStore.accountSet">
        <!-- 账套切换 -->
        <view class="p-24rpx pb-0">
          <AccountSetSwitch @change="getHome" />
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view class="p-24rpx space-y-24rpx">
            <!-- 常用功能 -->
            <HomeShortcuts />

            <!-- 加载状态 -->
            <view
              v-if="loading && !home"
              class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm"
            >
              <wd-loading size="32rpx" />
              <view class="mt-12rpx">
                正在加载首页数据
              </view>
            </view>

            <template v-else>
              <!-- 财务指标卡片 -->
              <MetricCards
                :home="home"
                :selected-metric-key="selectedMetricKey"
                @select="selectMetric"
              />

              <!-- 指标图表 -->
              <MetricCharts
                :home="home"
                :metric-detail="metricDetail"
                :selected-metric-key="selectedMetricKey"
                :loading="metricLoading"
              />
            </template>
          </view>
          <view class="h-40rpx" />
        </scroll-view>
      </template>

      <!-- 无可用账套引导 -->
      <AccountSetGuide v-else-if="fmsStore.accountSetListLoaded" />
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { FmsHome, FmsHomeMetric, FmsHomeMetricDetail } from '@/api/fms/home'
import { getFmsHome, getFmsHomeMetricDetail } from '@/api/fms/home'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { navigateBackPlus } from '@/utils'
import HomeShortcuts from './components/home-shortcuts.vue'
import MetricCards from './components/metric-cards.vue'
import MetricCharts from './components/metric-charts.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()

const loading = ref(false) // 首页加载状态
const metricLoading = ref(false) // 指标明细加载状态
const home = ref<FmsHome>() // 首页数据
const metricDetail = ref<FmsHomeMetricDetail>() // 指标明细
const selectedMetricKey = ref<string>() // 选中的指标标识

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载首页数据 */
async function getHome() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  home.value = undefined
  metricDetail.value = undefined
  selectedMetricKey.value = undefined
  loading.value = true
  try {
    const data = await getFmsHome(accountSetId)
    home.value = data
    // 默认选中第一个指标，加载其趋势与结构明细
    const firstMetric = data.metrics[0]
    if (firstMetric) {
      await selectMetric(firstMetric)
    }
  } finally {
    loading.value = false
  }
}

/** 选择财务指标 */
async function selectMetric(metric: FmsHomeMetric) {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  selectedMetricKey.value = metric.key
  metricDetail.value = undefined
  metricLoading.value = true
  try {
    metricDetail.value = await getFmsHomeMetricDetail(accountSetId, metric.key)
  } finally {
    metricLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  getHome()
})
</script>
