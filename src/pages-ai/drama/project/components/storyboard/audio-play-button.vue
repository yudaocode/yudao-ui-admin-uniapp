<template>
  <!-- 音频播放按钮：点击播放 / 暂停 -->
  <view class="inline-flex items-center gap-8rpx" @click.stop="handleToggle">
    <wd-icon :name="playing ? 'pause-circle-fill' : 'play-circle-fill'" size="52rpx" color="#1677ff" />
    <text class="text-24rpx text-[#1677ff]">{{ playing ? '暂停' : '播放' }}</text>
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  url: string // 音频地址
}>()

const toast = useToast()
const playing = ref(false) // 是否播放中

const audio = uni.createInnerAudioContext() // 音频播放上下文
audio.onPlay(() => {
  playing.value = true
})
audio.onPause(() => {
  playing.value = false
})
audio.onStop(() => {
  playing.value = false
})
audio.onEnded(() => {
  playing.value = false
})
audio.onError(() => {
  playing.value = false
  toast.error('音频加载失败')
})

/** 播放 / 暂停 */
function handleToggle() {
  if (playing.value) {
    audio.pause()
    return
  }
  audio.src = props.url
  audio.play()
}

/** 地址变化（例如换了样音）：停止旧音频，再次点击时播放新地址 */
watch(() => props.url, () => {
  audio.stop()
  playing.value = false
})

/** 卸载：销毁音频上下文 */
onUnmounted(() => {
  audio.destroy()
})
</script>
