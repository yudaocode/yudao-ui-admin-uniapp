<template>
  <view
    class="flex items-center gap-16rpx border-b border-b-[#eee] bg-[#fff8e8] px-24rpx py-18rpx"
    @click="emit('open')"
  >
    <wd-icon name="usergroup-add" size="32rpx" color="#d48806" />
    <text class="min-w-0 flex-1 text-26rpx text-[#8f5b00]">{{ count }} 条入群申请待处理</text>
    <wd-icon name="arrow-right" size="30rpx" color="#b99a61" />
  </view>
</template>

<script lang="ts" setup>
defineProps<{
  count: number
}>()

const emit = defineEmits<{
  open: []
}>()
</script>
