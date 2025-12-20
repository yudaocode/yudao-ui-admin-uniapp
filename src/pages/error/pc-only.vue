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
      title="仅支持 PC"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="flex flex-1 flex-col items-center bg-white px-48rpx pt-1/3">
      <wd-icon name="laptop" size="96rpx" color="#1677ff" />
      <view class="mt-24rpx text-34rpx text-[#333] font-semibold">
        该功能仅支持 PC
      </view>
      <view class="mt-16rpx text-center text-28rpx text-[#666] leading-44rpx">
        由于移动端操作不便，请在电脑端打开管理后台完成相关操作。
      </view>

      <view class="mt-32rpx w-full">
        <wd-button :block="true" :plain="true" @click="handleBack">
          返回
        </wd-button>
      </view>
    </view>
  </view>
</template>
