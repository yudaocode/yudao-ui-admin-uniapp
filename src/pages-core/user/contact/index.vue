<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="联系客服"
      left-arrow
      placeholder
      safe-area-inset-top
      fixed
      @click-left="handleBack"
    />

    <!-- 客服卡片 -->
    <view class="mx-30rpx mt-20rpx rounded-16rpx bg-white px-60rpx py-80rpx">
      <view class="flex flex-col items-center">
        <!-- 二维码图片 -->
        <view class="mb-30rpx h-280rpx w-280rpx overflow-hidden rounded-16rpx">
          <wd-img
            :src="qrCodeUrl"
            width="280rpx"
            height="280rpx"
            mode="aspectFit"
          />
        </view>
        <text class="mb-40rpx text-32rpx text-gray-800 font-bold">
          添加客服二维码
        </text>
        <text class="mb-16rpx text-28rpx text-gray-500">
          服务时间：早上 9:00 - 22:00
        </text>

        <!-- 客服电话 -->
        <view class="flex items-center text-28rpx text-gray-500">
          <text>客服电话：{{ servicePhone }}</text>
          <text
            class="ml-10rpx text-blue-500 underline"
            @click="handleCallPhone"
          >
            拨打
          </text>
        </view>

        <!-- 保存按钮 -->
        <view class="mt-60rpx w-full">
          <wd-button type="primary" block @click="handleSaveQRCode">
            保存二维码图片
          </wd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { navigateBackPlus } from '@/utils'
import { saveImageToAlbum, staticUrl } from '@/utils/download'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()

const qrCodeUrl = ref(staticUrl('/static/qrcode.png')) // 客服二维码图片地址
const servicePhone = ref('18818818818') // 客服电话号码

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/user/index')
}

/** 拨打电话 */
function handleCallPhone() {
  uni.makePhoneCall({
    phoneNumber: servicePhone.value,
    fail: (_err) => {
      toast.show('拨打失败')
    },
  })
}

/** 保存二维码图片 */
async function handleSaveQRCode() {
  await saveImageToAlbum(qrCodeUrl.value, 'weixin_qrcode.png')
}
</script>
