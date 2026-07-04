<template>
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <!-- 标题 -->
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <text class="text-30rpx text-[#333] font-semibold">{{ title }}</text>
      <text v-if="totalText" class="text-24rpx text-[#999]">合计 {{ totalText }}</text>
    </view>

    <!-- 折线图 -->
    <YdChart :option="chartOption" :empty="value.length === 0" height="420rpx" />
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import YdChart from '@/pages-statistics/components/yd-chart/yd-chart.vue'
import { formatStatisticsAmount, formatStatisticsTimeLabel } from '@/pages-statistics/utils/statistics'
import { toNumber } from '@/utils/format'

export interface TimeSummaryItem {
  time: string // 时间
  price?: number // 金额
}

const props = withDefaults(defineProps<{
  title: string // 标题
  value?: TimeSummaryItem[] // 时段统计数据
  color?: string // 图表颜色
  prefix?: string // 金额前缀
}>(), {
  value: () => [],
  color: '#1677ff',
  prefix: '￥',
})

/** 合计金额文案 */
const totalText = computed(() => {
  if (props.value.length === 0) {
    return ''
  }
  const total = props.value.reduce((sum, item) => sum + toNumber(item.price), 0)
  return formatStatisticsAmount(total, props.prefix)
})

/** 折线图配置 */
const chartOption = computed(() => ({
  color: [props.color],
  dataset: {
    dimensions: ['time', 'price'],
    source: props.value.map(item => ({
      time: formatStatisticsTimeLabel(item.time),
      price: toNumber(item.price),
    })),
  },
  grid: {
    left: 12,
    right: 16,
    top: 56,
    bottom: 34,
    containLabel: true,
  },
  legend: {
    top: 14,
    textStyle: { color: '#666', fontSize: 11 },
  },
  series: [{
    name: '金额',
    type: 'line',
    smooth: true,
    areaStyle: { opacity: 0.12 },
    showSymbol: false,
  }],
  tooltip: {
    trigger: 'axis',
    confine: true,
    axisPointer: { type: 'cross' },
    valueFormatter: (value: unknown) => formatStatisticsAmount(value, props.prefix),
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    axisLabel: { color: '#999', fontSize: 10 },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#999', fontSize: 10 },
    splitLine: { lineStyle: { color: '#f0f0f0' } },
  },
}))
</script>
