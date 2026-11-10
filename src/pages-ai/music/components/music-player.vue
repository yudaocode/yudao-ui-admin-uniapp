<template>
  <!-- 底部播放器 -->
  <view v-if="current" class="bg-white px-24rpx pb-[calc(16rpx+env(safe-area-inset-bottom))] pt-16rpx shadow-[0_-4rpx_20rpx_rgba(0,0,0,0.06)]">
    <view class="flex items-center gap-16rpx">
      <!-- 当前歌曲 -->
      <view class="shrink-0">
        <wd-img v-if="current.coverUrl" :src="current.coverUrl" width="80rpx" height="80rpx" radius="8rpx" mode="aspectFill" />
        <view v-else class="h-80rpx w-80rpx flex items-center justify-center rounded-8rpx bg-[#f5f5f5]">
          <wd-icon name="headset" size="40rpx" color="#bbb" />
        </view>
      </view>
      <view class="min-w-0 flex-1">
        <view class="truncate text-28rpx text-[#333] font-semibold">
          {{ getMusicTitle(current.title) }}
        </view>
        <view class="truncate text-22rpx text-[#999]">
          {{ current.tags || current.userNickname || '' }}
        </view>
      </view>

      <!-- 控制 -->
      <view class="flex shrink-0 items-center gap-20rpx">
        <wd-icon name="skip-previous-fill" size="44rpx" :color="hasPrev ? '#333' : '#ccc'" @click="playPrev" />
        <wd-icon :name="playing ? 'pause-circle-fill' : 'play-circle-fill'" size="64rpx" color="#1677ff" @click="togglePlay" />
        <wd-icon name="skip-next-fill" size="44rpx" :color="hasNext ? '#333' : '#ccc'" @click="playNext" />
        <wd-icon name="close" size="36rpx" color="#999" @click="close" />
      </view>
    </view>

    <!-- 进度 -->
    <view class="mt-8rpx flex items-center gap-16rpx">
      <text class="w-72rpx text-right text-22rpx text-[#999]">{{ formatMusicDuration(currentTime) }}</text>
      <view class="min-w-0 flex-1">
        <wd-slider
          v-model="sliderValue"
          :max="sliderMax"
          :disabled="!duration"
          popover-visible="never"
          @dragstart="seeking = true"
          @change="handleSeek"
        />
      </view>
      <text class="w-72rpx text-22rpx text-[#999]">{{ formatMusicDuration(duration || current.duration) }}</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Music } from '@/api/ai/music'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onUnmounted, ref, watch } from 'vue'
import { playMusic } from '@/api/ai/music'
import { formatMusicDuration, getMusicTitle } from '@/utils/constants'

const emit = defineEmits<{
  change: [state: { id?: number, playing: boolean }] // 当前歌曲、播放状态变化
}>()

const toast = useToast()
const playlist = ref<Music[]>([]) // 播放列表：当前列表中可播放的作品
const current = ref<Music>() // 当前歌曲
const playing = ref(false) // 是否播放中
const currentTime = ref(0) // 当前进度（秒）
const duration = ref(0) // 总时长（秒）
const sliderValue = ref(0) // 进度条的值；拖动时不跟随播放进度
const seeking = ref(false) // 是否拖动进度条中
const sliderMax = computed(() => duration.value > 0 ? Math.floor(duration.value) : 1) // 进度条上限；时长未知时占位
const currentIndex = computed(() => playlist.value.findIndex(item => item.id === current.value?.id)) // 当前歌曲在播放列表的位置
const hasPrev = computed(() => currentIndex.value > 0) // 是否有上一首
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < playlist.value.length - 1) // 是否有下一首
let countingId: number | undefined // 待记录播放次数的歌曲编号：首次开始播放时记录

const audio = uni.createInnerAudioContext() // 音频播放上下文
audio.onPlay(() => {
  playing.value = true
  // 记录播放次数，失败不影响播放
  const music = current.value
  if (music && countingId === music.id) {
    countingId = undefined
    playMusic(music.id).catch(() => {})
    music.playCount = (music.playCount || 0) + 1
  }
})
audio.onPause(() => {
  playing.value = false
})
audio.onStop(() => {
  playing.value = false
})
audio.onTimeUpdate(() => {
  currentTime.value = audio.currentTime || 0
  if (audio.duration && Number.isFinite(audio.duration)) {
    duration.value = audio.duration
  }
  if (!seeking.value) {
    sliderValue.value = Math.floor(currentTime.value)
  }
})
audio.onEnded(() => {
  playing.value = false
  if (hasNext.value) {
    playNext()
  }
})
audio.onError(() => {
  playing.value = false
  if (current.value) {
    toast.error('音频加载失败')
  }
})

/**
 * 播放：同一首则切换播放 / 暂停；新歌曲从头播放，并记录一次播放
 *
 * @param music 歌曲
 * @param list 播放列表，用于上一首、下一首
 */
function play(music: Music, list?: Music[]) {
  if (list) {
    playlist.value = list.filter(item => !!item.audioUrl)
  }
  if (current.value?.id === music.id) {
    togglePlay()
    return
  }
  start(music)
}

/** 从头播放歌曲 */
function start(music: Music) {
  if (!music.audioUrl) {
    return
  }
  current.value = music
  currentTime.value = 0
  sliderValue.value = 0
  duration.value = music.duration || 0
  countingId = music.id
  audio.stop()
  audio.src = music.audioUrl
  audio.play()
}

/** 播放 / 暂停 */
function togglePlay() {
  if (!current.value) {
    return
  }
  if (playing.value) {
    audio.pause()
  } else {
    audio.play()
  }
}

/** 上一首 */
function playPrev() {
  if (hasPrev.value) {
    start(playlist.value[currentIndex.value - 1])
  }
}

/** 下一首 */
function playNext() {
  if (hasNext.value) {
    start(playlist.value[currentIndex.value + 1])
  }
}

/** 拖动进度条结束：跳转播放位置 */
function handleSeek(value: number | number[]) {
  seeking.value = false
  audio.seek(Array.isArray(value) ? value[0] : value)
}

/** 关闭播放器 */
function close() {
  audio.stop()
  current.value = undefined
  playing.value = false
  countingId = undefined
}

/** 监听当前歌曲、播放状态变化 */
watch([() => current.value?.id, playing], ([id, value]) => emit('change', { id, playing: value }))

/** 卸载：销毁音频上下文 */
onUnmounted(() => {
  audio.destroy()
})

defineExpose({ play, close })
</script>
