<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="IM 统计"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 统计概览 -->
      <view class="p-24rpx pb-0">
        <view class="grid grid-cols-2 gap-20rpx">
          <view
            v-for="card in overviewCards"
            :key="card.label"
            class="rounded-16rpx bg-white p-24rpx shadow-sm"
          >
            <view class="flex items-center gap-16rpx">
              <view
                class="h-76rpx w-76rpx flex flex-shrink-0 items-center justify-center rounded-16rpx"
                :style="{ background: card.gradient }"
              >
                <wd-icon :name="card.icon" size="38rpx" color="#fff" />
              </view>
              <view class="min-w-0 flex-1">
                <view class="truncate text-24rpx text-[#888]">
                  {{ card.label }}
                </view>
                <view class="mt-6rpx text-40rpx text-[#333] font-semibold leading-none">
                  {{ card.value }}
                </view>
              </view>
            </view>
            <view class="mt-16rpx flex items-center text-22rpx text-[#999]">
              <text>{{ card.metaLabel }}</text>
              <text class="ml-8rpx font-medium" :class="card.metaClass">{{ card.metaValue }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 维度切换 -->
      <view class="mt-24rpx bg-white">
        <wd-tabs v-model="tabIndex" slidable="always">
          <wd-tab v-for="tab in TABS" :key="tab.key" :title="tab.title" />
        </wd-tabs>
      </view>

      <view class="p-24rpx">
        <!-- 消息维度 -->
        <template v-if="activeTab === 'message'">
          <!-- 消息趋势（私聊 + 群聊，支持 7 / 15 / 30 天切换） -->
          <view class="mb-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
            <view class="mb-20rpx flex items-center justify-between">
              <view class="flex items-baseline">
                <text class="text-30rpx text-[#333] font-semibold">消息趋势</text>
                <text class="ml-12rpx text-22rpx text-[#999]">私聊 + 群聊</text>
              </view>
              <view class="flex items-center gap-8rpx">
                <view
                  v-for="opt in DAY_OPTIONS"
                  :key="opt"
                  class="rounded-full px-16rpx py-6rpx text-22rpx"
                  :class="messageDays === opt ? 'bg-[#1677ff] text-white' : 'bg-[#f0f2f5] text-[#666]'"
                  @click="changeMessageDays(opt)"
                >
                  {{ opt }}天
                </view>
              </view>
            </view>
            <YdChart :option="messageTrendOption" :loading="loading.messageTrend" :empty="!messageTrend.dates.length" height="460rpx" />
          </view>

          <!-- 内容类型分布 -->
          <view class="mb-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
            <view class="mb-20rpx flex items-baseline">
              <text class="text-30rpx text-[#333] font-semibold">内容类型分布</text>
              <text class="ml-12rpx text-22rpx text-[#999]">近 30 天</text>
            </view>
            <YdChart :option="messageTypeOption" :loading="loading.messageType" :empty="!messageTypes.length" height="440rpx" />
          </view>

          <!-- 消息发送 TOP 10 -->
          <view class="mb-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
            <view class="mb-20rpx flex items-baseline">
              <text class="text-30rpx text-[#333] font-semibold">消息发送 TOP 10</text>
              <text class="ml-12rpx text-22rpx text-[#999]">近 30 天</text>
            </view>
            <YdChart :option="topSenderOption" :loading="loading.topSender" :empty="!topSenders.length" height="520rpx" />
          </view>
        </template>

        <!-- 用户维度 -->
        <template v-else-if="activeTab === 'user'">
          <!-- 用户趋势（新增注册 + 日活，支持 7 / 15 / 30 天切换） -->
          <view class="mb-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
            <view class="mb-20rpx flex items-center justify-between">
              <view class="flex items-baseline">
                <text class="text-30rpx text-[#333] font-semibold">用户趋势</text>
                <text class="ml-12rpx text-22rpx text-[#999]">新增注册 + 日活</text>
              </view>
              <view class="flex items-center gap-8rpx">
                <view
                  v-for="opt in DAY_OPTIONS"
                  :key="opt"
                  class="rounded-full px-16rpx py-6rpx text-22rpx"
                  :class="userDays === opt ? 'bg-[#1677ff] text-white' : 'bg-[#f0f2f5] text-[#666]'"
                  @click="changeUserDays(opt)"
                >
                  {{ opt }}天
                </view>
              </view>
            </view>
            <YdChart :option="userTrendOption" :loading="loading.userTrend" :empty="!userTrend.dates.length" height="460rpx" />
          </view>
        </template>

        <!-- 群组维度 -->
        <template v-else>
          <!-- 群规模分布 -->
          <view class="mb-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
            <view class="mb-20rpx flex items-baseline">
              <text class="text-30rpx text-[#333] font-semibold">群规模分布</text>
              <text class="ml-12rpx text-22rpx text-[#999]">按成员数区间</text>
            </view>
            <YdChart :option="groupSizeOption" :loading="loading.groupSize" :empty="!groupSizes.length" height="460rpx" />
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type {
  ImStatisticsGroupSizeVO,
  ImStatisticsMessageTypeVO,
  ImStatisticsOverviewVO,
  ImStatisticsTopSenderVO,
  ImStatisticsTrendVO,
} from '@/api/im/manager/statistics'
import { onShow } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import {
  getGroupSizeDistribution,
  getMessageTrend,
  getMessageTypeDistribution,
  getStatisticsOverview,
  getTopSenders,
  getUserTrend,
} from '@/api/im/manager/statistics'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import YdChart from '../components/yd-chart/yd-chart.vue'

const TABS = [
  { key: 'message', title: '消息' },
  { key: 'user', title: '用户' },
  { key: 'group', title: '群组' },
] as const

const DAY_OPTIONS = [7, 15, 30] // 趋势可选天数
const CHART_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#faad14', '#f5222d', '#2f54eb'] // 图表配色

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabIndex = ref(0) // 当前维度下标
const messageDays = ref(7) // 消息趋势天数
const userDays = ref(7) // 用户趋势天数
const overview = ref<ImStatisticsOverviewVO>() // 统计概览
const messageTrend = ref<ImStatisticsTrendVO>({ dates: [], series: {} }) // 消息趋势
const userTrend = ref<ImStatisticsTrendVO>({ dates: [], series: {} }) // 用户趋势
const messageTypes = ref<ImStatisticsMessageTypeVO[]>([]) // 内容类型分布
const groupSizes = ref<ImStatisticsGroupSizeVO[]>([]) // 群规模分布
const topSenders = ref<ImStatisticsTopSenderVO[]>([]) // 消息 TOP 发送者
const loading = reactive({ // 各图表加载状态
  messageTrend: false,
  userTrend: false,
  messageType: false,
  topSender: false,
  groupSize: false,
})

const activeTab = computed(() => TABS[tabIndex.value].key)

/** 计算环比 */
function calcRatio(today: number, yesterday: number) {
  if (!yesterday) {
    return { label: '无昨日数据', cls: 'text-[#bbb]' }
  }
  const diff = ((today - yesterday) / yesterday) * 100
  return {
    label: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
    cls: diff >= 0 ? 'text-[#52c41a]' : 'text-[#f5222d]',
  }
}

const overviewCards = computed(() => { // 概览卡片（对标 vue3 + ep：图标 + 数值 + 子指标）
  const o = overview.value
  const msgToday = (o?.privateMessageToday ?? 0) + (o?.groupMessageToday ?? 0)
  const msgYesterday = (o?.privateMessageYesterday ?? 0) + (o?.groupMessageYesterday ?? 0)
  const ratio = calcRatio(msgToday, msgYesterday)
  return [
    {
      label: '总用户',
      value: o?.totalUser ?? '-',
      icon: 'user',
      gradient: 'linear-gradient(135deg, #5b9cff, #409eff)',
      metaLabel: '今日新增',
      metaValue: `+${o?.newUserToday ?? 0}`,
      metaClass: 'text-[#52c41a]',
    },
    {
      label: '总群组',
      value: o?.totalGroup ?? '-',
      icon: 'user-group',
      gradient: 'linear-gradient(135deg, #5bd6a0, #52c41a)',
      metaLabel: '今日新增',
      metaValue: `+${o?.newGroupToday ?? 0}`,
      metaClass: 'text-[#52c41a]',
    },
    {
      label: '日活用户',
      value: o?.activeUserDaily ?? '-',
      icon: 'clock-circle',
      gradient: 'linear-gradient(135deg, #ffc46b, #fa8c16)',
      metaLabel: '周 / 月活',
      metaValue: `${o?.activeUserWeekly ?? 0} / ${o?.activeUserMonthly ?? 0}`,
      metaClass: 'text-[#999]',
    },
    {
      label: '今日消息',
      value: msgToday,
      icon: 'message',
      gradient: 'linear-gradient(135deg, #b794f6, #722ed1)',
      metaLabel: '环比昨日',
      metaValue: ratio.label,
      metaClass: ratio.cls,
    },
  ]
})

/** 构建趋势双线图配置（日期为后端毫秒时间戳，统一 formatDate 成 MM-DD） */
function buildTrendOption(trend: ImStatisticsTrendVO, series: { name: string, key: string, color: string }[]) {
  const dates = (trend.dates || []).map(date => formatDate(date, 'MM-DD'))
  return {
    color: series.map(item => item.color),
    tooltip: { trigger: 'axis', confine: true },
    legend: { top: 0, data: series.map(item => item.name), textStyle: { color: '#666', fontSize: 11 } },
    grid: { left: 12, right: 16, top: 48, bottom: 16, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: { color: '#999', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#999', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: series.map(item => ({
      name: item.name,
      type: 'line',
      smooth: true,
      showSymbol: false,
      areaStyle: { opacity: 0.12 },
      data: (trend.series?.[item.key] || []).map(value => Number(value || 0)),
    })),
  }
}

