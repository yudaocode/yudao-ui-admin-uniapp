<template>
  <view class="header flex flex-col items-center pb-60rpx pt-120rpx">
    <image class="mb-24rpx h-160rpx w-160rpx" src="/static/logo.svg" mode="aspectFit" />
    <view class="text-44rpx text-[#1890ff] font-bold">
      {{ title }}
    </view>
  </view>
</template>

<script lang="ts" setup>
const title = import.meta.env.VITE_APP_TITLE // 应用标题
</script>
