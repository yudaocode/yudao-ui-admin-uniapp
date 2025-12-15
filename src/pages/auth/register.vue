<template>
  <view class="auth-container">
    <!-- 顶部 -->
    <Header />

    <!-- 表单区域 -->
    <view class="form-container">
      <TenantPicker ref="tenantPickerRef" />
      <view class="input-item">
        <wd-icon name="user" size="20px" color="#1890ff" />
        <wd-input
          v-model="formData.username"
          placeholder="请输入用户名"
          clearable
          clear-trigger="focus"
          no-border
        />
      </view>
      <view class="input-item">
        <wd-icon name="person" size="20px" color="#1890ff" />
        <wd-input
          v-model="formData.nickname"
          placeholder="请输入昵称"
          clearable
          clear-trigger="focus"
          no-border
        />
      </view>
      <view class="input-item">
        <wd-icon name="lock-on" size="20px" color="#1890ff" />
        <wd-input
          v-model="formData.password"
          placeholder="请输入密码"
          clearable
          clear-trigger="focus"
          show-password
          no-border
        />
      </view>
      <view class="input-item">
        <wd-icon name="lock-on" size="20px" color="#1890ff" />
        <wd-input
          v-model="formData.confirmPassword"
          placeholder="请确认密码"
          clearable
          clear-trigger="focus"
          show-password
          no-border
        />
      </view>
      <view v-if="captchaEnabled">
        <Verify
          ref="verifyRef"
          :captcha-type="captchaType"
          explain="向右滑动完成验证"
          :img-size="{ width: '300px', height: '150px' }"
          mode="pop"
          @success="verifySuccess"
        />
      </view>

      <!-- 用户协议 -->
      <view class="mb-24rpx flex items-center">
        <wd-checkbox v-model="agreePolicy" shape="square" />
        <text class="text-24rpx text-[#666]">我已阅读并同意</text>
        <text class="text-24rpx text-[#1890ff]" @click="goToUserAgreement">
          《用户协议》
        </text>
        <text class="text-24rpx text-[#666]">与</text>
        <text class="text-24rpx text-[#1890ff]" @click="goToPrivacyPolicy">
          《隐私政策》
        </text>
      </view>

      <!-- 注册按钮 -->
      <wd-button
        block
        :loading="loading"
        type="primary"
        @click="handleRegister"
      >
        注册
      </wd-button>

      <!-- 已有账号 -->
      <view class="mt-40rpx flex items-center justify-center">
        <text class="text-28rpx text-[#666]">已有账号？</text>
        <text class="text-28rpx text-[#1890ff]" @click="goToLogin">去登录</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { Verify } from '@/components/verifition'
import { LOGIN_PAGE } from '@/router/config'
import { useTokenStore } from '@/store/token'
import { redirectAfterLogin } from '@/utils'
import Header from './components/header.vue'
import TenantPicker from './components/tenant-picker.vue'

defineOptions({
  name: 'RegisterPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const loading = ref(false) // 加载状态
const agreePolicy = ref(false) // 用户协议勾选
const tenantPickerRef = ref<InstanceType<typeof TenantPicker>>() // 租户选择器引用
const captchaEnabled = import.meta.env.VITE_APP_CAPTCHA_ENABLE === 'true' // 验证码开关
const verifyRef = ref()
const captchaType = ref('blockPuzzle') // 滑块验证码 blockPuzzle|clickWord

const formData = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  captchaVerification: '', // 验证码校验值
}) // 表单数据

/** 获取验证码 */
async function getCode() {
  // 情况一，未开启：则直接注册
  if (!captchaEnabled) {
    await verifySuccess({})
  } else {
    // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行注册
    // 弹出验证码
    verifyRef.value.show()
  }
}

/** 注册处理 */
async function handleRegister() {
  if (!tenantPickerRef.value?.validate()) {
    return
  }
  if (!agreePolicy.value) {
    toast.warning('请阅读并同意《用户协议》与《隐私政策》')
    return
  }
  if (!formData.username) {
    toast.warning('请输入用户名')
    return
  }
  if (!formData.nickname) {
    toast.warning('请输入昵称')
    return
  }
  if (!formData.password) {
    toast.warning('请输入密码')
    return
  }
  if (!formData.confirmPassword) {
    toast.warning('请确认密码')
    return
  }
  if (formData.password !== formData.confirmPassword) {
    toast.warning('两次输入的密码不一致')
    return
  }
  await getCode()
}

/** 验证码验证成功回调 */
async function verifySuccess(params: any) {
  loading.value = true
  try {
    // 调用注册接口
    const tokenStore = useTokenStore()
    formData.captchaVerification = params.captchaVerification
    await tokenStore.login({
      type: 'register',
      ...formData,
    })
    toast.success('注册成功')
    // 处理跳转
    redirectAfterLogin()
  } finally {
    loading.value = false
  }
}

/** 跳转到登录页面 */
function goToLogin() {
  uni.navigateTo({ url: LOGIN_PAGE })
}

/** 跳转到用户协议 */
function goToUserAgreement() {
  uni.navigateTo({ url: '/pages/user/settings/agreement/index' })
}

/** 跳转到隐私政策 */
function goToPrivacyPolicy() {
  uni.navigateTo({ url: '/pages/user/settings/privacy/index' })
}
</script>

<style lang="scss" scoped>
@import './styles/auth.scss';
</style>
