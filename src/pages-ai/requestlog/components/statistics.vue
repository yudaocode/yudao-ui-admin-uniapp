<template>
  <!-- 统计：后端按同一筛选条件统计全部匹配记录 -->
  <view class="grid grid-cols-2 mb-24rpx gap-16rpx">
    <view class="rounded-12rpx bg-white p-20rpx shadow-sm">
      <view class="text-22rpx text-[#999]">
        请求总数
      </view>
      <view class="mt-8rpx text-34rpx text-[#333] font-semibold">
        {{ statistics ? formatNumber(statistics.requestCount) : '' }}
      </view>
      <view class="mt-6rpx text-20rpx text-[#999]">
        <template v-if="statistics">
          成功 {{ formatNumber(statistics.successCount) }} / 失败 {{ formatNumber(statistics.failCount) }} / 取消 {{ formatNumber(statistics.cancelCount) }}
        </template>
      </view>
    </view>
    <view class="rounded-12rpx bg-white p-20rpx shadow-sm">
      <view class="text-22rpx text-[#999]">
        已知输入合计
      </view>
      <view class="mt-8rpx text-34rpx text-[#333] font-semibold">
        {{ statistics ? formatAiTokens(statistics.inputTokens) : '' }}
      </view>
    </view>
    <view class="rounded-12rpx bg-white p-20rpx shadow-sm">
      <view class="text-22rpx text-[#999]">
        已知输出合计
      </view>
      <view class="mt-8rpx text-34rpx text-[#333] font-semibold">
        {{ statistics ? formatAiTokens(statistics.outputTokens) : '' }}
      </view>
    </view>
    <view class="rounded-12rpx bg-white p-20rpx shadow-sm">
      <view class="text-22rpx text-[#999]">
        完整总计
      </view>
      <view class="mt-8rpx text-34rpx text-[#333] font-semibold">
        {{ statistics ? formatAiTokens(statistics.totalTokens) : '' }}
      </view>
      <view class="mt-6rpx text-20rpx text-[#999]">
        <template v-if="statistics">
          已知 {{ formatNumber(statistics.knownUsageCount) }} / 未知 {{ formatNumber(statistics.unknownUsageCount) }}
        </template>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AiRequestLogStatistics } from '@/api/ai/requestlog'
import { ref } from 'vue'
import { getRequestLogStatistics } from '@/api/ai/requestlog'
import { formatAiTokens } from '@/utils/constants'
import { formatNumber } from '@/utils/format'

const statistics = ref<AiRequestLogStatistics>() // 筛选结果统计；未加载或加载失败时为空，不展示 0
let statisticsRequestId = 0 // 统计请求序号：筛选快速切换时，只采用最后一次请求的结果

/** 查询筛选结果统计 */
async function getStatistics(params: Record<string, any>) {
  const requestId = ++statisticsRequestId
  statistics.value = undefined
  const data = await getRequestLogStatistics({ ...params }).catch(() => undefined)
  if (requestId === statisticsRequestId) {
    statistics.value = data
  }
}

defineExpose({ getStatistics })
</script>
