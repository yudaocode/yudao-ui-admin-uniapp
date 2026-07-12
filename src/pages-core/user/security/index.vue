<template>
  <view class="yd-page-container">
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
          <wd-icon name="lock" size="20px" color="#1890ff" class="mr-16rpx" />
        </template>
      </wd-cell>
    </wd-cell-group>

    <!-- 第三方绑定区域 -->
    <wd-cell-group custom-class="cell-group mt-24rpx" border>
      <wd-cell
        v-for="item in socialPlatforms"
        :key="item.type"
        :title="item.title"
        is-link
        @click="handleSocialUser(item)"
      >
        <template #icon>
          <wd-icon :name="item.icon" size="20px" :color="item.color" class="mr-16rpx" />
        </template>
        <view :class="getBindSocialUser(item.type) ? 'text-[#07c160]' : 'text-[#999]'">
          {{ getSocialStatus(item.type) }}
        </view>
      </wd-cell>
    </wd-cell-group>

    <!-- 修改密码弹窗 -->
    <PasswordForm v-model="showPasswordPopup" />
  </view>
</template>

<script lang="ts" setup>
import type { SocialUserBind } from '@/api/system/social/user'
import { onShow } from '@dcloudio/uni-app'
import { isH5, isMpWeixin } from '@uni-helper/uni-env'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import {
  bindSocialUser,
  getBindSocialUserList,
  unbindSocialUser,
} from '@/api/system/social/user'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { SystemUserSocialTypeEnum } from '@/utils/constants/biz-system-enum'
import { startH5SocialAuth } from '@/utils/social-login'
import PasswordForm from './components/password-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const showPasswordPopup = ref(false) // 密码弹窗相关
const socialUserList = ref<SocialUserBind[]>([]) // 当前用户的三方绑定列表
const socialLoading = ref(false) // 三方绑定列表加载状态
const bindingType = ref<number>() // 正在绑定的三方类型
const unbindingType = ref<number>() // 正在解绑的三方类型
const isWechatBrowser = isH5 && typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent) // 微信内置浏览器

interface SocialPlatform {
  type: number
  title: string
  icon: string
  color: string
}

const socialPlatforms: SocialPlatform[] = [ // 三方绑定渠道
  {
    type: SystemUserSocialTypeEnum.DINGTALK.type,
    title: '钉钉',
    icon: 'desktop',
    color: '#1677ff',
  },
  {
    type: SystemUserSocialTypeEnum.WECHAT_ENTERPRISE.type,
    title: '企业微信',
    icon: 'message',
    color: '#07c160',
  },
  {
    type: SystemUserSocialTypeEnum.WECHAT_MP.type,
    title: '微信公众号',
    icon: 'message',
    color: '#07c160',
  },
  {
    type: SystemUserSocialTypeEnum.WECHAT_MINI_PROGRAM.type,
    title: '微信小程序',
    icon: 'message',
    color: '#07c160',
  },
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/user/index')
}

/** 打开修改密码弹窗 */
function handleChangePassword() {
  showPasswordPopup.value = true
}

/** 获取指定类型的三方绑定 */
function getBindSocialUser(type: number) {
  return socialUserList.value.find(item => item.type === type)
}

/** 获取三方绑定状态文案 */
function getSocialStatus(type: number) {
  if (socialLoading.value) {
    return '加载中'
  }
  if (bindingType.value === type) {
    return '绑定中'
  }
  if (unbindingType.value === type) {
    return '解绑中'
  }
  return getBindSocialUser(type) ? '已绑定' : '未绑定'
}

/** 加载当前用户的三方绑定 */
async function loadSocialUsers() {
  socialLoading.value = true
  try {
    socialUserList.value = await getBindSocialUserList()
  } finally {
    socialLoading.value = false
  }
}

/** 点击三方绑定项 */
async function handleSocialUser(item: SocialPlatform) {
  if (socialLoading.value || bindingType.value || unbindingType.value) {
    return
  }
  const socialUser = getBindSocialUser(item.type)
  if (socialUser) {
    await handleUnbind(item, socialUser)
    return
  }
  await handleBind(item)
}

/** 发起三方绑定 */
async function handleBind(item: SocialPlatform) {
  if (item.type === SystemUserSocialTypeEnum.WECHAT_MINI_PROGRAM.type) {
    if (!isMpWeixin) {
      toast.info('请在微信小程序中完成绑定')
      return
    }
    await handleBindWechatMiniProgram(item.type)
    return
  }
  if (!isH5) {
    toast.info(`请在 H5 端完成${item.title}绑定`)
    return
  }
  if (item.type === SystemUserSocialTypeEnum.WECHAT_MP.type && !isWechatBrowser) {
    toast.info('请在微信内置浏览器中完成公众号绑定')
    return
  }

  bindingType.value = item.type
  try {
    const started = await startH5SocialAuth({
      purpose: 'bind',
      socialType: item.type,
      tenantId: useUserStore().tenantId || undefined,
      redirect: '/pages-core/user/security/index',
    })
    if (!started) {
      toast.error('三方授权地址无效，请检查客户端配置')
    }
  } finally {
    bindingType.value = undefined
  }
}

/** 绑定微信小程序 */
async function handleBindWechatMiniProgram(type: number) {
  bindingType.value = type
  try {
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
    await bindSocialUser({ type, code: loginResult.code, state: 'default' })
    toast.success('绑定成功')
    await loadSocialUsers()
  } finally {
    bindingType.value = undefined
  }
}

/** 解除三方绑定 */
async function handleUnbind(item: SocialPlatform, socialUser: SocialUserBind) {
  try {
    await dialog.confirm({
      title: '解除绑定',
      msg: `确定要解除${item.title}绑定吗？`,
    })
  } catch {
    return
  }

  unbindingType.value = item.type
  try {
    await unbindSocialUser({ type: item.type, openid: socialUser.openid })
    toast.success('解绑成功')
    await loadSocialUsers()
  } finally {
    unbindingType.value = undefined
  }
}

/** 页面显示时刷新三方绑定 */
onShow(() => {
  void loadSocialUsers()
})
</script>

<style lang="scss" scoped>
:deep(.cell-group) {
  margin: 24rpx;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 3rpx 8rpx rgba(24, 144, 255, 0.06);
}
</style>
