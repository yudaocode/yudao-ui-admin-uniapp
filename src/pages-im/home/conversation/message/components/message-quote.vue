<template>
  <view
    class="rounded-8rpx bg-black/5 px-16rpx py-10rpx text-24rpx text-[#666] leading-34rpx"
    @click.stop="emit('click')"
  >
    <text selectable>{{ title }}</text>
  </view>
</template>

<script lang="ts" setup>
defineProps<{
  title: string // 引用展示文案：发送人：内容摘要
}>()

const emit = defineEmits<{
  click: [] // 点击引用块（滚动到原消息）
}>()
</script>
