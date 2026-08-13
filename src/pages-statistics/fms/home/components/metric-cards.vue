<template>
  <!-- 财务指标卡片：横向滚动，点击选中指标联动图表 -->
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <text class="text-30rpx text-[#333] font-semibold">
        财务指标
      </text>
      <text class="text-24rpx text-[#999]">
        {{ home?.currentMonth }} 当期数据
      </text>
    </view>
    <scroll-view scroll-x>
      <view class="inline-flex gap-16rpx p-24rpx">
        <view
          v-for="(metric, index) in home?.metrics || []"
          :key="metric.key"
          class="w-300rpx flex-shrink-0 border rounded-12rpx px-20rpx py-24rpx"
          :class="selectedMetricKey === metric.key
            ? 'border-[#1677ff] bg-[#e6f0ff]'
            : 'border-[#f0f0f0] bg-[#f7f8fa]'"
          @click="emit('select', metric)"
        >
          <view class="flex items-center gap-8rpx">
            <view
              class="h-24rpx w-8rpx flex-shrink-0 rounded-4rpx"
              :style="{ backgroundColor: FMS_HOME_METRIC_COLORS[index % FMS_HOME_METRIC_COLORS.length] }"
            />
            <text class="min-w-0 truncate text-26rpx text-[#666]">
              {{ metric.name }}
            </text>
          </view>
          <view class="mt-12rpx truncate text-36rpx text-[#333] font-semibold">
            {{ formatFmsAmount(metric.amount) }}
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { FmsHome, FmsHomeMetric } from '@/api/fms/home'
import { FMS_HOME_METRIC_COLORS } from '@/pages-fms/utils/constants'
import { formatFmsAmount } from '@/pages-fms/utils/format'

defineProps<{
  home?: FmsHome
  selectedMetricKey?: string
}>()

const emit = defineEmits<{
  (e: 'select', metric: FmsHomeMetric): void
}>()
</script>
