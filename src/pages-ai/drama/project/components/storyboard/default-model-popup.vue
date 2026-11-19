<template>
  <!-- 默认模型弹窗：未设置视频模型的镜头使用这里的模型 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 80vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="pb-24rpx pt-24rpx">
      <view class="mb-12rpx flex items-center justify-between px-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">默认模型</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <wd-form :model="{}">
        <wd-cell-group border>
          <yd-form-picker v-model="imageModelId" label="绘画模型" placeholder="请选择绘画模型" :columns="toModelColumns(imageModels)" filterable />
          <yd-form-picker v-model="videoModelId" label="视频模型" placeholder="请选择视频模型" :columns="toModelColumns(videoModels)" filterable />
          <yd-form-picker v-if="resolutions.length" v-model="resolution" label="分辨率" :columns="resolutionColumns" />
        </wd-cell-group>
      </wd-form>
      <view class="px-24rpx pt-16rpx text-22rpx text-[#999]">
        未设置视频模型的镜头使用此模型；镜头可在单镜页单独指定
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { AiModel } from '@/api/ai/model/model'
import { computed } from 'vue'
import { toModelColumns } from './use-drama-models'

const props = defineProps<{
  imageModels: AiModel[] // 绘画模型
  videoModels: AiModel[] // 视频模型
  resolutions: string[] // 所选视频模型可选的分辨率
}>()

const visible = defineModel<boolean>({ default: false }) // 弹窗显示状态
const imageModelId = defineModel<number | undefined>('imageModelId') // 默认绘画模型
const videoModelId = defineModel<number | undefined>('videoModelId') // 默认视频模型
const resolution = defineModel<string | undefined>('resolution') // 默认分辨率

const resolutionColumns = computed(() => props.resolutions.map(item => ({ label: item, value: item }))) // 分辨率选项
</script>
