<template>
  <view v-if="urls?.length" class="mt-20rpx flex flex-col gap-12rpx">
    <view
      v-for="url in urls"
      :key="url"
      class="flex items-center gap-14rpx rounded-16rpx bg-[#f5f5f5] px-18rpx py-16rpx active:bg-[#eee]"
      @click="openAttachment(url)"
    >
      <view class="h-56rpx w-56rpx flex shrink-0 items-center justify-center rounded-12rpx bg-[#e6f4ff]">
        <wd-icon name="file" size="32rpx" color="#1677ff" />
      </view>
      <view class="min-w-0 flex-1">
        <view class="truncate text-25rpx text-[#333] font-medium">
          {{ getFileNameFromUrl(url) || '附件' }}
        </view>
        <view class="mt-4rpx text-21rpx text-[#999]">
          点击预览
        </view>
      </view>
      <wd-icon name="arrow-right" size="28rpx" color="#bbb" />
    </view>
  </view>
</template>

<script lang="ts" setup>
import { getFileNameFromUrl, openAttachment } from '@/utils/download'

defineProps<{
  urls?: string[]
}>()
</script>
