<template>
  <!-- 服务商：跟随选中的模型；切换时选中该服务商的第一个模型 -->
  <wd-form-item title="服务商" title-width="170rpx" is-link center @click="openPlatformPicker">
    <view class="min-w-0 flex flex-1 items-center justify-end">
      <text v-if="platform" class="truncate text-28rpx text-[#333]">{{ getPlatformLabel(platform) }}</text>
      <text v-else class="text-28rpx text-[#999]">请选择服务商</text>
    </view>
  </wd-form-item>

  <!-- 模型 -->
  <wd-form-item title="模型" title-width="170rpx" prop="modelId" is-link center @click="visible = true">
    <view class="min-w-0 flex flex-1 items-center justify-end gap-12rpx">
      <template v-if="selectedModel">
        <view class="shrink-0">
          <wd-img v-if="selectedModel.iconUrl" :src="selectedModel.iconUrl" width="40rpx" height="40rpx" radius="8rpx" mode="aspectFill" />
          <wd-icon v-else name="video-camera" size="36rpx" color="#999" />
        </view>
        <text class="truncate text-28rpx text-[#333]">{{ selectedModel.name }}</text>
      </template>
      <text v-else class="text-28rpx text-[#999]">请选择视频模型</text>
    </view>
  </wd-form-item>

  <!-- 服务商选择 -->
  <wd-action-sheet
    v-model="platformVisible"
    :actions="platformActions"
    title="选择服务商"
    cancel-text="取消"
    root-portal
    :z-index="30"
    @select="handlePlatformSelect"
  />

  <!-- 模型选择弹窗：只列出当前服务商的模型 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 70vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="px-24rpx pb-24rpx pt-24rpx">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-32rpx text-[#222] font-semibold">选择视频模型</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <scroll-view scroll-y class="max-h-[56vh]">
        <view v-if="modelList.length === 0" class="py-60rpx text-center text-26rpx text-[#999]">
          暂无可用模型，请先在「模型配置」中添加类型为「视频」的模型
        </view>
        <view
          v-for="item in modelList"
          :key="item.id"
          class="mb-16rpx flex items-center gap-20rpx rounded-12rpx p-20rpx"
          :class="item.id === modelValue ? 'bg-[#eef4ff]' : 'bg-[#f8f8f8]'"
          @click="handleSelect(item)"
        >
          <view class="shrink-0">
            <wd-img v-if="item.iconUrl" :src="item.iconUrl" width="72rpx" height="72rpx" radius="12rpx" mode="aspectFill" />
            <view v-else class="h-72rpx w-72rpx flex items-center justify-center rounded-12rpx bg-white">
              <wd-icon name="video-camera" size="40rpx" color="#bbb" />
            </view>
          </view>
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view class="mt-6rpx truncate text-22rpx text-[#999]">
              {{ item.model }}
            </view>
            <view v-if="item.description" class="line-clamp-2 mt-6rpx text-24rpx text-[#999]">
              {{ item.description }}
            </view>
          </view>
          <wd-icon v-if="item.id === modelValue" name="check" size="36rpx" color="#1677ff" />
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { AiModel } from '@/api/ai/model/model'
import { computed, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  modelValue?: number // 选中的模型编号
  models: AiModel[] // 当前创作类型可用的模型
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [] // 用户切换服务商、模型时触发
}>()

const visible = ref(false) // 模型选择弹窗显示状态
const platformVisible = ref(false) // 服务商选择显示状态
const selectedModel = computed(() => props.models.find(item => item.id === props.modelValue)) // 当前选中的模型
const platform = computed(() => selectedModel.value?.platform) // 当前服务商：取选中模型的服务商
const modelList = computed(() => props.models.filter(item => item.platform === platform.value)) // 当前服务商的模型
const platformActions = computed(() => Array.from(new Set(props.models.map(item => item.platform))).map(item => ({ // 可用的服务商
  name: getPlatformLabel(item),
  color: item === platform.value ? '#1677ff' : undefined,
  value: item,
})))

/** 服务商的展示名 */
function getPlatformLabel(value?: string) {
  return getDictLabel(DICT_TYPE.AI_PLATFORM, value) || value || '-'
}

/** 打开服务商选择 */
function openPlatformPicker() {
  if (props.models.length === 0) {
    return
  }
  platformVisible.value = true
}

/** 选择服务商：选中该服务商的第一个模型 */
function handlePlatformSelect({ item }: { item: { value: string } }) {
  if (item.value === platform.value) {
    return
  }
  emit('update:modelValue', props.models.find(model => model.platform === item.value)?.id)
  emit('change')
}

/** 选择模型 */
function handleSelect(item: AiModel) {
  visible.value = false
  if (item.id === props.modelValue) {
    return
  }
  emit('update:modelValue', item.id)
  emit('change')
}
</script>
