<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="邮件管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="邮箱账号" />
        <wd-tab title="邮件模板" />
        <wd-tab title="邮件日志" />
      </wd-tabs>
    </view>
    <!-- 列表内容 -->
    <AccountList v-show="tabType === 'account'" class="min-h-0 flex-1" />
    <TemplateList v-show="tabType === 'template'" class="min-h-0 flex-1" />
    <LogList v-show="tabType === 'log'" class="min-h-0 flex-1" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import AccountList from './account/components/list.vue'
import LogList from './log/components/list.vue'
import TemplateList from './template/components/list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['account', 'template', 'log']
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
