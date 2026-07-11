<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 工作台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="mes-home p-24rpx">
        <view v-if="loading && !loaded" class="rounded-8rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm">
          <wd-loading size="32rpx" />
          <view class="mt-12rpx">
            正在加载生产统计
          </view>
        </view>

        <template v-else>
          <!-- 核心 KPI -->
          <view class="mes-kpi-grid">
            <view
              v-for="item in kpiCards"
              :key="item.key"
              class="border border-[#e5e7eb] rounded-8rpx bg-white p-28rpx shadow-sm"
              @click="handleNavigate(item.url)"
            >
              <view class="flex items-center gap-18rpx">
                <view
                  class="h-76rpx w-76rpx flex shrink-0 items-center justify-center rounded-14rpx"
                  :style="{ background: item.color }"
                >
                  <wd-icon :name="item.icon" size="42rpx" color="#fff" />
                </view>
                <view class="min-w-0 flex-1">
                  <view class="text-26rpx text-[#8c8c8c]">
                    {{ item.label }}
                  </view>
                  <view class="mt-10rpx flex flex-wrap items-baseline gap-8rpx">
                    <text class="text-42rpx font-semibold leading-none" :style="{ color: item.color }">
                      {{ item.value }}
                    </text>
                    <text class="text-24rpx text-[#8c8c8c]">
                      {{ item.unit }}
                    </text>
                  </view>
                  <view class="mt-12rpx flex flex-wrap gap-x-18rpx gap-y-6rpx text-22rpx">
                    <text v-for="subItem in item.subItems" :key="subItem.label" :style="{ color: subItem.color || '#9ca3af' }">
                      {{ subItem.label }}
                    </text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 分组切换 -->
          <wd-tabs v-model="activeTab" class="mt-28rpx">
            <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
          </wd-tabs>

          <!-- 趋势分析 -->
          <view v-if="activeTab === MES_HOME_TAB.TREND" class="mes-tab-grid mt-24rpx">
            <view class="overflow-hidden border border-[#e5e7eb] rounded-8rpx bg-white shadow-sm">
              <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-28rpx py-24rpx">
                <view class="text-30rpx text-[#333] font-semibold">
                  生产趋势
                </view>
                <view class="flex shrink-0 border border-[#dcdfe6] rounded-8rpx bg-white">
                  <view
                    v-for="item in trendDayOptions"
                    :key="item.value"
                    class="h-48rpx min-w-112rpx flex items-center justify-center px-16rpx text-24rpx"
                    :class="trendDays === item.value ? 'bg-[#409eff] text-white' : 'text-[#606266]'"
                    @click="handleTrendDaysChange(item.value)"
                  >
                    {{ item.label }}
                  </view>
                </view>
              </view>
              <view class="p-24rpx">
                <YdChart
                  :option="trendChartOption"
                  :empty="productionTrend.length === 0"
                  height="460rpx"
                />
              </view>
            </view>

            <view class="overflow-hidden border border-[#e5e7eb] rounded-8rpx bg-white shadow-sm">
              <view class="border-b border-b-[#f0f0f0] px-28rpx py-24rpx text-30rpx text-[#333] font-semibold">
                工单状态分布
              </view>
              <view class="p-24rpx">
                <YdChart
                  :option="workOrderChartOption"
                  :empty="workOrderStatus.length === 0"
                  height="520rpx"
                />
              </view>
            </view>
          </view>

          <!-- 待办异常 -->
          <view v-else-if="activeTab === MES_HOME_TAB.ALERT" class="mt-24rpx">
            <view class="overflow-hidden border border-[#e5e7eb] rounded-8rpx bg-white shadow-sm">
              <view class="border-b border-b-[#f0f0f0] px-28rpx py-24rpx text-30rpx text-[#333] font-semibold">
                待办与异常
              </view>
              <view class="px-24rpx py-12rpx">
                <view
                  v-for="item in alertItems"
                  :key="item.key"
                  class="flex items-center gap-20rpx py-24rpx"
                  @click="handleNavigate(item.url)"
                >
                  <view
                    class="h-72rpx w-72rpx flex shrink-0 items-center justify-center rounded-12rpx"
                    :style="{ background: item.bgColor }"
                  >
                    <wd-icon :name="item.icon" size="38rpx" :color="item.color" />
                  </view>
                  <view class="min-w-0 flex-1">
                    <view class="text-28rpx text-[#333] font-medium">
                      {{ item.label }}
                    </view>
                    <view class="line-clamp-1 mt-6rpx text-24rpx text-[#999]">
                      {{ item.desc }}
                    </view>
                  </view>
                  <view v-if="item.count > 0" class="min-w-36rpx rounded-999rpx bg-[#f56c6c] px-10rpx py-2rpx text-center text-22rpx text-white">
                    {{ item.count }}
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 快捷入口 -->
          <view v-else class="mt-24rpx">
            <view class="overflow-hidden border border-[#e5e7eb] rounded-8rpx bg-white shadow-sm">
              <view class="border-b border-b-[#f0f0f0] px-28rpx py-24rpx text-30rpx text-[#333] font-semibold">
                快捷入口
              </view>
              <view v-if="accessibleShortcuts.length > 0" class="mes-shortcut-grid p-32rpx">
                <view
                  v-for="item in accessibleShortcuts"
                  :key="item.key"
                  class="min-h-150rpx flex flex-col items-center justify-center rounded-8rpx"
                  @click="handleNavigate(item.url)"
                >
                  <view
                    class="h-84rpx w-84rpx flex items-center justify-center rounded-14rpx"
                    :style="{ background: item.color }"
                  >
                    <wd-icon :name="item.icon" size="44rpx" color="#fff" />
                  </view>
                  <text class="line-clamp-2 mt-16rpx text-center text-25rpx text-[#606266]">
                    {{ item.title }}
                  </text>
                </view>
              </view>
              <view v-else class="px-24rpx py-48rpx text-center text-26rpx text-[#999]">
                暂无可用入口
              </view>
            </view>
          </view>
        </template>

        <view v-if="loadError" class="mt-24rpx border border-[#fa8c16] rounded-8rpx bg-[#fff7e6] px-24rpx py-16rpx text-24rpx text-[#fa8c16]">
          统计数据加载失败，已保留默认值，模块入口仍可继续使用
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { MesHomeProductionTrend, MesHomeSummary, MesHomeWorkOrderStatus } from '@/api/mes/home'
import { computed, onMounted, ref } from 'vue'
import { getHomeSummary, getProductionTrend, getWorkOrderStatusDistribution } from '@/api/mes/home'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatTrendDate } from '@/utils/date'
import YdChart from '@/pages-statistics/components/yd-chart/yd-chart.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const summary = ref<MesHomeSummary>({
  workOrderActiveCount: 0,
  workOrderPrepareCount: 0,
  workOrderFinishedCount: 0,
  todayOutput: 0,
  yesterdayOutput: 0,
  todayQualifiedQuantity: 0,
  todayUnqualifiedQuantity: 0,
  machineryTotal: 0,
  machineryProducing: 0,
  machineryStop: 0,
  machineryMaintenance: 0,
  andonActiveCount: 0,
  repairActiveCount: 0,
}) // 汇总数据
const MES_HOME_TAB = {
  TREND: 0,
  ALERT: 1,
  SHORTCUT: 2,
} as const
const tabs = [ // 分组配置
  { key: MES_HOME_TAB.TREND, title: '趋势分析' },
  { key: MES_HOME_TAB.ALERT, title: '待办异常' },
  { key: MES_HOME_TAB.SHORTCUT, title: '快捷入口' },
]
const activeTab = ref<number>(MES_HOME_TAB.TREND) // 当前分组
const loading = ref(false) // 汇总加载状态
const loaded = ref(false) // 是否已完成首次加载
const loadError = ref(false) // 汇总加载失败状态
const productionTrend = ref<MesHomeProductionTrend[]>([]) // 生产趋势
const workOrderStatus = ref<MesHomeWorkOrderStatus[]>([]) // 工单状态分布
const trendDayOptions = [ // 趋势统计周期
  { value: 7, label: '近 7 天' },
  { value: 30, label: '近 30 天' },
]
const trendDays = ref(7) // 当前趋势周期
const { hasAccessByCodes } = useAccess()

