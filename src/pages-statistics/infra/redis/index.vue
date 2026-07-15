<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <!-- #ifndef MP-WEIXIN -->
    <wd-navbar
      title="Redis 监控"
      right-text="刷新"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
      @click-right="loadData"
    />
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <wd-navbar title="Redis 监控" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-26rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon name="refresh" size="40rpx" color="#333" @click="loadData" />
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->

    <scroll-view class="min-h-0 flex-1" scroll-y>
      <!-- 概览卡片 -->
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
                :style="{ background: card.bg }"
              >
                <wd-icon :name="card.icon" size="38rpx" :color="card.color" />
              </view>
              <view class="min-w-0 flex-1">
                <view class="truncate text-24rpx text-[#888]">
                  {{ card.label }}
                </view>
                <view class="mt-6rpx truncate text-40rpx text-[#333] font-semibold leading-none">
                  {{ card.value }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 维度切换 -->
      <view class="mt-24rpx bg-white">
        <wd-tabs v-model="tabIndex">
          <wd-tab v-for="tab in TABS" :key="tab.key" :title="tab.title" />
        </wd-tabs>
      </view>

      <view class="p-24rpx">
        <!-- 内存 -->
        <template v-if="activeTab === 'memory'">
          <Card title="内存使用率">
            <YdChart :option="memoryOption" :loading="loading" :empty="!monitor" height="300rpx" />
            <view class="grid grid-cols-3 mt-12rpx gap-16rpx border-t border-[#f5f5f5] pt-24rpx text-center">
              <view v-for="stat in memoryStats" :key="stat.label">
                <view class="text-24rpx text-[#999]">
                  {{ stat.label }}
                </view>
                <view class="mt-8rpx text-30rpx text-[#333] font-semibold">
                  {{ stat.value }}
                </view>
              </view>
            </view>
          </Card>
        </template>

        <!-- 命令统计 -->
        <template v-else-if="activeTab === 'command'">
          <Card title="命令统计">
            <template #extra>
              <wd-tag type="primary" variant="plain">
                共 {{ commandStats.length }} 类
              </wd-tag>
            </template>
            <YdChart :option="commandOption" :loading="loading" :empty="!commandStats.length" height="460rpx" />
          </Card>
          <Card v-if="topCommands.length" title="命令调用 TOP 10" class="mt-24rpx">
            <view
              v-for="item in topCommands"
              :key="item.command"
              class="border-t border-[#f5f5f5] py-16rpx first:border-t-0"
            >
              <view class="mb-8rpx flex items-center justify-between text-28rpx">
                <text class="text-[#333]">{{ item.command }}</text>
                <text class="text-[#999]">{{ item.calls }}</text>
              </view>
              <view class="h-8rpx overflow-hidden rounded-full bg-[#f0f2f5]">
                <view class="h-full rounded-full bg-[#1677ff]" :style="{ width: `${item.percent}%` }" />
              </view>
            </view>
          </Card>
        </template>

        <!-- 基本信息 -->
        <template v-else>
          <Card title="基本信息">
            <view
              v-for="item in infoItems"
              :key="item.label"
              class="flex items-center justify-between border-t border-[#f5f5f5] py-20rpx first:border-t-0"
            >
              <text class="shrink-0 text-26rpx text-[#999]">{{ item.label }}</text>
              <text class="ml-24rpx min-w-0 flex-1 truncate text-right text-28rpx text-[#333]">{{ item.value }}</text>
            </view>
          </Card>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { RedisMonitorInfo } from '@/api/infra/redis'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getRedisMonitorInfo } from '@/api/infra/redis'
import { navigateBackPlus } from '@/utils'
import Card from '../../components/card/card.vue'
import YdChart from '../../components/yd-chart/yd-chart.vue'

const CHART_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#faad14', '#f5222d', '#2f54eb', '#a0d911', '#bfbfbf'] // 图表配色
const TABS = [
  { key: 'memory', title: '内存' },
  { key: 'command', title: '命令统计' },
  { key: 'info', title: '基本信息' },
] as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const loading = ref(false) // 加载状态
const monitor = ref<RedisMonitorInfo>() // 监控信息
const tabIndex = ref(0) // 当前 tab 下标

const activeTab = computed(() => TABS[tabIndex.value].key) // 当前 tab
const info = computed(() => monitor.value?.info ?? {} as Record<string, string>) // Redis info 指标
const commandStats = computed(() => monitor.value?.commandStats ?? []) // 命令统计

