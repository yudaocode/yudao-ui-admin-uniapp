<template>
  <!-- 单个总结卡片：标签 + 数值 + 环比，复用基础 card 壳 -->
  <view v-if="!item" class="rounded-12rpx p-20rpx" :class="highlight ? 'bg-[#ecf5ff]' : 'bg-[#f8fafc]'">
    <view class="text-24rpx text-[#999]">
      {{ title }}
    </view>
    <view class="mt-8rpx text-32rpx font-semibold" :class="simpleValueClass">
      {{ prefix }}{{ simpleValueText }}
    </view>
  </view>
  <Card v-else>
    <text class="text-26rpx text-[#999]">{{ item.label }}</text>
    <view class="mt-12rpx flex items-end gap-4rpx">
      <text v-if="item.prefix" class="text-28rpx text-[#333] font-semibold">{{ item.prefix }}</text>
      <text class="text-40rpx text-[#333] font-semibold leading-none">{{ formattedValue }}</text>
    </view>
    <view v-if="item.reference !== undefined" class="mt-12rpx flex items-center gap-6rpx text-24rpx">
      <text class="text-[#bbb]">{{ referenceLabel }}</text>
      <text :class="rateClass">{{ rateText }}</text>
    </view>
  </Card>
</template>

<script lang="ts" setup>
import type { SummaryItem } from './summary-grid.vue'
import { computed } from 'vue'
import { calculateRelativeRate } from '@/pages-statistics/utils/statistics'
import Card from './card.vue'

const props = withDefaults(defineProps<{
  item?: SummaryItem
  title?: string // 标题
  value?: number // 数值
  highlight?: boolean // 是否高亮
  prefix?: string // 数值前缀
  referenceLabel?: string // 对比说明文案
}>(), {
  title: '',
  value: 0,
  highlight: false,
  prefix: '￥',
  referenceLabel: '较昨日',
})

const formattedValue = computed(() => { // 金额前缀场景保留两位小数
  const value = Number(props.item?.value || 0)
  if (Number.isNaN(value)) {
    return String(props.item?.value ?? '-')
  }
  return props.item?.prefix ? value.toFixed(2) : String(value)
})

const simpleValue = computed(() => {
  const value = Number(props.value || 0)
  return Number.isNaN(value) ? 0 : value
}) // 简单数值
const simpleValueText = computed(() => simpleValue.value.toFixed(2)) // 简单数值文案
const simpleValueClass = computed(() => simpleValue.value >= 0 ? 'text-[#1677ff]' : 'text-[#f5222d]') // 正负数颜色
const rateValue = computed(() => calculateRelativeRate(props.item?.value || 0, props.item?.reference)) // 环比增长率
const rateText = computed(() => `${rateValue.value > 0 ? '+' : ''}${rateValue.value}%`)
const rateClass = computed(() => {
  if (rateValue.value > 0) {
    return 'text-[#f5222d]' // 增长红
  }
  if (rateValue.value < 0) {
    return 'text-[#52c41a]' // 下降绿
  }
  return 'text-[#999]'
})
</script>
