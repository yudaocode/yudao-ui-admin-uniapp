<template>
  <view class="min-h-screen bg-#f5f5f5">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="工作台"
      placeholder safe-area-inset-top fixed
    />
    <!-- 用户信息头部 -->
    <UserHeader />
    <!-- Banner 轮播图 -->
    <HomeBanner />
    <!-- 菜单区域 -->
    <MenuSection />
  </view>
</template>

<script lang="ts" setup>
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
  },
})
</script>
