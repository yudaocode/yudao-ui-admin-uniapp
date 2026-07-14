<template>
  <view class="flex items-center gap-16rpx bg-[#e8f7ec] px-24rpx py-18rpx" @click="emit('join')">
    <wd-icon name="phone" size="34rpx" color="#07c160" />
    <text class="line-clamp-1 min-w-0 flex-1 text-27rpx text-[#16733d]">群通话进行中，点击加入</text>
    <wd-icon name="arrow-right" size="30rpx" color="#8aa994" />
  </view>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  join: []
}>()
</script>
