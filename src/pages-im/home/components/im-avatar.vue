<template>
  <view
    class="flex flex-shrink-0 items-center justify-center overflow-hidden font-semibold"
    :class="round ? 'rounded-full' : 'rounded-12rpx'"
    :style="{ width: size, height: size, fontSize, ...fallbackStyle }"
  >
    <wd-img v-if="src" :src="src" width="100%" height="100%" mode="aspectFill" />
    <text v-else>{{ letter }}</text>
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name?: string
  round?: boolean
  size?: string
  src?: string
}>(), {
  name: '',
  round: true,
  size: '80rpx',
  src: '',
})

const letter = computed(() => (props.name || '?').charAt(0))
const fallbackStyle = computed(() => { // 无头像时按名称稳定分配柔和底色
  if (props.src) {
    return {}
  }
  const palettes = [
    { backgroundColor: '#dceeff', color: '#1677ff' },
    { backgroundColor: '#dff4e8', color: '#32965d' },
    { backgroundColor: '#fff0d8', color: '#c97812' },
    { backgroundColor: '#eee7ff', color: '#7457c8' },
    { backgroundColor: '#ffe5e7', color: '#d64f5f' },
  ]
  const hash = Array.from(props.name || '?').reduce((sum, char) => sum + (char.codePointAt(0) || 0), 0)
  return palettes[hash % palettes.length]
})
const fontSize = computed(() => {
  const value = Number.parseInt(props.size)
  return Number.isNaN(value) ? '32rpx' : `${Math.max(22, Math.floor(value * 0.42))}rpx`
})
</script>