interface MesHomeKpiCard {
  key: string
  label: string
  value: number | string
  unit: string
  icon: string
  color: string
  url: string
  subItems: Array<{
    label: string
    color?: string
  }>
}

interface MesHomeShortcut {
  key: string
  title: string
  url: string
  icon: string
  color: string
  permission: string
}

const hasQualityData = computed(() => { // 是否有质量数据
  return summary.value.todayQualifiedQuantity + summary.value.todayUnqualifiedQuantity > 0
})
const qualityRateText = computed(() => { // 质量合格率
  const total = summary.value.todayQualifiedQuantity + summary.value.todayUnqualifiedQuantity
  if (total <= 0) {
    return '0.0'
  }
  return ((summary.value.todayQualifiedQuantity / total) * 100).toFixed(1)
})
const kpiCards = computed<MesHomeKpiCard[]>(() => [ // 生产总览指标
  {
    key: 'workOrder',
    label: '生产工单',
    value: summary.value.workOrderActiveCount,
    unit: '进行中',
    icon: 'settings',
    color: '#409eff',
    url: '/pages-mes/pro/workorder/index',
    subItems: [
      { label: `待排产 ${summary.value.workOrderPrepareCount}` },
      { label: `已完成 ${summary.value.workOrderFinishedCount}` },
    ],
  },
  {
    key: 'output',
    label: '今日产量',
    value: summary.value.todayOutput,
    unit: '件',
    icon: 'folder',
    color: '#67c23a',
    url: '/pages-mes/pro/feedback/index',
    subItems: [
      { label: `昨日 ${summary.value.yesterdayOutput} 件` },
    ],
  },
  {
    key: 'quality',
    label: '质量合格率',
    value: qualityRateText.value,
    unit: '%',
    icon: 'check-circle',
    color: '#e6a23c',
    url: '/pages-mes/pro/feedback/index',
    subItems: hasQualityData.value
      ? [
          { label: `合格 ${summary.value.todayQualifiedQuantity}`, color: '#67c23a' },
          { label: `不良 ${summary.value.todayUnqualifiedQuantity}`, color: '#f56c6c' },
        ]
      : [{ label: '暂无数据' }],
  },
  {
    key: 'machinery',
    label: '设备状态',
    value: summary.value.machineryProducing,
    unit: `/ ${summary.value.machineryTotal} 运行中`,
    icon: 'settings',
    color: '#7c3aed',
    url: '/pages-mes/dv/machinery/index',
    subItems: [
      { label: `停机 ${summary.value.machineryStop}`, color: '#f56c6c' },
      { label: `维护 ${summary.value.machineryMaintenance}`, color: '#e6a23c' },
    ],
  },
])
const alertItems = computed(() => [ // 待办与异常
  {
    key: 'andon',
    label: '安灯报警',
    desc: '未处置的安灯呼叫',
    count: summary.value.andonActiveCount,
    url: '/pages-mes/pro/andon/record/index',
    permission: 'mes:pro-andon-record:query',
    icon: 'settings',
    color: '#f56c6c',
    bgColor: '#fff1f0',
  },
  {
    key: 'repair',
    label: '设备维修',
    desc: '待处理的维修工单',
    count: summary.value.repairActiveCount,
    url: '/pages-mes/dv/repair/index',
    permission: 'mes:dv-repair:query',
    icon: 'settings',
    color: '#e6a23c',
    bgColor: '#fff7e6',
  },
  {
    key: 'workOrderPrepare',
    label: '待排产工单',
    desc: '草稿状态的生产工单',
    count: summary.value.workOrderPrepareCount,
    url: '/pages-mes/pro/workorder/index',
    permission: 'mes:pro-work-order:query',
    icon: 'apps',
    color: '#409eff',
    bgColor: '#ecf5ff',
  },
].filter(item => hasAccessByCodes([item.permission])))
const trendChartOption = computed(() => ({ // 生产趋势图表
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
  },
  legend: {
    data: ['产量', '合格品', '不良品'],
    bottom: 0,
  },
  grid: {
    left: 48,
    right: 24,
    top: 32,
    bottom: 56,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: productionTrend.value.map(item => formatTrendDate(item.date)),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: '产量',
      type: 'line',
      smooth: true,
      data: productionTrend.value.map(item => item.quantity),
      itemStyle: { color: '#409eff' },
      areaStyle: { color: 'rgba(64, 158, 255, 0.12)' },
    },
    {
      name: '合格品',
      type: 'line',
      smooth: true,
      data: productionTrend.value.map(item => item.qualifiedQuantity),
      itemStyle: { color: '#67c23a' },
    },
    {
      name: '不良品',
      type: 'line',
      smooth: true,
      data: productionTrend.value.map(item => item.unqualifiedQuantity),
      itemStyle: { color: '#f56c6c' },
    },
  ],
}))
const workOrderChartOption = computed(() => ({ // 工单状态分布图表
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: '#fff',
        borderRadius: 6,
        borderWidth: 2,
      },
      label: { formatter: '{b}\\n{c}' },
      data: workOrderStatus.value.map(item => ({
        name: item.statusName,
        value: item.count,
        itemStyle: { color: getWorkOrderStatusColor(item.status) },
      })),
    },
  ],
}))
const shortcuts: MesHomeShortcut[] = [ // 快捷入口
  {
    key: 'workOrder',
    title: '生产工单',
    url: '/pages-mes/pro/workorder/index',
    icon: 'settings',
    color: '#409eff',
    permission: 'mes:pro-work-order:query',
  },
  {
    key: 'feedback',
    title: '生产报工',
    url: '/pages-mes/pro/feedback/index',
    icon: 'settings',
    color: '#67c23a',
    permission: 'mes:pro-feedback:query',
  },
  {
    key: 'quality',
    title: '质量检验',
    url: '/pages-mes/qc/iqc/index',
    icon: 'search-line',
    color: '#e6a23c',
    permission: 'mes:qc-iqc:query',
  },
  {
    key: 'stock',
    title: '库存查询',
    url: '/pages-mes/wm/materialstock/index',
    icon: 'folder',
    color: '#f56c6c',
    permission: 'mes:wm-material-stock:query',
  },
  {
    key: 'machinery',
    title: '设备管理',
    url: '/pages-mes/dv/machinery/index',
    icon: 'settings',
    color: '#7c3aed',
    permission: 'mes:dv-machinery:query',
  },
  {
    key: 'task',
    title: '生产任务',
    url: '/pages-mes/pro/task/index',
    icon: 'list',
    color: '#0ea5e9',
    permission: 'mes:pro-task:query',
  },
  {
    key: 'arrivalNotice',
    title: '到货通知',
    url: '/pages-mes/wm/arrivalnotice/index',
    icon: 'folder',
    color: '#14b8a6',
    permission: 'mes:wm-arrival-notice:query',
  },
  {
    key: 'repair',
    title: '设备维修',
    url: '/pages-mes/dv/repair/index',
    icon: 'settings',
    color: '#f59e0b',
    permission: 'mes:dv-repair:query',
  },
  {
    key: 'card',
    title: '流转卡',
    url: '/pages-mes/pro/card/index',
    icon: 'list',
    color: '#ec4899',
    permission: 'mes:pro-card:query',
  },
]
const accessibleShortcuts = computed(() => {
  return shortcuts.filter(item => hasAccessByCodes([item.permission]))
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 页面跳转 */
function handleNavigate(url: string) {
  uni.navigateTo({ url })
}

/** 获取工单状态颜色 */
function getWorkOrderStatusColor(status: number) {
  if (status === 0) {
    return '#909399'
  }
  if (status === 1) {
    return '#409eff'
  }
  if (status === 2) {
    return '#67c23a'
  }
  if (status === 3) {
    return '#f56c6c'
  }
  return '#409eff'
}

/** 切换趋势周期 */
async function handleTrendDaysChange(days: number) {
  if (trendDays.value === days || loading.value) {
    return
  }
  trendDays.value = days
  loadError.value = false
  try {
    productionTrend.value = await getProductionTrend(days) || []
  } catch {
    loadError.value = true
  }
}

/** 刷新汇总统计 */
async function reloadSummary() {
  if (loading.value) {
    return
  }
  loading.value = true
  loadError.value = false
  try {
    const [summaryData, trendData, statusData] = await Promise.all([
      getHomeSummary(),
      getProductionTrend(trendDays.value),
      getWorkOrderStatusDistribution(),
    ])
    summary.value = summaryData
    productionTrend.value = trendData || []
    workOrderStatus.value = statusData || []
  } catch {
    loadError.value = true
  } finally {
    loaded.value = true
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  reloadSummary()
})
</script>

<style lang="scss" scoped>
.mes-kpi-grid,
.mes-tab-grid,
.mes-shortcut-grid {
  display: grid;
  gap: 24rpx;
}

.mes-kpi-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mes-tab-grid {
  grid-template-columns: 1fr;
}

.mes-shortcut-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media screen and (min-width: 768px) {
  .mes-tab-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
