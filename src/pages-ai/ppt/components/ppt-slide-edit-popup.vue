<template>
  <!-- 修改本页弹窗：修改提示词重绘、切换历史版本 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    :z-index="20"
    custom-style="max-height: 90vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="px-24rpx pb-28rpx pt-24rpx">
      <view class="mb-20rpx flex items-center justify-between">
        <text class="text-32rpx text-[#222] font-semibold">修改第 {{ slide?.index }} 页</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <scroll-view v-if="slide" scroll-y class="max-h-[78vh]">
        <!-- 当前图 -->
        <view class="h-395rpx w-full overflow-hidden rounded-12rpx">
          <PptSlideImage :slide="slide" :running="isRunning" preview />
        </view>
        <view v-if="slide.status === AiPptStatusEnum.FAIL && slide.errorMessage" class="mt-12rpx text-24rpx text-[#f5222d]">
          重绘失败：{{ slide.errorMessage }}（当前图未变化，可修改提示词后再试）
        </view>

        <!-- 生图提示词 -->
        <view class="mb-12rpx mt-28rpx text-28rpx text-[#333] font-semibold">
          生图提示词
        </view>
        <view class="overflow-hidden rounded-12rpx bg-[#f8f8f8]">
          <wd-textarea
            v-model="prompt"
            :maxlength="4000"
            show-word-limit
            placeholder="直接修改完整的生图提示词，例如改掉画错的字、换配色"
          />
        </view>
        <view class="mt-8rpx text-22rpx text-[#999] leading-34rpx">
          按修改后的提示词重新文生图，不参考当前图，构图可能整体变化；不满意可在下方切回历史版本
        </view>
        <view class="mt-20rpx">
          <wd-button block type="primary" :loading="redrawing" :disabled="isRunning" @click="handleRedraw">
            {{ isSlideRedrawing ? '本页重绘中…' : '重新生成' }}
          </wd-button>
        </view>

        <!-- 历史版本 -->
        <view class="mb-12rpx mt-32rpx text-28rpx text-[#333] font-semibold">
          历史版本
        </view>
        <view v-if="!slide.images?.length" class="py-30rpx text-center text-24rpx text-[#999]">
          暂无历史版本
        </view>
        <view class="grid grid-cols-2 gap-16rpx">
          <view
            v-for="image in slide.images || []"
            :key="image.url"
            class="relative overflow-hidden border-4rpx rounded-12rpx border-solid bg-[#f5f5f5]"
            :class="image.url === slide.imageUrl ? 'border-[#1677ff]' : 'border-transparent'"
            @click="handleSwitchImage(image)"
          >
            <wd-img :src="image.url" width="100%" height="190rpx" mode="aspectFit" />
            <view v-if="image.url === slide.imageUrl" class="absolute right-8rpx top-8rpx">
              <wd-tag type="primary" variant="dark">
                当前
              </wd-tag>
            </view>
            <view class="bg-white px-12rpx py-6rpx text-22rpx text-[#999]">
              {{ formatDate(image.createTime, 'MM-DD HH:mm') }}
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Ppt, PptSlide, PptSlideImageVersion } from '@/api/ai/ppt'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { redrawSlideMy, updateSlideImageMy } from '@/api/ai/ppt'
import { AiPptStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import PptSlideImage from './ppt-slide-image.vue'

const props = defineProps<{
  ppt?: Ppt // 当前 PPT
  slide?: PptSlide // 当前页
}>()

const emit = defineEmits<{
  success: [] // 已提交重绘或切换版本，用于刷新详情
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const prompt = ref('') // 生图提示词
const redrawing = ref(false) // 重绘提交状态
const isRunning = computed(() => props.ppt?.status === AiPptStatusEnum.IN_PROGRESS) // 任务是否生成中
const isSlideRedrawing = computed(() => isRunning.value && props.slide?.status === AiPptStatusEnum.IN_PROGRESS) // 本页是否重绘中

/** 打开弹窗：带入本页当前版本的完整提示词 */
function open(currentPrompt: string) {
  prompt.value = currentPrompt
  visible.value = true
}

/** 关闭弹窗 */
function close() {
  visible.value = false
}

/** 重新生成：异步重绘，任务回到生成中 */
async function handleRedraw() {
  if (!props.ppt || !props.slide) {
    return
  }
  const text = prompt.value.trim()
  if (!text) {
    toast.warning('请输入生图提示词')
    return
  }
  redrawing.value = true
  try {
    await redrawSlideMy({ id: props.ppt.id, slideIndex: props.slide.index, prompt: text })
    toast.success('已提交重绘')
    emit('success')
  } finally {
    redrawing.value = false
  }
}

/** 切换历史版本：立即设为当前，不重新生成 */
async function handleSwitchImage(image: PptSlideImageVersion) {
  if (!props.ppt || !props.slide || image.url === props.slide.imageUrl) {
    return
  }
  if (isRunning.value) {
    toast.warning('任务生成中，请稍后再切换')
    return
  }
  await updateSlideImageMy({ id: props.ppt.id, slideIndex: props.slide.index, imageUrl: image.url })
  toast.success('已设为当前版本')
  emit('success')
}

defineExpose({ open, close })
</script>
