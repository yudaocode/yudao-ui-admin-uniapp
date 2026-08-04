<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="工作台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx space-y-24rpx">
        <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <text class="text-30rpx text-[#333] font-semibold">
              员工工作台
            </text>
            <wd-button size="small" type="primary" :loading="loading" @click="refreshAll">
              刷新
            </wd-button>
          </view>
        </view>

        <view
          v-if="loading && !employee"
          class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm"
        >
          <wd-loading size="32rpx" />
          <view class="mt-12rpx">
            正在加载工作台数据
          </view>
        </view>

        <template v-else-if="accessible">
          <EmployeeSurvey
            :employee="employee"
            :salary-slip-summary="salarySlipSummary"
          />
          <HomeCalendar
            ref="calendarRef"
            :get-calendar-items="getEmployeeHomeCalendar"
            :show-item-time="isCalendarItemTimeVisible"
          />
        </template>
      </view>
      <view class="h-40rpx" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { HomeCalendarItem } from '@/api/hrm/home'
import type { PortalEmployee } from '@/api/hrm/portal/employee'
import type { SalarySlipUnreadSummary } from '@/api/hrm/portal/salary/slip'
import { onMounted, ref } from 'vue'
import { getPortalEmployee } from '@/api/hrm/portal/employee'
import { getEmployeeHomeCalendar } from '@/api/hrm/portal/home/calendar'
import { getUnreadSalarySlipSummary } from '@/api/hrm/portal/salary/slip'
import { HrmHomeCalendarItemType } from '@/pages-hrm/utils/constants'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import HomeCalendar from '@/pages-statistics/hrm/components/home-calendar.vue'
import EmployeeSurvey from './components/employee-survey.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const employee = ref<PortalEmployee>() // 员工信息
const salarySlipSummary = ref<SalarySlipUnreadSummary>() // 工资条汇总
const calendarRef = ref<{ refresh: () => Promise<void> }>() // 日历组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 员工端仅为个人备忘展示具体时间 */
function isCalendarItemTimeVisible(item: HomeCalendarItem) {
  return item.type === HrmHomeCalendarItemType.NOTE
}

/** 刷新员工工作台 */
async function refreshAll() {
  loading.value = true
  try {
    const [employeeData, salarySummary] = await Promise.all([
      getPortalEmployee(),
      getUnreadSalarySlipSummary(),
      calendarRef.value?.refresh(),
    ])
    employee.value = employeeData
    salarySlipSummary.value = salarySummary
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  accessible.value = await checkHrmPortalAccess()
  if (!accessible.value) {
    return
  }
  await refreshAll()
})
</script>
