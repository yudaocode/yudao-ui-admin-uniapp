<template>
  <!-- 查看大纲弹窗（素材 + 分镜），只读 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 86vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="px-24rpx pb-28rpx pt-24rpx">
      <view class="mb-20rpx flex items-center justify-between gap-16rpx">
        <text class="min-w-0 flex-1 truncate text-32rpx text-[#222] font-semibold">
          {{ ppt ? `查看大纲 · ${ppt.title}` : '查看大纲' }}
        </text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <view v-if="loading" class="py-80rpx text-center">
        <wd-loading />
      </view>
      <scroll-view v-else-if="ppt" scroll-y class="max-h-[72vh]">
        <!-- 素材 -->
        <view class="mb-12rpx flex flex-wrap items-center justify-between gap-8rpx">
          <text class="text-28rpx text-[#333] font-semibold">素材</text>
          <text class="text-22rpx text-[#999]">
            来源：{{ ppt.source === AiPptSourceEnum.UPLOAD ? '上传材料' : '粘贴大纲' }} ·
            {{ ppt.mode === AiPptModeEnum.SLIDES ? '演示用幻灯片' : '详细演示文稿' }} ·
            {{ formatPptLanguage(ppt.language) }} · {{ ppt.pageCount }} 页
          </text>
        </view>
        <scroll-view scroll-y class="max-h-480rpx rounded-12rpx bg-[#f8f8f8]">
          <view class="whitespace-pre-wrap break-all p-20rpx text-26rpx text-[#333] leading-40rpx">
            {{ ppt.content || '（材料尚未读取）' }}
          </view>
        </scroll-view>
        <view v-if="ppt.source === AiPptSourceEnum.UPLOAD" class="mt-8rpx text-22rpx text-[#999]">
          上传材料时为读取出的文本，超过 25000 字的部分已截断
        </view>

        <!-- 分镜 -->
        <view class="mb-12rpx mt-28rpx text-28rpx text-[#333] font-semibold">
          分镜（共 {{ slides.length }} 页）
        </view>
        <view v-if="slides.length === 0" class="py-40rpx text-center text-24rpx text-[#999]">
          还没有分镜
        </view>
        <view
          v-for="slide in slides"
          :key="slide.index"
          class="mb-16rpx flex gap-16rpx border-2rpx border-[#f0f0f0] rounded-12rpx border-solid p-20rpx"
        >
          <view class="h-44rpx w-44rpx flex shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-22rpx text-[#1677ff]">
            {{ slide.index }}
          </view>
          <view class="min-w-0 flex-1 text-26rpx leading-40rpx">
            <view class="text-[#333] font-semibold">
              <text v-if="slide.theme" class="text-[#999]">{{ slide.theme }} · </text>
              <text>{{ slide.title || '-' }}</text>
            </view>
            <view v-for="(point, index) in slide.points || []" :key="index" class="mt-4rpx text-[#666]">
              · {{ point }}
            </view>
          </view>
        </view>
        <view class="mt-8rpx text-22rpx text-[#999]">
          说明：标题和要点只是分镜记录；幻灯片上真正显示的文字画在整页图里。
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Ppt } from '@/api/ai/ppt'
import { computed, ref } from 'vue'
import { getPpt, getPptMy } from '@/api/ai/ppt'
import { AiPptModeEnum, AiPptSourceEnum, formatPptLanguage } from '@/utils/constants'

const props = withDefaults(defineProps<{
  readonly?: boolean // 管理端：使用管理端的详情接口
}>(), {
  readonly: false,
})

const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 加载状态
const ppt = ref<Ppt>() // 详情数据
const slides = computed(() => ppt.value?.slides || []) // 分镜列表

/** 打开弹窗 */
async function open(id: number) {
  visible.value = true
  ppt.value = undefined
  loading.value = true
  try {
    ppt.value = props.readonly ? await getPpt(id) : await getPptMy(id)
  } catch {
    visible.value = false // 加载失败时关闭弹窗，错误提示由请求层处理
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
