<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="团队工作台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx space-y-24rpx">
        <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <text class="text-30rpx text-[#333] font-semibold">
              团队统计
            </text>
            <wd-button size="small" type="primary" :loading="loading" @click="getSummary">
              刷新
            </wd-button>
          </view>
        </view>

        <view v-if="loading && !summary" class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm">
          <wd-loading size="32rpx" />
          <view class="mt-12rpx">
            正在加载工作台数据
          </view>
        </view>

        <template v-else>
          <TeamOverview
            :leader-employee-id="summary?.leaderEmployeeId"
            :overview="summary?.teamOverview"
          />
          <TeamSurvey :survey="summary?.teamSurvey" />
          <HomeCalendar
            :get-calendar-items="getTeamHomeCalendar"
            :is-item-clickable="isCalendarItemClickable"
            @item-click="openCalendarItem"
          />
        </template>
      </view>
      <view class="h-40rpx" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { HomeCalendarItem, TeamHomeStatistics } from '@/api/hrm/home'
import { onMounted, ref } from 'vue'
import { getTeamHomeCalendar, getTeamHomeStatisticsSummary } from '@/api/hrm/home'
import { HrmHomeCalendarItemType } from '@/pages-hrm/utils/constants'
import { navigateBackPlus } from '@/utils'
import HomeCalendar from '../components/home-calendar.vue'
import TeamOverview from '../components/team-overview.vue'
import TeamSurvey from '../components/team-survey.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const loading = ref(false) // 加载中
const summary = ref<TeamHomeStatistics>() // 工作台汇总数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获得团队工作台统计 */
async function getSummary() {
  loading.value = true
  try {
    summary.value = await getTeamHomeStatisticsSummary()
  } finally {
    loading.value = false
  }
}

/** 团队日历中的员工事项支持跳转详情 */
function isCalendarItemClickable(item: HomeCalendarItem) {
  return item.type !== HrmHomeCalendarItemType.NOTE && !!item.typeId
}

/** 打开下属员工档案 */
function openCalendarItem(item: HomeCalendarItem) {
  if (item.typeId) {
    uni.navigateTo({
      url: `/pages-hrm/employee/detail/index?id=${item.typeId}`,
    })
  }
}

/** 初始化 */
onMounted(() => {
  getSummary()
})
</script>
