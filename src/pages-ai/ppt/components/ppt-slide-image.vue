<template>
  <!-- 一页的图：尺寸由父级容器决定；有图显示图（重绘中叠加提示），没图按状态显示占位 -->
  <view class="relative h-full w-full overflow-hidden bg-[#f5f5f5]">
    <template v-if="slide.imageUrl">
      <wd-img :src="slide.imageUrl" width="100%" height="100%" mode="aspectFit" :enable-preview="preview" />
      <view v-if="slideRunning" class="absolute inset-0 flex items-center justify-center bg-black/40 text-22rpx text-white">
        本页重绘中…
      </view>
    </template>
    <view v-else class="h-full w-full flex items-center justify-center gap-8rpx text-22rpx text-[#999]">
      <wd-loading v-if="slideRunning" size="28rpx" />
      <text>{{ slideRunning ? '生成中…' : running ? '待生成' : '本页未生成配图' }}</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PptSlide } from '@/api/ai/ppt'
import { computed } from 'vue'
import { AiPptStatusEnum } from '@/utils/constants'

const props = withDefaults(defineProps<{
  slide: PptSlide
  running?: boolean // 任务是否生成中
  preview?: boolean // 是否可点击放大
}>(), {
  running: false,
  preview: false,
})

const slideRunning = computed(() => props.running && props.slide.status === AiPptStatusEnum.IN_PROGRESS) // 本页是否生成中：任务结束后残留的生成中不再显示
</script>
