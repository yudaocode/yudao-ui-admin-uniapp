<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="考勤报表"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 报表类型页签 -->
    <wd-tabs v-model="tabIndex">
      <wd-tab title="周报">
        <WeekReport />
      </wd-tab>
      <wd-tab title="月报" lazy>
        <MonthReport />
      </wd-tab>
    </wd-tabs>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import MonthReport from './components/month-report.vue'
import WeekReport from './components/week-report.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabIndex = ref(0) // 报表类型页签下标：0 周报 / 1 月报

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>
