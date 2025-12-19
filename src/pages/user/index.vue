<template>
  <view class="yd-page-container">
    <!-- 顶部背景区域 -->
    <view class="header-bg h-120rpx w-full flex items-center justify-center" />

    <!-- 用户信息卡片 -->
    <view class="relative mx-24rpx -mt-60rpx">
      <view
        class="user-card flex items-center rounded-12rpx bg-white p-32rpx"
        @click="handleGoProfile"
      >
        <view class="avatar-wrapper mr-24rpx h-120rpx w-120rpx overflow-hidden rounded-full">
          <image
            :src="userInfo.avatar"
            mode="aspectFill"
            class="h-full w-full"
          />
        </view>
        <view class="flex-1">
          <view class="mb-8rpx text-40rpx text-[#323333] font-semibold">
            {{ userInfo.nickname || userInfo.username }}
          </view>
          <view class="text-30rpx text-[#777]">
            {{ userProfile ? (userProfile.dept?.name || '暂无部门') : '' }}
          </view>
        </view>
      </view>
    </view>

    <!-- 菜单区域 -->
    <view class="mx-24rpx mt-32rpx">
      <wd-cell-group custom-class="menu-group" border>
        <wd-cell title="个人资料" is-link @click="handleGoProfile">
          <template #icon>
            <wd-icon name="user" size="20px" color="#1890ff" class="mr-16rpx" />
          </template>
        </wd-cell>
        <wd-cell title="账号安全" is-link @click="handleGoSecurity">
          <template #icon>
            <wd-icon name="lock-on" size="20px" color="#52c41a" class="mr-16rpx" />
          </template>
        </wd-cell>
      </wd-cell-group>
      <wd-cell-group custom-class="menu-group mt-24rpx" border>
        <wd-cell title="常见问题" is-link @click="handleGoFaq">
          <template #icon>
            <wd-icon name="warning" size="20px" color="#faad14" class="mr-16rpx" />
          </template>
        </wd-cell>
        <wd-cell title="意见反馈" is-link @click="handleGoFeedback">
          <template #icon>
            <wd-icon name="edit" size="20px" color="#722ed1" class="mr-16rpx" />
          </template>
        </wd-cell>
        <wd-cell title="联系客服" is-link @click="handleGoContact">
          <template #icon>
            <wd-icon name="phone" size="20px" color="#13c2c2" class="mr-16rpx" />
          </template>
        </wd-cell>
        <wd-cell title="应用设置" is-link @click="handleGoSettings">
          <template #icon>
            <wd-icon name="setting" size="20px" color="#1890ff" class="mr-16rpx" />
          </template>
        </wd-cell>
      </wd-cell-group>
      <view class="mt-48rpx">
        <wd-button block type="error" @click="handleLogout">
          退出登录
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { UserProfileVO } from '@/api/system/user/profile'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getUserProfile } from '@/api/system/user/profile'
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'

definePage({
  style: {
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const toast = useToast()
const { userInfo } = storeToRefs(userStore)
const userProfile = ref<UserProfileVO | null>(null) // 用户详细信息

/** 页面加载时获取用户信息 */
onMounted(async () => {
  userProfile.value = await getUserProfile()
  await userStore.fetchUserInfo()
})

/** 跳转到个人资料 */
function handleGoProfile() {
  uni.navigateTo({ url: '/pages/user/profile/index' })
}

/** 跳转到账号安全 */
function handleGoSecurity() {
  uni.navigateTo({ url: '/pages/user/security/index' })
}

/** 跳转到常见问题 */
function handleGoFaq() {
  uni.navigateTo({ url: '/pages/user/faq/index' })
}

/** 跳转到意见反馈 */
function handleGoFeedback() {
  uni.navigateTo({ url: '/pages/user/feedback/index' })
}

/** 跳转联系客服 */
function handleGoContact() {
  uni.navigateTo({ url: '/pages/user/contact/index' })
}

/** 跳转到应用设置 */
function handleGoSettings() {
  uni.navigateTo({ url: '/pages/user/settings/index' })
}

/** 退出登录 */
function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      await tokenStore.logout()
      toast.success('退出登录成功')
      setTimeout(() => {
        uni.reLaunch({ url: LOGIN_PAGE })
      }, 500)
    },
  })
}
</script>

<style lang="scss" scoped>
// 顶部渐变背景
.header-bg {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
}

// 用户卡片阴影
.user-card {
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
}

// 头像边框
.avatar-wrapper {
  border: 4rpx solid #f5f5f5;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

// 菜单组样式
:deep(.menu-group) {
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 3rpx 8rpx rgba(24, 144, 255, 0.06);
}
</style>
