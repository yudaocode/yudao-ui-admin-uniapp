<template>
  <!-- 样音播放：点击播放、暂停 -->
  <view class="min-w-0 flex items-center gap-12rpx" @click="handleToggle">
    <wd-icon :name="playing ? 'pause-circle' : 'play-circle'" size="44rpx" color="#1677ff" />
    <text class="truncate text-24rpx text-[#666]">{{ label || (playing ? '播放中' : '播放') }}</text>
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  url: string // 音频地址
  label?: string // 展示文案
}>()

const toast = useToast()
const playing = ref(false) // 是否播放中
let audio: UniApp.InnerAudioContext | undefined // 音频播放器

/** 创建播放器：首次播放时创建 */
function ensureAudio() {
  if (audio) {
    return audio
  }
  audio = uni.createInnerAudioContext()
  audio.src = props.url
  audio.onEnded(() => (playing.value = false))
  audio.onPause(() => (playing.value = false))
  audio.onStop(() => (playing.value = false))
  audio.onError(() => {
    playing.value = false
    toast.error('音频播放失败')
  })
  return audio
}

/** 播放、暂停 */
function handleToggle() {
  const player = ensureAudio()
  if (playing.value) {
    player.pause()
    return
  }
  player.play()
  playing.value = true
}

/** 地址变化（例如换了样音）：释放旧播放器，再次点击时按新地址创建 */
watch(() => props.url, () => {
  audio?.destroy()
  audio = undefined
  playing.value = false
})

/** 卸载：释放播放器 */
onBeforeUnmount(() => {
  audio?.destroy()
  audio = undefined
})
</script>
