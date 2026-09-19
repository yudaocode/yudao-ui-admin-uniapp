<template>
  <view v-if="storage" class="m-24rpx rounded-12rpx bg-white p-24rpx">
    <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
      云盘概览
    </view>
    <view class="flex text-center">
      <view class="flex-1">
        <view class="text-32rpx text-[#333] font-semibold">
          {{ storage.fileCount }}
        </view><view class="mt-4rpx text-24rpx text-[#999]">
          我的文件
        </view>
      </view>
      <view class="flex-1">
        <view class="text-32rpx text-[#333] font-semibold">
          {{ storage.sharedCount }}
        </view><view class="mt-4rpx text-24rpx text-[#999]">
          我共享的
        </view>
      </view>
      <view class="flex-1">
        <view class="text-32rpx text-[#333] font-semibold">
          {{ storage.receivedCount }}
        </view><view class="mt-4rpx text-24rpx text-[#999]">
          共享给我的
        </view>
      </view>
      <view class="flex-1">
        <view class="text-24rpx text-[#333] font-semibold">
          {{ formatFileSize(storage.usedSize) }} / {{ formatFileSize(storage.totalSize) }}
        </view><view class="mt-4rpx text-24rpx text-[#999]">
          存储空间
        </view><view class="mx-16rpx mt-8rpx h-8rpx overflow-hidden rounded-full bg-[#f5f5f5]">
          <view class="h-full rounded-full bg-[#1677ff]" :style="{ width: `${Math.min(100, (storage.usedSize / (storage.totalSize || 1)) * 100)}%` }" />
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FileStorage } from '@/api/oa/file'
import { formatFileSize } from '@/utils/download'

defineProps<{ storage?: FileStorage }>()
</script>
