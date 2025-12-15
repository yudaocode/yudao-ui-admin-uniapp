<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="账号安全"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 安全设置区域 -->
    <wd-cell-group custom-class="cell-group" border>
      <wd-cell title="修改密码" is-link @click="handleChangePassword">
        <template #icon>
          <wd-icon name="lock-on" size="20px" color="#1890ff" class="mr-16rpx" />
        </template>
      </wd-cell>
    </wd-cell-group>

    <!-- 第三方绑定区域 -->
    <wd-cell-group custom-class="cell-group mt-24rpx" border>
      <wd-cell title="微信小程序" is-link @click="handleBindWechatMiniProgram">
        <template #icon>
          <wd-icon name="chat" size="20px" color="#07c160" class="mr-16rpx" />
        </template>
        <view class="text-[#999]">未绑定</view>
      </wd-cell>
      <wd-cell title="微信公众号" is-link @click="handleBindWechatOfficialAccount">
        <template #icon>
          <wd-icon name="chat" size="20px" color="#07c160" class="mr-16rpx" />
        </template>
        <view class="text-[#999]">未绑定</view>
      </wd-cell>
    </wd-cell-group>

    <!-- 修改密码弹窗 -->
    <PasswordForm v-model="showPasswordPopup" />
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { navigateBackPlus } from '@/utils'
import PasswordForm from './components/password-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const showPasswordPopup = ref(false) // 密码弹窗相关

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/user/index')
}

/** 打开修改密码弹窗 */
function handleChangePassword() {
  showPasswordPopup.value = true
}

/** 绑定微信小程序 */
function handleBindWechatMiniProgram() {
  toast.info('正在开发中')
}

/** 绑定微信公众号 */
function handleBindWechatOfficialAccount() {
  toast.info('正在开发中')
}
</script>

<style lang="scss" scoped>
:deep(.cell-group) {
  margin: 24rpx;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 3rpx 8rpx rgba(24, 144, 255, 0.06);
}
</style>
