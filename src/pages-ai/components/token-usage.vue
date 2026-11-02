<template>
  <!-- Token 用量摘要：业务标准快照 -->
  <view class="flex flex-wrap items-center gap-x-20rpx gap-y-4rpx rounded-12rpx bg-[#f7f8fa] px-20rpx py-14rpx text-22rpx text-[#666]">
    <text v-if="pending && inputTokens == null && outputTokens == null && totalTokens == null" class="text-[#999]">用量待返回</text>
    <template v-else>
      <text>输入 {{ formatAiTokens(inputTokens) }}</text>
      <text>输出 {{ formatAiTokens(outputTokens) }}</text>
      <text>合计 {{ formatAiTokens(totalTokens) }}</text>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { formatAiTokens } from '@/utils/constants'

withDefaults(defineProps<{
  inputTokens?: number | null // 输入 Token，未知为空
  outputTokens?: number | null // 输出 Token，未知为空
  totalTokens?: number | null // 合计 Token，未知为空
  pending?: boolean // 生成中且尚未收到用量
}>(), {
  pending: false,
})
</script>