const messageTrendOption = computed(() => buildTrendOption(messageTrend.value, [
  { name: '私聊消息', key: 'private', color: '#1677ff' },
  { name: '群聊消息', key: 'group', color: '#52c41a' },
]))

const userTrendOption = computed(() => { // 用户趋势：新增注册（柱）+ 日活（线）双 Y 轴
  const trend = userTrend.value
  const dates = (trend.dates || []).map(date => formatDate(date, 'MM-DD'))
  return {
    color: ['#fa8c16', '#f5222d'],
    tooltip: { trigger: 'axis', confine: true },
    legend: { top: 0, data: ['新增注册', '日活'], textStyle: { color: '#666', fontSize: 11 } },
    grid: { left: 12, right: 16, top: 48, bottom: 16, containLabel: true },
    xAxis: { type: 'category', data: dates, axisLabel: { color: '#999', fontSize: 10 }, axisTick: { show: false } },
    yAxis: [
      { type: 'value', axisLabel: { color: '#999', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
      { type: 'value', axisLabel: { color: '#999', fontSize: 10 }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '新增注册',
        type: 'bar',
        yAxisIndex: 0,
        barMaxWidth: 18,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: (trend.series?.register || []).map(value => Number(value || 0)),
      },
      {
        name: '日活',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        data: (trend.series?.active || []).map(value => Number(value || 0)),
      },
    ],
  }
})

const messageTypeOption = computed(() => ({ // 内容类型分布（type 按字典翻译为名称）
  color: CHART_COLORS,
  tooltip: { trigger: 'item', confine: true, formatter: '{b}: {c} ({d}%)' },
  legend: { bottom: 0, type: 'scroll', textStyle: { color: '#666', fontSize: 11 } },
  series: [
    {
      name: '内容类型',
      type: 'pie',
      radius: ['38%', '64%'],
      center: ['50%', '42%'],
      label: { show: true, formatter: '{b}\n{d}%', color: '#666', fontSize: 10 },
      data: messageTypes.value.map(item => ({
        name: getDictLabel(DICT_TYPE.IM_CONTENT_TYPE, item.type) || `类型 ${item.type}`,
        value: Number(item.value || 0),
      })),
    },
  ],
}))

const groupSizeOption = computed(() => ({ // 群规模分布
  color: ['#52c41a'],
  tooltip: { trigger: 'axis', confine: true },
  grid: { left: 12, right: 16, top: 24, bottom: 12, containLabel: true },
  xAxis: { type: 'category', data: groupSizes.value.map(item => item.range), axisLabel: { color: '#999', fontSize: 10 }, axisTick: { show: false } },
  yAxis: { type: 'value', axisLabel: { color: '#999', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
  series: [
    {
      name: '群组数',
      type: 'bar',
      barMaxWidth: 48,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: groupSizes.value.map(item => Number(item.count || 0)),
    },
  ],
}))

const topSenderOption = computed(() => { // 消息发送 TOP（横向条形，从下到上排名）
  const sorted = [...topSenders.value].sort((a, b) => a.messageCount - b.messageCount)
  return {
    color: ['#1677ff'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, confine: true },
    grid: { left: 12, right: 24, top: 12, bottom: 8, containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#999', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
    yAxis: {
      type: 'category',
      data: sorted.map(item => item.nickname || `用户 ${item.userId}`),
      axisLabel: { color: '#666', fontSize: 10 },
      axisTick: { show: false },
    },
    series: [
      {
        name: '消息数',
        type: 'bar',
        barMaxWidth: 18,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        data: sorted.map(item => Number(item.messageCount || 0)),
      },
    ],
  }
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载概览 */
async function loadOverview() {
  overview.value = await getStatisticsOverview()
}

/** 加载消息趋势 */
async function loadMessageTrend() {
  loading.messageTrend = true
  try {
    messageTrend.value = await getMessageTrend(messageDays.value)
  } finally {
    loading.messageTrend = false
  }
}

/** 加载用户趋势 */
async function loadUserTrend() {
  loading.userTrend = true
  try {
    userTrend.value = await getUserTrend(userDays.value)
  } finally {
    loading.userTrend = false
  }
}

/** 加载内容类型分布 */
async function loadMessageType() {
  loading.messageType = true
  try {
    messageTypes.value = await getMessageTypeDistribution()
  } finally {
    loading.messageType = false
  }
}

/** 加载消息 TOP 发送者 */
async function loadTopSender() {
  loading.topSender = true
  try {
    topSenders.value = (await getTopSenders()).slice(0, 10)
  } finally {
    loading.topSender = false
  }
}

/** 加载群规模分布 */
async function loadGroupSize() {
  loading.groupSize = true
  try {
    groupSizes.value = await getGroupSizeDistribution()
  } finally {
    loading.groupSize = false
  }
}

/** 切换消息趋势天数 */
function changeMessageDays(days: number) {
  if (messageDays.value === days) {
    return
  }
  messageDays.value = days
  loadMessageTrend()
}

/** 切换用户趋势天数 */
function changeUserDays(days: number) {
  if (userDays.value === days) {
    return
  }
  userDays.value = days
  loadUserTrend()
}

/** 加载全部统计 */
function loadData() {
  loadOverview()
  loadMessageTrend()
  loadUserTrend()
  loadMessageType()
  loadTopSender()
  loadGroupSize()
}

onShow(() => {
  loadData()
})
</script>
