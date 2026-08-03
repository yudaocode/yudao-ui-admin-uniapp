<template>
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
      人事概况（{{ currentMonthRange }}）
    </view>
    <view class="grid grid-cols-3 gap-16rpx p-24rpx">
      <view
        v-for="item in surveyItems"
        :key="item.label"
        class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-24rpx text-center"
        :class="hasAccessByCodes(['hrm:employee:query']) ? 'active:opacity-80' : 'opacity-80'"
        @click="goEmployeeSurvey(item.surveyType)"
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
import type { HrHomeEmployeeSurvey } from '@/api/hrm/home'
import type { HrmEmployeeSurveyTypeValue } from '@/pages-hrm/utils/constants'
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { HrmEmployeeStatusTab, HrmEmployeeSurveyType } from '@/pages-hrm/utils/constants'

const props = defineProps<{
  survey?: HrHomeEmployeeSurvey
}>()

const { hasAccessByCodes } = useAccess()
const currentMonthRange = `${dayjs().startOf('month').format('YYYY.MM.DD')}-${dayjs().endOf('month').format('YYYY.MM.DD')}`

const surveyItems = computed(() => [
  { label: '在职', value: props.survey?.activeCount || 0, surveyType: undefined },
  { label: '入职', value: props.survey?.entryThisMonthCount || 0, surveyType: HrmEmployeeSurveyType.ENTRY },
  { label: '待入职', value: props.survey?.pendingEntryThisMonthCount || 0, surveyType: HrmEmployeeSurveyType.PENDING_ENTRY },
  { label: '离职', value: props.survey?.leaveThisMonthCount || 0, surveyType: HrmEmployeeSurveyType.LEAVE },
  { label: '待离职', value: props.survey?.pendingLeaveThisMonthCount || 0, surveyType: HrmEmployeeSurveyType.PENDING_LEAVE },
  { label: '转正', value: props.survey?.regularThisMonthCount || 0, surveyType: HrmEmployeeSurveyType.REGULAR },
  { label: '调岗', value: props.survey?.transferThisMonthCount || 0, surveyType: HrmEmployeeSurveyType.TRANSFER },
])

/** 打开人事概况对应的员工列表 */
function goEmployeeSurvey(surveyType?: HrmEmployeeSurveyTypeValue) {
  if (!hasAccessByCodes(['hrm:employee:query'])) {
    return
  }
  if (surveyType === undefined) {
    uni.navigateTo({
      url: `/pages-hrm/employee/index?statusCategory=${HrmEmployeeStatusTab.ACTIVE}`,
    })
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/employee/index?surveyType=${surveyType}`,
  })
}
</script>
