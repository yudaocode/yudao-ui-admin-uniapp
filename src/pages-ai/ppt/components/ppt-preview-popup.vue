<template>
  <!-- 预览弹窗：用户侧可修改本页、导出，管理端只读 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 90vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="px-24rpx pb-28rpx pt-24rpx">
      <view class="mb-20rpx flex items-center justify-between gap-16rpx">
        <text class="min-w-0 flex-1 truncate text-32rpx text-[#222] font-semibold">
          {{ ppt ? `${ppt.title} · 预览` : '预览' }}
        </text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <view v-if="loading" class="py-80rpx text-center">
        <wd-loading />
      </view>
      <scroll-view v-else-if="ppt" scroll-y class="max-h-[78vh]">
        <!-- 状态 -->
        <view class="flex flex-wrap items-center gap-16rpx text-24rpx text-[#666]">
          <dict-tag :type="DICT_TYPE.AI_PPT_STATUS" :value="ppt.status" />
          <text>{{ ppt.finishCount }} / {{ ppt.slideCount }} 页</text>
          <text v-if="isRunning" class="text-[#999]">每 3 秒刷新 · 已生成的页可先看</text>
        </view>
        <!-- 任务失败原因 -->
        <view
          v-if="ppt.status === AiPptStatusEnum.FAIL && ppt.errorMessage"
          class="mt-16rpx rounded-8rpx bg-[#fff1f0] px-20rpx py-12rpx text-24rpx text-[#f5222d] leading-36rpx"
        >
          <view>任务已失败：{{ ppt.errorMessage }}</view>
          <view v-if="!readonly" class="text-22rpx text-[#999]">
            关闭后在列表点「继续生成」补齐
          </view>
        </view>

        <!-- 分镜阶段 -->
        <view
          v-if="slides.length === 0"
          class="mt-20rpx h-395rpx flex flex-col items-center justify-center gap-12rpx rounded-12rpx bg-[#f5f5f5] text-24rpx text-[#999]"
        >
          <template v-if="isRunning">
            <wd-loading size="40rpx" />
            <text>正在生成分镜…</text>
          </template>
          <text v-else>没有分镜</text>
        </view>

        <template v-else>
          <!-- 大图：左右滑动翻页 -->
          <swiper
            class="mt-20rpx h-395rpx overflow-hidden rounded-12rpx"
            :current="currentIndex"
            @change="handleSwiperChange"
          >
            <swiper-item v-for="slide in slides" :key="slide.index">
              <PptSlideImage :slide="slide" :running="isRunning" preview />
            </swiper-item>
          </swiper>
          <view
            v-if="currentSlide?.status === AiPptStatusEnum.FAIL && currentSlide.errorMessage"
            class="mt-12rpx text-24rpx text-[#f5222d]"
          >
            本页最近一次生成失败：{{ currentSlide.errorMessage }}
          </view>
          <!-- 翻页 -->
          <view class="mt-16rpx flex items-center justify-center gap-32rpx">
            <wd-button size="small" variant="plain" :disabled="currentIndex <= 0" @click="currentIndex--">
              <wd-icon name="arrow-left" size="28rpx" />
            </wd-button>
            <text class="text-26rpx text-[#333]">第 {{ currentIndex + 1 }} / {{ slides.length }} 页</text>
            <wd-button size="small" variant="plain" :disabled="currentIndex >= slides.length - 1" @click="currentIndex++">
              <wd-icon name="arrow-right" size="28rpx" />
            </wd-button>
          </view>

          <!-- 操作 -->
          <view class="mt-20rpx flex flex-wrap items-center justify-end gap-16rpx">
            <wd-button size="small" variant="plain" @click="showPrompt = !showPrompt">
              {{ showPrompt ? '隐藏提示词' : '显示提示词' }}
            </wd-button>
            <wd-button
              v-if="!readonly"
              size="small"
              type="primary"
              variant="plain"
              :disabled="isRunning || !currentSlide?.imageUrl"
              @click="openEdit"
            >
              修改
            </wd-button>
            <wd-button v-if="!readonly && ppt.status === AiPptStatusEnum.SUCCESS" size="small" type="primary" @click="emit('export', ppt)">
              导出
            </wd-button>
          </view>
          <view v-if="showPrompt" class="mt-16rpx whitespace-pre-wrap break-all rounded-12rpx bg-[#f8f8f8] p-20rpx text-24rpx text-[#333] leading-38rpx">
            {{ currentPrompt }}
          </view>

          <!-- 缩略图 -->
          <scroll-view scroll-x class="mt-20rpx whitespace-nowrap" :scroll-into-view="`ppt-thumb-${currentIndex}`">
            <view
              v-for="(slide, index) in slides"
              :id="`ppt-thumb-${index}`"
              :key="slide.index"
              class="relative mr-16rpx inline-block h-113rpx w-200rpx overflow-hidden border-4rpx rounded-8rpx border-solid"
              :class="index === currentIndex ? 'border-[#1677ff]' : 'border-transparent'"
              @click="currentIndex = index"
            >
              <PptSlideImage :slide="slide" :running="isRunning" />
              <view class="absolute left-6rpx top-6rpx rounded-4rpx bg-black/50 px-8rpx text-20rpx text-white">
                {{ slide.index }}
              </view>
            </view>
          </scroll-view>
        </template>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 修改本页 -->
  <PptSlideEditPopup v-if="!readonly" ref="editRef" :ppt="ppt" :slide="currentSlide" @success="handleEditSuccess" />
