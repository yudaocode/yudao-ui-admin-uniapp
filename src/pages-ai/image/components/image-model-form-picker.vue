<template>
  <!-- 模型选择字段 -->
  <wd-cell title="模型" title-width="170rpx" is-link center @click="visible = true">
    <view class="min-w-0 flex flex-1 items-center justify-end">
      <text v-if="selectedModel" class="truncate text-28rpx text-[#333]">{{ selectedModel.name }}</text>
      <text v-else class="text-28rpx text-[#999]">请选择绘图模型</text>
    </view>
  </wd-cell>

  <!-- 模型选择弹窗：按 通用模型 / Seedream / Midjourney 分组，不可用的模型置灰并说明原因 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 76vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="px-24rpx pb-24rpx pt-24rpx">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-32rpx text-[#222] font-semibold">选择绘图模型</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <scroll-view scroll-y class="max-h-[62vh]">
        <view v-if="groups.length === 0" class="py-60rpx text-center text-26rpx text-[#999]">
          没有可用的绘图模型，请先在「模型配置」启用绘图模型
        </view>
        <view v-for="group in groups" :key="group.label" class="mb-16rpx">
          <view class="mb-12rpx text-24rpx text-[#999]">
            {{ group.label }}
          </view>
          <view
            v-for="item in group.models"
            :key="item.id"
            class="mb-16rpx rounded-12rpx p-20rpx"
            :class="getItemClass(item)"
            @click="handleSelect(item)"
          >
            <view class="flex items-center gap-12rpx">
              <text class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-semibold">{{ item.name }}</text>
              <wd-icon v-if="item.id === modelValue" name="check" size="36rpx" color="#1677ff" />
            </view>
            <view class="mt-6rpx truncate text-22rpx text-[#999]">
              {{ item.model }}
            </view>
            <view v-if="getImageModelDisabledReason(item.platform, item.model)" class="mt-8rpx text-22rpx text-[#fa8c16] leading-34rpx">
              {{ getImageModelDisabledReason(item.platform, item.model) }}
            </view>
            <view v-else class="mt-8rpx flex flex-wrap gap-8rpx">
              <wd-tag v-for="tag in getImageModelTags(item.platform, item.model)" :key="tag" variant="plain">
                {{ tag }}
              </wd-tag>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { AiModel } from '@/api/ai/model/model'
import { computed, ref } from 'vue'
import { AiPlatformEnum, getImageModelDisabledReason, getImageModelTags } from '@/utils/constants'

const props = defineProps<{
  modelValue?: number // 选中的模型编号
  models: AiModel[] // 绘图模型列表
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const visible = ref(false) // 选择弹窗显示状态
const selectedModel = computed(() => props.models.find(item => item.id === props.modelValue)) // 当前选中的模型
const groups = computed(() => [ // 模型分组：通用模型 / Seedream / Midjourney
  {
    label: '通用模型',
    models: props.models.filter(item => item.platform !== AiPlatformEnum.BYTEDANCE && item.platform !== AiPlatformEnum.MIDJOURNEY),
  },
  { label: 'Seedream', models: props.models.filter(item => item.platform === AiPlatformEnum.BYTEDANCE) },
  { label: 'Midjourney', models: props.models.filter(item => item.platform === AiPlatformEnum.MIDJOURNEY) },
].filter(group => group.models.length > 0))

/** 模型项的样式：选中高亮、不可用置灰 */
function getItemClass(item: AiModel) {
  if (getImageModelDisabledReason(item.platform, item.model)) {
    return 'bg-[#f8f8f8] opacity-60'
  }
  return item.id === props.modelValue ? 'bg-[#eef4ff]' : 'bg-[#f8f8f8]'
}

/** 选择模型：不可用的模型不可选 */
function handleSelect(item: AiModel) {
  if (getImageModelDisabledReason(item.platform, item.model)) {
    return
  }
  emit('update:modelValue', item.id!)
  visible.value = false
}
</script>
