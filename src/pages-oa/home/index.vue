<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="OA 工作台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 统计卡片 -->
        <view class="grid grid-cols-2 gap-24rpx">
          <Attendance />
          <ContactCount v-if="hasAccessByCodes(['oa:contact:query'])" />
          <DiscussionCount v-if="hasAccessByCodes(['oa:discussion:query'])" />
          <TaskCount />
        </view>

        <!-- 公告通知 -->
        <Announcement v-if="hasAccessByCodes(['oa:announcement:query'])" class="mt-24rpx" />

        <!-- 工作计划 -->
        <Plan v-if="hasAccessByCodes(['oa:plan:query'])" class="mt-24rpx" />

        <!-- 任务完成情况 -->
        <TaskStatistics class="mt-24rpx" />

        <!-- 行事历 -->
        <Calendar v-if="hasAccessByCodes(['oa:schedule:query'])" class="mt-24rpx" />

        <!-- 我的笔记 -->
        <Note v-if="hasAccessByCodes(['oa:note:query'])" class="mb-24rpx mt-24rpx" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import Announcement from './components/announcement.vue'
import Attendance from './components/attendance.vue'
import Calendar from './components/calendar.vue'
import ContactCount from './components/contact-count.vue'
import DiscussionCount from './components/discussion-count.vue'
import Note from './components/note.vue'
import Plan from './components/plan.vue'
import TaskCount from './components/task-count.vue'
import TaskStatistics from './components/task-statistics.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}
</script>
