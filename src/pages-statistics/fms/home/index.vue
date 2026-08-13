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
      <AccountSetGuide />
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
// TODO @AI：不做连续的 metricRequestSequence 校验；
let metricRequestSequence = 0 // 指标明细请求序号，连点指标卡或切换账套时丢弃旧响应

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
  metricRequestSequence++ // 账套切换，作废进行中的指标明细请求
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
  const sequence = ++metricRequestSequence
  selectedMetricKey.value = metric.key
  metricDetail.value = undefined
  metricLoading.value = true
  try {
    const data = await getFmsHomeMetricDetail(accountSetId, metric.key)
    if (sequence !== metricRequestSequence) {
      return // 已有更新的选择或账套已切换，丢弃旧响应
    }
    metricDetail.value = data
  } finally {
    if (sequence === metricRequestSequence) {
      metricLoading.value = false
    }
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  getHome()
})
</script>
