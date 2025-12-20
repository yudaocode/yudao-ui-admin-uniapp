<template>
  <view class="yd-page-container">
    <wd-navbar
      title="邮件管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="邮箱账号" />
        <wd-tab title="邮件模板" />
        <wd-tab title="邮件日志" />
      </wd-tabs>
    </view>

    <AccountList v-show="tabType === 'account'" />
    <TemplateList v-show="tabType === 'template'" />
    <LogList v-show="tabType === 'log'" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import AccountList from './components/account-list.vue'
import LogList from './components/log-list.vue'
import TemplateList from './components/template-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['account', 'template', 'log']
const tabIndex = ref(0)
const tabType = computed<string>(() => tabTypes[tabIndex.value])

function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

function handleBack() {
  navigateBackPlus()
}
</script>

<style lang="scss" scoped>
</style>
