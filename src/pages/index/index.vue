<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <!-- #ifndef MP-WEIXIN -->
    <wd-navbar
      title="工作台"
      placeholder safe-area-inset-top fixed
    >
      <template #right>
        <view class="pr-10rpx" @click="gotoSearch">
          <wd-icon name="search-line" size="40rpx" color="#333" />
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <wd-navbar title="工作台" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="pl-4rpx" @click="gotoSearch">
          <wd-icon name="search-line" size="40rpx" color="#333" />
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->

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

/** 跳转到菜单搜索页 */
function gotoSearch() {
  uni.navigateTo({
    url: '/pages/index/search/index',
  })
}
</script>
