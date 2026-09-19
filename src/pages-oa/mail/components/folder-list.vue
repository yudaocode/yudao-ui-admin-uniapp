<template>
  <scroll-view v-if="folders.length" scroll-x :show-scrollbar="false" class="shrink-0 whitespace-nowrap bg-white pb-12rpx">
    <view class="w-max inline-flex gap-12rpx px-24rpx">
      <view v-for="folder in folders" :key="folder.key" class="inline-flex shrink-0 items-center gap-10rpx whitespace-nowrap rounded-12rpx px-24rpx py-16rpx text-26rpx" :class="activeKey === folder.key ? 'bg-[#edf4ff] text-[#1677ff] font-medium' : 'text-[#64748b]'" @click="emit('select', folder.key)">
        <text>{{ folder.name }}</text>
        <text v-if="folder.unreadCount" class="rounded-full bg-[#e8edf5] px-10rpx text-20rpx text-[#64748b]">{{ folder.unreadCount }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { MailFolder } from '@/api/oa/mail'

defineProps<{ folders: MailFolder[], activeKey: string }>()
const emit = defineEmits<{ select: [key: string] }>()
</script>