const overviewCards = computed(() => [ // 概览卡片（淡色底 + 同色图标）
  {
    label: '客户端数',
    value: info.value.connected_clients ?? '-',
    icon: 'user',
    color: '#1677ff',
    bg: '#eaf2ff',
  },
  {
    label: 'Key 数量',
    value: monitor.value?.dbSize ?? '-',
    icon: 'folder',
    color: '#52c41a',
    bg: '#e8f8ee',
  },
  {
    label: '每秒指令',
    value: info.value.instantaneous_ops_per_sec ?? '-',
    icon: 'settings',
    color: '#fa8c16',
    bg: '#fff3e6',
  },
  {
    label: '运行天数',
    value: info.value.uptime_in_days ?? '-',
    icon: 'clock-circle',
    color: '#722ed1',
    bg: '#f3ecfd',
  },
])

const memoryStats = computed(() => { // 内存三项明细
  const i = info.value
  return [
    { label: '已用', value: i.used_memory_human ?? '-' },
    { label: '峰值', value: i.used_memory_peak_human ?? '-' },
    { label: '上限', value: !i.maxmemory || i.maxmemory === '0' ? '不限制' : i.maxmemory_human },
  ]
})

const infoItems = computed(() => { // 基本信息明细
  const i = info.value
  return [
    { label: 'Redis 版本', value: i.redis_version ?? '-' },
    { label: '运行模式', value: i.redis_mode === 'standalone' ? '单机' : (i.redis_mode ? '集群' : '-') },
    { label: '端口', value: i.tcp_port ?? '-' },
    { label: '使用 CPU', value: i.used_cpu_user_children ? Number.parseFloat(i.used_cpu_user_children).toFixed(2) : '-' },
    { label: 'AOF 是否开启', value: i.aof_enabled === '0' ? '否' : (i.aof_enabled ? '是' : '-') },
    { label: 'RDB 是否成功', value: i.rdb_last_bgsave_status ?? '-' },
    { label: '网络入口/出口', value: i.instantaneous_input_kbps != null ? `${i.instantaneous_input_kbps}kps / ${i.instantaneous_output_kbps}kps` : '-' },
  ]
})

const memoryOption = computed(() => { // 内存使用率仪表盘（占配置内存；无上限则占系统内存）
  const i = info.value
  const used = Number(i.used_memory || 0)
  const max = Number(i.maxmemory || 0)
  const total = Number(i.total_system_memory || 0)
  const denom = max > 0 ? max : total
  const percent = denom > 0 ? Math.min(100, (used / denom) * 100) : 0
  return {
    series: [
      {
        type: 'gauge',
        min: 0,
        max: 100,
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '82%'],
        radius: '135%',
        progress: { show: true, width: 16, roundCap: true, itemStyle: { color: '#1677ff' } },
        axisLine: { lineStyle: { width: 16, color: [[1, '#eef1f6']] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: false },
        detail: {
          offsetCenter: [0, '-38%'],
          fontSize: 40,
          fontWeight: 'bold',
          color: '#333',
          formatter: '{value}%',
        },
        data: [{ value: Number(percent.toFixed(1)) }],
      },
    ],
  }
})

const commandOption = computed(() => { // 命令统计饼图（TOP 10 + 其他）
  const stats = [...commandStats.value].sort((a, b) => b.calls - a.calls)
  const TOP = 10
  const data = stats.slice(0, TOP).map(item => ({ name: item.command, value: item.calls }))
  const restCalls = stats.slice(TOP).reduce((sum, item) => sum + item.calls, 0)
  if (restCalls > 0) {
    data.push({ name: '其他', value: restCalls })
  }
  return {
    color: CHART_COLORS,
    tooltip: { trigger: 'item', confine: true, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll', textStyle: { color: '#666', fontSize: 11 } },
    series: [
      {
        name: '命令调用',
        type: 'pie',
        radius: ['38%', '64%'],
        center: ['50%', '42%'],
        label: { show: true, formatter: '{b}\n{d}%', color: '#666', fontSize: 10 },
        data,
      },
    ],
  }
})

const topCommands = computed(() => { // 命令调用 TOP 10（带占比条）
  const stats = [...commandStats.value].sort((a, b) => b.calls - a.calls).slice(0, 10)
  const maxCalls = stats[0]?.calls || 1
  return stats.map(item => ({
    command: item.command,
    calls: item.calls,
    percent: Math.max(2, Math.round((item.calls / maxCalls) * 100)),
  }))
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载监控信息 */
async function loadData() {
  // 仅首次显 loading，后续静默刷新，避免图表反复隐藏闪烁
  if (!monitor.value) {
    loading.value = true
  }
  try {
    monitor.value = await getRedisMonitorInfo()
  } finally {
    loading.value = false
  }
}

onShow(() => {
  loadData()
})
</script>
