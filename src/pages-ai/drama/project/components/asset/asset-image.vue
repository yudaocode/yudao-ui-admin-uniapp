<template>
  <view
    class="relative shrink-0 overflow-hidden rounded-8rpx bg-[#f5f5f5]"
    :style="{ width: size, height: size }"
    @click="handlePreview"
  >
    <wd-img v-if="url" :src="url" :width="size" :height="size" radius="8rpx" mode="aspectFill" />
    <view v-else class="h-full w-full flex flex-col items-center justify-center gap-8rpx px-8rpx text-center text-22rpx text-[#999]">
      <wd-loading v-if="isAiDramaRunning(status)" size="36rpx" />
      <text v-else-if="status === AiDramaStatusEnum.FAIL" class="line-clamp-3 break-all text-[#f5222d]">
        {{ errorMessage || '生成失败' }}
      </text>
      <text v-else>暂无图片</text>
    </view>

    <!-- 已有图片时重新出图的状态 -->
    <view v-if="url && isAiDramaRunning(status)" class="absolute bottom-0 left-0 right-0 bg-black/50 py-4rpx text-center text-20rpx text-white">
      生成中
    </view>
    <view v-else-if="url && status === AiDramaStatusEnum.FAIL" class="absolute bottom-0 left-0 right-0 line-clamp-2 bg-[#f5222d]/80 px-8rpx py-4rpx text-center text-20rpx text-white">
      {{ errorMessage || '生成失败' }}
    </view>
  </view>
</template>

<script lang="ts" setup>
import { AiDramaStatusEnum, isAiDramaRunning } from '@/utils/constants'

const props = withDefaults(defineProps<{
  url?: string // 图片地址
  status?: number // 生成状态，参见 AiDramaStatusEnum
  errorMessage?: string // 失败原因
  size?: string // 图片边长
  previewUrls?: string[] // 预览时可左右切换的图片，默认只预览当前图
}>(), {
  size: '160rpx',
})

/** 预览图片 */
function handlePreview() {
  if (!props.url) {
    return
  }
  uni.previewImage({
    urls: props.previewUrls?.length ? props.previewUrls : [props.url],
    current: props.url,
  })
}
</script>
