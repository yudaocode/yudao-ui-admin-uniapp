<template>
  <!-- 表单选择字段：展示所选绘图模型 -->
  <wd-form-item :title="label" :title-width="labelWidth" :prop="prop || undefined" is-link center @click="visible = true">
    <view class="min-w-0 flex flex-1 items-center justify-end gap-12rpx">
      <template v-if="selectedModel">
        <view class="shrink-0">
          <wd-img v-if="selectedModel.iconUrl" :src="selectedModel.iconUrl" width="40rpx" height="40rpx" radius="8rpx" mode="aspectFill" />
          <wd-icon v-else name="image" size="36rpx" color="#999" />
        </view>
        <text class="truncate text-28rpx text-[#333]">{{ selectedModel.name }}</text>
      </template>
      <text v-else class="text-28rpx text-[#999]">{{ placeholder }}</text>
    </view>
  </wd-form-item>
  <!-- 无可用模型提示 -->
  <view v-if="loaded && list.length === 0" class="px-32rpx pb-16rpx text-22rpx text-[#fa8c16] leading-34rpx">
    {{ emptyText }}
  </view>

  <!-- 模型选择弹窗 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 70vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="px-24rpx pb-24rpx pt-24rpx">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-32rpx text-[#222] font-semibold">{{ placeholder }}</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <scroll-view scroll-y class="max-h-[56vh]">
        <view v-if="list.length === 0" class="py-60rpx text-center text-26rpx text-[#999]">
          {{ emptyText }}
        </view>
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-16rpx flex items-center gap-20rpx rounded-12rpx p-20rpx"
          :class="item.id === modelValue ? 'bg-[#eef4ff]' : 'bg-[#f8f8f8]'"
          @click="handleSelect(item)"
        >
          <view class="shrink-0">
            <wd-img v-if="item.iconUrl" :src="item.iconUrl" width="72rpx" height="72rpx" radius="12rpx" mode="aspectFill" />
            <view v-else class="h-72rpx w-72rpx flex items-center justify-center rounded-12rpx bg-white">
              <wd-icon name="image" size="40rpx" color="#bbb" />
            </view>
          </view>
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view class="mt-6rpx text-24rpx text-[#999]">
              {{ item.platform }}
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
import { computed, onMounted, ref } from 'vue'
import { getModelSimpleList } from '@/api/ai/model/model'
import { AI_PPT_IMAGE_PLATFORMS, AiModelTypeEnum } from '@/utils/constants'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
}>(), {
  label: '绘图模型',
  labelWidth: '170rpx',
  placeholder: '请选择绘图模型',
  prop: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const emptyText = '没有可用的绘图模型，请先在「模型配置」启用 OpenAI、硅基流动或通义千问平台的绘图模型' // 无可用模型时的提示
const visible = ref(false) // 选择弹窗显示状态
const loaded = ref(false) // 模型列表是否已加载
const list = ref<AiModel[]>([]) // 绘图模型列表
const selectedModel = computed(() => list.value.find(item => item.id === props.modelValue)) // 当前选中的模型

/** 选择模型 */
function handleSelect(item: AiModel) {
  emit('update:modelValue', item.id)
  visible.value = false
}

/** 初始化：只列出支持整页文生图的平台，未选择时默认选中第一个 */
onMounted(async () => {
  const data = await getModelSimpleList(AiModelTypeEnum.IMAGE)
  list.value = data.filter(item => !!item.platform && AI_PPT_IMAGE_PLATFORMS.includes(item.platform))
  loaded.value = true
  if (!props.modelValue && list.value.length > 0) {
    emit('update:modelValue', list.value[0].id)
  }
})
</script>
