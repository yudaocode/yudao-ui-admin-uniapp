<template>
  <view class="min-h-screen flex flex-col bg-#f5f5f5" :style="{ paddingTop: `${safeAreaInsets?.top}px` }">
    <!-- 顶部导航栏 -->
    <wd-navbar title="工作台" />
    <!-- 用户信息头部 -->
    <UserHeader />
    <!-- Banner 轮播图 -->
    <HomeBanner />
    <!-- 菜单区域 -->
    <MenuSection />
  </view>
</template>

<script lang="ts" setup>
import { safeAreaInsets } from '@/utils/systemInfo'
import HomeBanner from './components/banner.vue'
import MenuSection from './components/menu-section.vue'
import UserHeader from './components/user-header.vue'

defineOptions({
  name: 'Home',
})

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '工作台',
  },
})
</script>
