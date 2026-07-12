<template>
  <view
    v-if="contextReady && !modelValue && socialLoginOptions.length"
    class="mt-100rpx"
    :class="{ 'pointer-events-none opacity-60': props.disabled }"
  >
    <view class="divider mb-40rpx flex items-center justify-center">
      <view class="h-1rpx flex-1 bg-[#e5e5e5]" />
      <text class="px-24rpx text-26rpx text-[#999]">其他登录方式</text>
      <view class="h-1rpx flex-1 bg-[#e5e5e5]" />
    </view>
    <view class="icons flex justify-center gap-48rpx">
      <view
        v-for="item in socialLoginOptions"
        :key="item.type"
        class="social-item"
        @click="handleLogin(item)"
      >
        <view class="icon-item">
          <wd-icon :name="item.icon" size="24px" :color="item.color" />
        </view>
        <text>{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SocialLoginBindingContext } from '@/utils/social-login'
import { isH5, isMpWeixin } from '@uni-helper/uni-env'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { AUTH_THIRD_LOGIN_NOT_BIND_CODE } from '@/api/login'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { redirectAfterLogin } from '@/utils'
import { SystemUserSocialTypeEnum } from '@/utils/constants/biz-system-enum'
import {
  clearSocialLoginContext,
  startH5SocialAuth,
  takeSocialLoginContext,
} from '@/utils/social-login'

type SocialLoginMode = 'h5' | 'miniProgram'

interface SocialLoginOption {
  type: number
  mode: SocialLoginMode
  label: string
  icon: string
  color: string
  visible: boolean
}

defineOptions({ name: 'SocialLoginPanel' })

const props = defineProps<{
  disabled?: boolean
  modelValue?: SocialLoginBindingContext
  loading?: boolean
  redirectUrl?: string
  socialBind?: boolean
  validateTenant: () => boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SocialLoginBindingContext]
  'update:loading': [value: boolean]
}>()

const toast = useToast()
const tokenStore = useTokenStore()
const userStore = useUserStore()
const socialLoading = ref(false) // 三方登录状态
const contextReady = ref(!props.socialBind) // 授权绑定上下文是否已恢复
const isWechatBrowser = isH5 && typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent) // 微信内置浏览器
const allSocialLoginOptions: SocialLoginOption[] = [ // 第三方登录入口
  {
    type: SystemUserSocialTypeEnum.DINGTALK.type,
    mode: 'h5',
    label: '钉钉',
    icon: 'desktop',
    color: '#1677ff',
    visible: isH5,
  },
  {
    type: SystemUserSocialTypeEnum.WECHAT_ENTERPRISE.type,
    mode: 'h5',
    label: '企业微信',
    icon: 'message',
    color: '#07c160',
    visible: isH5,
  },
  {
    type: SystemUserSocialTypeEnum.WECHAT_MP.type,
    mode: 'h5',
    label: '微信公众号',
    icon: 'message',
    color: '#07c160',
    visible: isWechatBrowser,
  },
  {
    type: SystemUserSocialTypeEnum.WECHAT_MINI_PROGRAM.type,
    mode: 'miniProgram',
    label: '微信快捷登录',
    icon: 'message',
    color: '#07c160',
    visible: isMpWeixin,
  },
]
const socialLoginOptions = allSocialLoginOptions.filter(item => item.visible) // 当前平台支持的第三方登录入口

/** 更新三方登录状态 */
function updateSocialLoading(value: boolean) {
  socialLoading.value = value
  emit('update:loading', value)
}

/** 发起第三方登录 */
function handleLogin(item: SocialLoginOption) {
  if (props.disabled) {
    return
  }
  if (item.mode === 'miniProgram') {
    void handleWechatMiniProgramLogin()
    return
  }
  void handleH5SocialLogin(item.type)
}

/** 发起 H5 三方授权 */
async function handleH5SocialLogin(type: number) {
  if (props.disabled || !props.validateTenant() || socialLoading.value) {
    return
  }
  updateSocialLoading(true)
  try {
    const started = await startH5SocialAuth({
      purpose: 'login',
      socialType: type,
      tenantId: userStore.tenantId || undefined,
      redirect: props.redirectUrl,
    })
    if (!started) {
      toast.error('三方授权地址无效，请检查客户端配置')
    }
  } catch (error) {
    clearSocialLoginContext()
    console.error('发起三方授权失败:', error)
  } finally {
    updateSocialLoading(false)
  }
}

/** 微信小程序快捷登录 */
async function handleWechatMiniProgramLogin() {
  if (props.disabled || !props.validateTenant() || socialLoading.value) {
    return
  }
  updateSocialLoading(true)
  try {
    const tenantId = userStore.tenantId || undefined
    let loginResult: UniApp.LoginRes
    try {
      loginResult = await uni.login({ provider: 'weixin' })
    } catch (error) {
      console.error('获取微信登录凭证失败:', error)
      toast.error((error as Record<string, any>)?.errMsg || '获取微信登录凭证失败')
      return
    }
    if (!loginResult.code) {
      toast.error('未获取到微信登录凭证')
      return
    }
    const data = {
      type: SystemUserSocialTypeEnum.WECHAT_MINI_PROGRAM.type,
      code: loginResult.code,
      state: 'default',
    }
    try {
      if (tenantId) {
        userStore.setTenantId(tenantId)
      }
      await tokenStore.socialLogin(data)
      redirectAfterLogin(props.redirectUrl)
    } catch (error) {
      if (Number((error as Record<string, any>)?.code) === AUTH_THIRD_LOGIN_NOT_BIND_CODE) {
        if (tenantId) {
          userStore.setTenantId(tenantId)
        }
        emit('update:modelValue', {
          purpose: 'login',
          stage: 'binding',
          socialType: data.type,
          tenantId,
          redirect: props.redirectUrl,
          socialCode: data.code,
          socialState: data.state,
          createdAt: Date.now(),
        })
        toast.info('请使用账号密码登录，完成微信账号绑定')
        return
      }
      toast.error((error as Record<string, any>)?.msg || '微信登录失败，请重试')
    }
  } finally {
    updateSocialLoading(false)
  }
}

/** 恢复待绑定的三方授权上下文 */
function restoreSocialBindingContext() {
  if (!props.socialBind) {
    return
  }
  const context = takeSocialLoginContext()
  if (context?.stage !== 'binding' || context.purpose !== 'login') {
    toast.error('三方授权信息已失效，请重新发起登录')
    contextReady.value = true
    return
  }
  if (context.tenantId) {
    userStore.setTenantId(context.tenantId)
  }
  emit('update:modelValue', context)
  contextReady.value = true
}

/** 页面挂载时恢复三方授权上下文 */
onMounted(() => {
  restoreSocialBindingContext()
})
</script>

<style lang="scss" scoped>
@import '../styles/auth.scss';
</style>
