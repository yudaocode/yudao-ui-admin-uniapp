<template>
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
      上月薪资概况
    </view>
    <view class="grid grid-cols-2 gap-16rpx p-24rpx">
      <view
        v-for="item in surveyItems"
        :key="item.label"
        class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-24rpx text-center"
        :class="canOpenSalary ? 'active:opacity-80' : 'opacity-80'"
        @click="goSalaryRecord"
      >
        <view class="text-36rpx text-[#333] font-semibold">
          {{ item.value }}
        </view>
        <view class="mt-8rpx text-24rpx text-[#999]">
          {{ item.label }}
        </view>
      </view>
    </view>
    <view class="border-t border-t-[#f0f0f0] px-12rpx pb-12rpx">
      <YdChart
        :option="salaryDeptChartOptions"
        :empty="!survey?.deptProportions?.length"
        height="420rpx"
      />
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { HrHomeSalarySurvey } from '@/api/hrm/home'
import { computed } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import YdChart from '../../components/yd-chart/yd-chart.vue'
import { formatHrmMoneyWithThousands } from '@/pages-hrm/utils/format'

const props = defineProps<{
  survey?: HrHomeSalarySurvey
}>()

const { hasAccessByCodes } = useAccess()
const canOpenSalary = computed(() => { // 有薪资查询权限且存在上月工资表
  return hasAccessByCodes(['hrm:salary:month-record:query']) && !!props.survey?.monthRecordId
})

const surveyItems = computed(() => [
  { label: '计薪人员', value: props.survey?.employeeCount || 0 },
  { label: '实发工资（元）', value: formatHrmMoneyWithThousands(props.survey?.realPaySalary) },
])

const salaryDeptChartOptions = computed(() => ({
  title: {
    text: '部门薪资占比',
    left: 'center',
    textStyle: { fontSize: 13, fontWeight: 500 },
  },
  tooltip: {
    trigger: 'item',
    confine: true,
    formatter: '{b}：{c}%',
  },
  legend: {
    type: 'scroll',
    bottom: 0,
    left: 'center',
  },
  series: [{
    type: 'pie',
    radius: '48%',
    center: ['50%', '46%'],
    stillShowZeroSum: false,
    data: (props.survey?.deptProportions || []).map(item => ({
      name: item.deptName,
      value: Number((item.proportion * 100).toFixed(2)),
    })),
  }],
}))

/** 打开上月工资表详情 */
function goSalaryRecord() {
  if (!canOpenSalary.value) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/salary/month-record/detail/index?id=${props.survey?.monthRecordId}`,
  })
}
</script>
