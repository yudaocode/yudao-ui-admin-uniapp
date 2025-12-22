<template>
  <view class="mx-20rpx mt-20rpx overflow-hidden rounded-16rpx bg-white">
    <wd-swiper
      :list="banners"
      autoplay
      :interval="5000"
      indicator-position="bottom-right"
      image-mode="aspectFill"
      height="300rpx"
      custom-class="rounded-16rpx overflow-hidden"
      @click="handleClick"
    />
  </view>
</template>

<script lang="ts" setup>
import { staticUrl } from '@/utils/download'

defineOptions({
  name: 'HomeBanner',
})

/** Banner 轮播图数据 */
const banners: string[] = [
  staticUrl('/static/banner/banner01.png'),
  staticUrl('/static/banner/banner02.png'),
  staticUrl('/static/banner/banner03.png'),
]

/** 处理点击 */
function handleClick(index: number) {
  // TODO @芋艿：看看后续要不要支持跳转
  console.log('点击了第', index + 1, '张 Banner')
}
</script>
