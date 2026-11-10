<template>
  <!-- 作品详情弹窗 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 86vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="px-24rpx pb-28rpx pt-24rpx">
      <view class="mb-20rpx flex items-center justify-between">
        <text class="text-32rpx text-[#222] font-semibold">作品详情</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <view v-if="loading" class="py-80rpx text-center">
        <wd-loading />
      </view>
      <scroll-view v-else-if="detail" scroll-y class="max-h-[72vh]">
        <!-- 基本信息 -->
        <view class="flex gap-24rpx">
          <view class="shrink-0">
            <wd-img v-if="detail.coverUrl" :src="detail.coverUrl" width="200rpx" height="200rpx" radius="12rpx" mode="aspectFill" enable-preview />
            <view v-else class="h-200rpx w-200rpx flex items-center justify-center rounded-12rpx bg-[#f5f5f5]">
              <wd-icon name="headset" size="72rpx" color="#bbb" />
            </view>
          </view>
          <view class="min-w-0 flex-1">
            <view class="break-all text-32rpx text-[#333] font-semibold">
              {{ getMusicTitle(detail.title) }}
            </view>
            <view class="line-clamp-2 mt-8rpx text-24rpx text-[#999]">
              {{ detail.tags || detail.prompt || '' }}
            </view>
            <view class="mt-8rpx text-26rpx text-[#666]">
              {{ detail.userNickname || '' }}
            </view>
            <view class="mt-8rpx text-22rpx text-[#999]">
              {{ formatDateTime(detail.createTime) }} · {{ detail.model }} · {{ formatMusicDuration(detail.duration) }}
            </view>
          </view>
        </view>

        <!-- 操作 -->
        <view class="mt-20rpx flex flex-wrap gap-16rpx">
          <wd-button size="small" type="primary" :disabled="!canPlay" @click="emit('play', detail)">
            播放 {{ detail.playCount || 0 }}
          </wd-button>
          <wd-button v-if="canPlay" size="small" variant="plain" @click="handleCopy(detail.audioUrl!)">
            复制音频地址
          </wd-button>
          <wd-button v-if="detail.videoUrl" size="small" variant="plain" @click="handleCopy(detail.videoUrl)">
            复制视频地址
          </wd-button>
        </view>

        <!-- 状态 -->
        <view v-if="detail.status !== AiMusicStatusEnum.SUCCESS" class="mt-20rpx flex items-center gap-12rpx">
          <dict-tag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="detail.status" />
          <text v-if="detail.status === AiMusicStatusEnum.FAIL" class="text-24rpx text-[#f5222d]">
            {{ detail.errorMessage }}
          </text>
        </view>

        <!-- 歌词 -->
        <view class="mb-12rpx mt-28rpx text-28rpx text-[#333] font-semibold">
          歌词
        </view>
        <view class="whitespace-pre-wrap rounded-8rpx bg-[#f8f8f8] p-24rpx text-26rpx text-[#333] leading-44rpx">
          {{ detail.lyric || (detail.makeInstrumental ? '纯音乐，无歌词' : '暂无歌词') }}
        </view>

        <!-- 来源 -->
        <view class="mb-8rpx mt-28rpx text-28rpx text-[#333] font-semibold">
          来源
        </view>
        <view class="text-24rpx text-[#999]">
          {{ sourceText }}
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Music } from '@/api/ai/music'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getMusicDetail } from '@/api/ai/music'
import { getDictLabel } from '@/hooks/useDict'
import { AiMusicGenerateModeEnum, AiMusicStatusEnum, DICT_TYPE, formatMusicDuration, getMusicTitle } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const emit = defineEmits<{
  play: [item: Music]
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 加载状态
const detail = ref<Music>() // 详情数据
const canPlay = computed(() => detail.value?.status === AiMusicStatusEnum.SUCCESS && !!detail.value?.audioUrl) // 是否可播放
const sourceText = computed(() => { // 来源文案
  const item = detail.value
  if (!item) {
    return ''
  }
  const mode = getDictLabel(DICT_TYPE.AI_GENERATE_MODE, item.generateMode) || '-'
  if (item.generateMode === AiMusicGenerateModeEnum.EXTEND && item.refMusicId) {
    return `${mode} · 续写自 #${item.refMusicId}，从 ${formatMusicDuration(item.extendSeconds)} 起`
  }
  if (item.generateMode === AiMusicGenerateModeEnum.CONCAT && item.refMusicId) {
    return `${mode} · 由续写作品 #${item.refMusicId} 与原曲合并`
  }
  return mode
})

/** 打开：本人或已公开的作品；无权查看时后端返回“音乐不存在” */
async function open(id: number) {
  visible.value = true
  detail.value = undefined
  loading.value = true
  try {
    detail.value = await getMusicDetail(id)
  } catch {
    visible.value = false
  } finally {
    loading.value = false
  }
}

/** 复制地址 */
function handleCopy(url: string) {
  uni.setClipboardData({
    data: url,
    success: () => toast.success('已复制地址'),
  })
}

defineExpose({ open })
</script>
