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
import { getAvatarBgColor, getAvatarText } from '@/pages-im/utils/user'

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

const letter = computed(() => getAvatarText(props.name))
const fallbackStyle = computed(() => { // 无头像时按 PC 规则稳定分配底色
  if (props.src) {
    return {}
  }
  return {
    backgroundColor: getAvatarBgColor(props.name),
    color: '#fff',
  }
})
const fontSize = computed(() => {
  const value = Number.parseInt(props.size)
  return Number.isNaN(value) ? '32rpx' : `${Math.max(22, Math.floor(value * 0.42))}rpx`
})
</script>