</template>

<script lang="ts" setup>
import type { Ppt, PptSlide } from '@/api/ai/ppt'
import { onHide, onShow } from '@dcloudio/uni-app'
import { computed, onUnmounted, ref, watch } from 'vue'
import { getPpt, getPptMy } from '@/api/ai/ppt'
import { AiPptStatusEnum, DICT_TYPE } from '@/utils/constants'
import PptSlideEditPopup from './ppt-slide-edit-popup.vue'
import PptSlideImage from './ppt-slide-image.vue'

const props = withDefaults(defineProps<{
  readonly?: boolean // 只读：管理端使用，没有修改、导出
}>(), {
  readonly: false,
})

const emit = defineEmits<{
  change: [ppt: Ppt] // 详情已刷新（轮询、重绘、切换版本），用于同步列表
  export: [ppt: Ppt] // 导出
}>()

const pollInterval = 3000 // 生成中时的刷新间隔
const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 首次加载状态
const ppt = ref<Ppt>() // 详情数据
const currentIndex = ref(0) // 当前页（slides 的下标）
const showPrompt = ref(false) // 是否显示当前页提示词
const editRef = ref<InstanceType<typeof PptSlideEditPopup>>() // 修改本页弹窗引用
const slides = computed<PptSlide[]>(() => ppt.value?.slides || []) // 分镜列表
const currentSlide = computed<PptSlide | undefined>(() => slides.value[currentIndex.value]) // 当前页
const isRunning = computed(() => ppt.value?.status === AiPptStatusEnum.IN_PROGRESS) // 任务是否生成中
const currentPrompt = computed(() => { // 当前页当前版本的完整提示词：重绘过的取对应版本，否则取分镜的提示词
  const slide = currentSlide.value
  if (!slide) {
    return ''
  }
  const image = slide.images?.find(item => item.url === slide.imageUrl)
  return image?.prompt || slide.imagePrompt
})
let pptId: number | undefined // 当前打开的 PPT 编号
let pollTimer: ReturnType<typeof setInterval> | undefined // 轮询定时器
let polling = false // 上一次轮询未返回时不再发起
let pageHidden = false // 页面是否隐藏：隐藏期间不开始轮询

/** 打开弹窗 */
async function open(id: number) {
  pptId = id
  ppt.value = undefined
  currentIndex.value = 0
  showPrompt.value = false
  visible.value = true
  loading.value = true
  try {
    await loadDetail()
    // 加载期间已关闭、卸载或页面隐藏时，不开始轮询；页面重新显示时由 onShow 恢复
    if (visible.value && pptId === id && !pageHidden) {
      startPolling()
    }
  } catch {
    visible.value = false // 加载失败时关闭弹窗，错误提示由请求层处理
  } finally {
    loading.value = false
  }
}

/** 加载详情：关闭或切换到其它 PPT 后，丢弃迟到的结果 */
async function loadDetail() {
  const id = pptId
  if (!id) {
    return
  }
  const data = props.readonly ? await getPpt(id) : await getPptMy(id)
  if (id !== pptId || !visible.value) {
    return
  }
  ppt.value = data
  if (currentIndex.value >= slides.value.length) {
    currentIndex.value = Math.max(slides.value.length - 1, 0)
  }
  if (!props.readonly) {
    emit('change', data)
  }
}

/** 滑动翻页 */
function handleSwiperChange(event: { detail: { current: number } }) {
  currentIndex.value = event.detail.current
}

/** 修改本页 */
function openEdit() {
  if (!currentSlide.value) {
    return
  }
  editRef.value?.open(currentPrompt.value)
}

/** 重绘或切换版本后：刷新详情，生成中由轮询继续跟进 */
async function handleEditSuccess() {
  await loadDetail()
}

/** 轮询：生成中时静默刷新详情 */
async function pollDetail() {
  if (!visible.value || !isRunning.value || loading.value || polling) {
    return
  }
  polling = true
  try {
    await loadDetail()
  } catch {
    // 轮询失败不打断预览，等待下一次刷新
  } finally {
    polling = false
  }
}

/** 开始轮询 */
function startPolling() {
  stopPolling()
  pollTimer = setInterval(pollDetail, pollInterval)
}

/** 停止轮询 */
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

/** 关闭弹窗：停止轮询，同时关闭修改本页 */
watch(visible, (value) => {
  if (!value) {
    stopPolling()
    editRef.value?.close()
    pptId = undefined
  }
})

/** 页面重新显示：弹窗打开时恢复轮询 */
onShow(() => {
  pageHidden = false
  if (visible.value) {
    startPolling()
  }
})

/** 页面隐藏：暂停轮询 */
onHide(() => {
  pageHidden = true
  stopPolling()
})

/** 卸载：停止轮询，并丢弃迟到的结果 */
onUnmounted(() => {
  stopPolling()
  pptId = undefined
})

defineExpose({ open })
</script>
