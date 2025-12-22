<script lang="ts" setup>
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationStyle: 'custom',
  },
})

function handleBack() {
  navigateBackPlus()
}
</script>

<template>
  <view class="yd-page-container flex flex-col">
    <wd-navbar
      title="页面不存在"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="flex flex-1 flex-col items-center bg-white px-48rpx pt-1/3">
      <wd-icon name="warning" size="96rpx" color="#faad14" />
      <view class="mt-24rpx text-34rpx text-[#333] font-semibold">
        404
      </view>
      <view class="mt-16rpx text-center text-28rpx text-[#666] leading-44rpx">
        抱歉，您访问的页面不存在
      </view>

      <view class="mt-32rpx w-full">
        <wd-button :block="true" :plain="true" @click="handleBack">
          返回
        </wd-button>
      </view>
    </view>
  </view>
</template>
