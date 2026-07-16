<template>
  <view class="auth-container">
    <!-- 顶部 -->
    <Header />

    <!-- 授权结果 -->
    <view class="form-container flex flex-col items-center">
      <wd-loading v-if="status === 'loading'" color="#1890ff" size="64rpx" />
      <wd-icon v-else name="exclamation-circle" size="64rpx" color="#faad14" />
      <text class="mt-32rpx text-32rpx text-[#333] font-medium">
        {{ status === 'loading' ? `正在完成三方${actionLabel}` : `三方${actionLabel}失败` }}
      </text>
      <text class="mt-16rpx text-center text-26rpx text-[#999]">
        {{ message }}
      </text>
      <wd-button v-if="status === 'failed'" class="mt-48rpx" type="primary" @click="handleBack">
        {{ purpose === 'bind' ? '返回账号安全' : '返回登录' }}
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SocialLoginPurpose } from '@/utils/social-login'
import { computed, ref } from 'vue'
import { AUTH_THIRD_LOGIN_NOT_BIND_CODE } from '@/api/login'
import { bindSocialUser } from '@/api/system/social/user'
import { LOGIN_PAGE, SOCIAL_LOGIN_PAGE } from '@/router/config'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { redirectAfterLogin } from '@/utils'
import {
  saveSocialLoginContext,
  takeSocialLoginContext,
} from '@/utils/social-login'
import Header from '../components/header.vue'

defineOptions({
  name: 'SocialLoginPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
  },
  excludeLoginPath: true,
})

const status = ref<'loading' | 'failed'>('loading') // 回调处理状态
const message = ref('请稍候，不要关闭当前页面') // 回调提示
const redirectUrl = ref<string>() // 登录成功后的重定向地址
const purpose = ref<SocialLoginPurpose>('login') // 授权用途
const actionLabel = computed(() => purpose.value === 'bind' ? '绑定' : '登录') // 当前授权动作
const tenantEnabled = import.meta.env.VITE_APP_TENANT_ENABLE === 'true' // 租户开关
let handled = false // 防止回调重复提交

/** 页面加载时处理三方授权回调 */
onLoad((options) => {
  // #ifdef H5
  void handleSocialCallback(options || {})
  // #endif

  // #ifndef H5
  status.value = 'failed'
  message.value = '当前运行端不支持 H5 三方授权回调'
  // #endif
})

/** 获取回调参数，兼容钉钉整体编码回调参数 */
function getCallbackParam(options: Record<string, any>, key: string) {
  const currentUrl = window.location.href
  const browserValue = new URL(currentUrl).searchParams.get(key)
  if (browserValue) {
    return browserValue
  }
  try {
    // 标准 code/state 优先从原 URL 读取；仅业务参数缺失时解析整体编码的兼容 URL
    const compatibleValue = new URL(decodeURIComponent(currentUrl)).searchParams.get(key)
    if (compatibleValue) {
      return compatibleValue
    }
  } catch {
    // URL 中存在不完整转义时，仅使用原地址解析
  }
  return options[key] ? String(options[key]) : ''
}

/** 清理地址栏中的授权回调参数 */
function clearCallbackQuery() {
  window.history.replaceState(window.history.state, '', `${window.location.pathname}#${SOCIAL_LOGIN_PAGE}`)
}

/** 处理三方授权回调 */
async function handleSocialCallback(options: Record<string, any>) {
  if (handled) {
    return
  }
  handled = true
  const context = takeSocialLoginContext()
  const callbackPurpose = getCallbackParam(options, 'purpose')
  const callbackSocialType = getCallbackParam(options, 'socialType')
  const code = getCallbackParam(options, 'code')
  const state = getCallbackParam(options, 'state')
  const callbackTenantId = getCallbackParam(options, 'tenantId')
  clearCallbackQuery()
  if (context) {
    purpose.value = context.purpose
    redirectUrl.value = context.redirect
  }
  // 一次性 context + state 是安全校验；provider 回传的业务参数只做附加一致性校验
  if (
    context?.stage !== 'authorize'
    || !code
    || !state
    || state !== context.state
    || (callbackPurpose && callbackPurpose !== context.purpose)
    || (callbackSocialType && Number(callbackSocialType) !== context.socialType)
    || (callbackTenantId && Number(callbackTenantId) !== context.tenantId)
    || (tenantEnabled && !context.tenantId)
  ) {
    status.value = 'failed'
    message.value = '授权回调已失效或不匹配，请重新发起授权'
    return
  }
  const { socialType, tenantId } = context
  if (tenantId) {
    useUserStore().setTenantId(tenantId)
  }

  try {
    if (context.purpose === 'bind') {
      await bindSocialUser({ type: socialType, code, state })
      message.value = '绑定成功，正在返回账号安全页'
      setTimeout(() => {
        uni.reLaunch({ url: redirectUrl.value || '/pages-core/user/security/index' })
      }, 500)
      return
    }
    await useTokenStore().socialLogin({ type: socialType, code, state })
    redirectAfterLogin(redirectUrl.value)
  } catch (error) {
    const result = error as Record<string, any>
    if (Number(result?.code) === AUTH_THIRD_LOGIN_NOT_BIND_CODE) {
      saveSocialLoginContext({
        stage: 'binding',
        purpose: 'login',
        socialType,
        tenantId,
        redirect: redirectUrl.value,
        socialCode: code,
        socialState: state,
      })
      uni.reLaunch({ url: `${LOGIN_PAGE}?socialBind=1` })
      return
    }
    status.value = 'failed'
    message.value = result?.msg || result?.message || `授权${actionLabel.value}失败，请重新发起授权`
  }
}

/** 返回授权发起页面 */
function handleBack() {
  if (purpose.value === 'bind' && redirectUrl.value) {
    uni.reLaunch({ url: redirectUrl.value })
    return
  }
  const query = redirectUrl.value ? `?redirect=${encodeURIComponent(redirectUrl.value)}` : ''
  uni.reLaunch({ url: `${LOGIN_PAGE}${query}` })
}
</script>

<style lang="scss" scoped>
@import '../styles/auth.scss';
</style>
