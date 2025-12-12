<template>
  <view class="mx-20rpx mt-20rpx overflow-hidden rounded-16rpx bg-white">
    <view class="flex items-center p-24rpx">
      <view class="avatar-wrapper mr-20rpx h-100rpx w-100rpx overflow-hidden rounded-full">
        <image
          :src="userInfo.avatar"
          mode="aspectFill"
          class="h-full w-full"
        />
      </view>
      <view class="flex-1">
        <view class="text-32rpx text-#333 font-500">
          {{ greeting }}，{{ userInfo.nickname || userInfo.username }}
        </view>
        <view class="mt-8rpx text-26rpx text-#999">
          {{ description }}
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store'

defineOptions({
  name: 'UserHeader',
})

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

/** 根据时间获取问候语 */
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) {
    return '凌晨好'
  } else if (hour < 9) {
    return '早上好'
  } else if (hour < 12) {
    return '上午好'
  } else if (hour < 14) {
    return '中午好'
  } else if (hour < 17) {
    return '下午好'
  } else if (hour < 19) {
    return '傍晚好'
  } else {
    return '晚上好'
  }
})

/** 描述语 */
const description = computed(() => {
  const hour = new Date().getHours()
  if (hour < 9) {
    return '开始新的一天，加油！'
  } else if (hour < 12) {
    return '工作顺利，效率满满！'
  } else if (hour < 14) {
    return '午休时间，记得休息~'
  } else if (hour < 18) {
    return '继续努力，收获满满！'
  } else {
    return '辛苦了，注意休息！'
  }
})
</script>

<style lang="scss" scoped>
.avatar-wrapper {
  border: 3rpx solid #f0f0f0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}
</style>
