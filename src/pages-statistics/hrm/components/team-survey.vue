<template>
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
      团队概况
    </view>
    <view class="p-24rpx space-y-24rpx">
      <view v-for="chart in charts" :key="chart.title">
        <view class="mb-8rpx text-center text-26rpx text-[#666]">
          {{ chart.title }}
        </view>
        <YdChart
          :option="buildChartOptions(chart.data, chart.formatType)"
          :empty="!hasData(chart.data)"
          height="420rpx"
        />
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { TeamHomeAnalysisItem, TeamHomeSurvey } from '@/api/hrm/home'
import { computed } from 'vue'
import YdChart from '../../components/yd-chart/yd-chart.vue'
import {
  HrmTeamHomeAgeRangeType,
  HrmTeamHomeCompanyAgeRangeType,
} from '@/pages-hrm/utils/constants'
import { formatHrmAnalysisDictType, formatHrmAnalysisRangeType } from '@/pages-hrm/utils/format'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  survey?: TeamHomeSurvey
}>()

const ageRangeNames: Record<number, string> = {
  [HrmTeamHomeAgeRangeType.UNDER_18]: '17以下',
  [HrmTeamHomeAgeRangeType.AGE_18_TO_25]: '18-25',
  [HrmTeamHomeAgeRangeType.AGE_26_TO_35]: '26-35',
  [HrmTeamHomeAgeRangeType.AGE_36_TO_45]: '36-45',
  [HrmTeamHomeAgeRangeType.AGE_46_TO_55]: '46-55',
  [HrmTeamHomeAgeRangeType.AGE_56_AND_ABOVE]: '56以上',
}
const companyAgeRangeNames: Record<number, string> = {
  [HrmTeamHomeCompanyAgeRangeType.WITHIN_3_MONTHS]: '3个月内',
  [HrmTeamHomeCompanyAgeRangeType.MONTHS_3_TO_6]: '3-6个月',
  [HrmTeamHomeCompanyAgeRangeType.MONTHS_6_TO_1_YEAR]: '6个月-1年',
  [HrmTeamHomeCompanyAgeRangeType.YEARS_1_TO_3]: '1-3年',
  [HrmTeamHomeCompanyAgeRangeType.YEARS_3_TO_5]: '3-5年',
  [HrmTeamHomeCompanyAgeRangeType.YEARS_5_TO_10]: '5-10年',
  [HrmTeamHomeCompanyAgeRangeType.YEARS_10_AND_ABOVE]: '10年以上',
}

const charts = computed(() => [
  {
    title: '员工状态占比',
    data: props.survey?.statusAnalysis || [],
    formatType: (type: number | null) => formatHrmAnalysisDictType(DICT_TYPE.HRM_EMPLOYEE_STATUS, type),
  },
  {
    title: '男女性别占比',
    data: props.survey?.sexAnalysis || [],
    formatType: (type: number | null) => formatHrmAnalysisDictType(DICT_TYPE.SYSTEM_USER_SEX, type),
  },
  {
    title: '成员年龄占比',
    data: props.survey?.ageAnalysis || [],
    formatType: (type: number | null) => formatHrmAnalysisRangeType(ageRangeNames, type),
  },
  {
    title: '成员司龄占比',
    data: props.survey?.companyAgeAnalysis || [],
    formatType: (type: number | null) => formatHrmAnalysisRangeType(companyAgeRangeNames, type),
  },
])

/** 是否存在统计数据 */
function hasData(data: TeamHomeAnalysisItem[]) {
  return data.some(item => item.count > 0)
}

/** 构建团队概况饼图 */
function buildChartOptions(
  data: TeamHomeAnalysisItem[],
  formatType: (type: number | null) => string,
) {
  const chartData = data.filter(item => item.count > 0)
  return {
    color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#00a6a6', '#7b61ff', '#d97706'],
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}<br/>{c} 人（{d}%）',
    },
    legend: {
      bottom: 0,
      type: 'scroll',
    },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '43%'],
      avoidLabelOverlap: true,
      label: {
        formatter: '{b}\n{c} 人',
      },
      data: chartData.map(item => ({ name: formatType(item.type), value: item.count })),
    }],
  }
}
</script>
