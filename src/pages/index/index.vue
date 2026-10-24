<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="工作台" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="pl-4rpx" @click="gotoSearch">
          <wd-icon name="search-line" size="40rpx" color="#333" />
        </view>
      </template>
      <!-- #ifndef H5 -->
      <template #right>
        <view class="pr-4rpx" @click="handleScan">
          <wd-icon name="scan" size="40rpx" color="#333" />
        </view>
      </template>
      <!-- #endif -->
    </wd-navbar>

    <!-- 用户信息头部 -->
    <UserHeader />
    <!-- Banner 轮播图 -->
    <HomeBanner />
    <!-- 菜单区域（占满剩余高度，内部独立滚动），对应 https://t.zsxq.com/RMwwV -->
    <MenuSection class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import HomeBanner from './components/banner.vue'
import MenuSection from './components/menu-section.vue'
import UserHeader from './components/user-header.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'

defineOptions({
  name: 'Home',
})

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
  },
})

const toast = useToast()

/** 扫码只打开本地确认页，不直接登录，不跳转二维码中的URL */
async function handleScan() {
  // #ifndef H5
  try {
    const result = await uni.scanCode({ scanType: ['qrCode'] })
    const match = /^YuDaoLogin:([a-f0-9]{32})$/.exec(result.result)
    if (!match) {
      toast.warning('请扫描本系统电脑登录页的二维码')
      return
    }
    uni.navigateTo({ url: `/pages-core/auth/qrcode/index?qrcodeId=${match[1]}` })
  } catch (error) {
    if (!(error as UniApp.GeneralCallbackResult).errMsg?.includes('cancel')) {
      toast.error('扫码失败，请重试')
    }
  }
  // #endif
}

/** 跳转到菜单搜索页 */
function gotoSearch() {
  uni.navigateTo({
    url: '/pages/index/search/index',
  })
}
</script>
