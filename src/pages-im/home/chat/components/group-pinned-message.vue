<template>
  <view
    class="flex items-center gap-16rpx border-b border-b-[#eee] bg-white px-24rpx py-18rpx"
    @click="emit('locate')"
  >
    <wd-icon name="pin" size="32rpx" color="#576b95" />
    <text class="line-clamp-1 min-w-0 flex-1 text-26rpx text-[#555]">
      {{ getMessageSummary(message.type, message.content) }}
    </text>
  </view>
</template>

<script lang="ts" setup>
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import { getMessageSummary } from '@/pages-im/utils/conversation'

defineProps<{
  message: ImGroupMessageRespVO
}>()

const emit = defineEmits<{
  locate: []
}>()
</script>
