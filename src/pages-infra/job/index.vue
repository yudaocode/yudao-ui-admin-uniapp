<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="定时任务"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="定时任务" />
        <wd-tab title="调度日志" />
      </wd-tabs>
    </view>
    <!-- 列表内容 -->
    <JobList v-show="tabType === 'job'" />
    <LogList v-show="tabType === 'log'" />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import JobList from './components/job-list.vue'
import LogList from './components/log-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabTypes: string[] = ['job', 'log']
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
