<template>
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
      我的团队（{{ currentMonthRange }}）
    </view>
    <view class="grid grid-cols-2 gap-16rpx p-24rpx">
      <view
        v-for="item in overviewItems"
        :key="item.label"
        class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-24rpx text-center"
        :class="canOpenEmployeeList ? 'active:opacity-80' : 'opacity-80'"
        @click="openEmployeeList(item.surveyType)"
      >
        <view class="text-36rpx text-[#333] font-semibold">
          {{ item.value }}
        </view>
        <view class="mt-8rpx text-24rpx text-[#999]">
          {{ item.label }}
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { TeamHomeOverview } from '@/api/hrm/home'
import type { HrmEmployeeSurveyTypeValue } from '@/pages-hrm/utils/constants'
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { HrmEmployeeStatusTab, HrmEmployeeSurveyType } from '@/pages-hrm/utils/constants'

const props = defineProps<{
  leaderEmployeeId?: number
  overview?: TeamHomeOverview
}>()

const { hasAccessByCodes } = useAccess()
const canOpenEmployeeList = computed(
  () => !!props.leaderEmployeeId && hasAccessByCodes(['hrm:employee:query']),
)
const currentMonthRange = `${dayjs().startOf('month').format('YYYY.MM.DD')}-${dayjs().endOf('month').format('YYYY.MM.DD')}`

const overviewItems = computed(() => [
  { label: '团队人数', value: props.overview?.employeeCount || 0, surveyType: undefined },
  { label: '本月入职', value: props.overview?.entryThisMonthCount || 0, surveyType: HrmEmployeeSurveyType.ENTRY },
  { label: '本月离职', value: props.overview?.leaveThisMonthCount || 0, surveyType: HrmEmployeeSurveyType.LEAVE },
  { label: '本月转正', value: props.overview?.regularThisMonthCount || 0, surveyType: HrmEmployeeSurveyType.REGULAR },
])

/** 打开当前直属团队对应的员工列表 */
function openEmployeeList(surveyType?: HrmEmployeeSurveyTypeValue) {
  if (!canOpenEmployeeList.value) {
    return
  }
  const query = [
    `leaderEmployeeId=${props.leaderEmployeeId}`,
    surveyType === undefined ? `statusCategory=${HrmEmployeeStatusTab.ACTIVE}` : `surveyType=${surveyType}`,
  ].filter(Boolean).join('&')
  uni.navigateTo({
    url: `/pages-hrm/employee/index?${query}`,
  })
}
</script>
