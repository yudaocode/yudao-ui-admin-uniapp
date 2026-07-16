<template>
  <view class="relative z-2 grid grid-cols-2 gap-100rpx px-100rpx pb-[calc(100rpx+env(safe-area-inset-bottom))]">
    <view
      class="flex flex-col items-center gap-18rpx"
      :class="rejectDisabled ? 'pointer-events-none opacity-60' : ''"
      @click="emit('reject')"
    >
      <view class="rtc-call-action bg-[#fa5151]">
        <wd-icon name="close" size="52rpx" color="#fff" />
      </view>
      <text class="text-26rpx text-white">拒绝</text>
    </view>
    <view
      class="flex flex-col items-center gap-18rpx"
      :class="acceptDisabled ? 'pointer-events-none opacity-60' : ''"
      @click="emit('accept')"
    >
      <view class="rtc-call-action bg-[#07c160]">
        <wd-icon name="phone" size="52rpx" color="#fff" />
      </view>
      <text class="text-26rpx text-white">接听</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  accepting: boolean // 是否正在接听
  rejecting: boolean // 是否正在拒绝
}>()

const emit = defineEmits<{
  accept: [] // 接听通话
  reject: [] // 拒绝通话
}>()

const acceptDisabled = computed(() => props.accepting || props.rejecting) // 接听按钮禁用状态
const rejectDisabled = computed(() => props.rejecting || props.accepting) // 拒绝按钮禁用状态
</script>

<style scoped>
.rtc-call-action {
  width: 124rpx;
  height: 124rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
</style>
