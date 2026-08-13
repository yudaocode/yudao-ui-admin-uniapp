<template>
  <!-- 指标图表：趋势折线图 + 结构饼图 -->
  <view class="space-y-24rpx">
    <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
      <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
        {{ metricDetail ? `${metricDetail.name}变化趋势（单位：元）` : '财务指标趋势（单位：元）' }}
      </view>
      <view class="p-24rpx">
        <YdChart
          :option="trendChartOptions"
          :loading="loading"
          :empty="!hasTrendData"
          height="480rpx"
        />
      </view>
    </view>

    <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
      <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
        {{ metricDetail ? `${currentMonthText} ${metricDetail.name}结构分析（单位：元）` : '本期指标结构（单位：元）' }}
      </view>
      <view class="p-24rpx">
        <YdChart
          :option="structureChartOptions"
          :loading="loading"
          :empty="structureChartData.length === 0"
          height="480rpx"
        />
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FmsHome, FmsHomeMetricDetail } from '@/api/fms/home'
import YdChart from '../../../components/yd-chart/yd-chart.vue'
import { FMS_HOME_METRIC_COLORS } from '@/pages-fms/utils/constants'
import { formatFmsAmount } from '@/pages-fms/utils/format'

const props = defineProps<{
  home?: FmsHome
  metricDetail?: FmsHomeMetricDetail
  selectedMetricKey?: string
  loading: boolean
}>()

const currentMonthText = computed(() => { // 当前会计期间的月份文案
  const month = Number(props.home?.currentMonth?.slice(5, 7))
  return month ? `${month}月` : ''
})

const trendChartOptions = computed(() => { // 趋势图配置
  const commonOptions = {
    color: FMS_HOME_METRIC_COLORS,
    grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
    legend: { top: 0, type: 'scroll' },
    tooltip: { trigger: 'axis', confine: true, valueFormatter: (value: unknown) => formatFmsAmount(Number(value)) },
    yAxis: { type: 'value', axisLabel: { color: '#999', fontSize: 10, formatter: (value: number) => formatCompactAmount(value) } },
  }
  if (props.metricDetail) {
    return {
      ...commonOptions,
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: props.metricDetail.trends.map(item => item.month),
        axisLabel: { color: '#999', fontSize: 10 },
        axisTick: { show: false },
      },
      series: [
        {
          name: props.metricDetail.name,
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.12 },
          data: props.metricDetail.trends.map(item => item.amount),
        },
      ],
    }
  }
  return {
    ...commonOptions,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.home?.trends.map(item => item.month) || [],
      axisLabel: { color: '#999', fontSize: 10 },
      axisTick: { show: false },
    },
    series: (props.home?.metrics || []).map(metric => ({
      name: metric.name,
      type: 'line',
      smooth: true,
      data: (props.home?.trends || []).map(
        trend => trend.metrics.find(item => item.key === metric.key)?.amount || 0,
      ),
    })),
  }
})

const hasTrendData = computed(() => { // 是否存在趋势数据
  if (props.metricDetail) {
    return props.metricDetail.trends.length > 0
  }
  return (props.home?.trends.length || 0) > 0
})

const structureChartData = computed(() => buildStructureChartData()) // 结构图数据
const structureChartOptions = computed(() => ({ // 结构图配置
  color: FMS_HOME_METRIC_COLORS,
  tooltip: { trigger: 'item', confine: true, formatter: '{b}<br/>{c} 元（{d}%）' },
  legend: { bottom: 0, type: 'scroll' },
  series: [
    {
      name: '本期指标',
      type: 'pie',
      radius: ['46%', '72%'],
      center: ['50%', '44%'],
      label: { formatter: '{b}\n{d}%', color: '#666', fontSize: 10 },
      data: structureChartData.value,
    },
  ],
}))

/** 构建结构图数据：选中指标时取科目构成，超过 5 项合并为「其他」 */
function buildStructureChartData() {
  if (!props.metricDetail) {
    return (props.home?.metrics || [])
      .filter(metric => Number(metric.amount) > 0)
      .map(metric => ({
        name: metric.name,
        value: Number(metric.amount),
      }))
  }
  const structure = props.metricDetail.structure
    .filter(item => Number(item.amount) > 0)
    .map(item => ({
      name: `${item.subjectCode} ${item.subjectName}`,
      value: Number(item.amount),
    }))
  if (structure.length === 0) {
    const metric = props.home?.metrics.find(item => item.key === props.selectedMetricKey)
    return metric && Number(metric.amount) > 0
      ? [{ name: metric.name, value: Number(metric.amount) }]
      : []
  }
  const result = structure.slice(0, 5)
  if (structure.length > 5) {
    result.push({
      name: '其他',
      value: structure.slice(5).reduce((total, item) => total + item.value, 0),
    })
  }
  return result
}

/** 格式化坐标轴金额（过万压缩为「x.x万」，与 PC 一致） */
function formatCompactAmount(amount: number) {
  const value = Number(amount || 0)
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  return value.toFixed(0)
}
</script>
