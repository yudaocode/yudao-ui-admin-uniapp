<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="租户管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="租户列表" />
        <wd-tab title="租户套餐" />
      </wd-tabs>
    </view>

    <!-- 列表内容 -->
    <TenantList v-show="tabType === 'tenant'" />
    <PackageList v-show="tabType === 'package'" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import PackageList from './components/package-list.vue'
import TenantList from './components/tenant-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['tenant', 'package']
const tabIndex = ref(0)
const tabType = computed<string>(() => tabTypes[tabIndex.value])

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>

<style lang="scss" scoped>
</style>
