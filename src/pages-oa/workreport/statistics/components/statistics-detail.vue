<template>
  <!-- 汇报明细弹窗 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="height: 80vh; border-radius: 24rpx 24rpx 0 0;"
    @close="visible = false"
  >
    <view class="h-full flex flex-col">
      <!-- 弹窗标题 -->
      <view class="flex items-center justify-between px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">{{ user?.userName || '' }}的汇报明细</text>
        <wd-icon name="close" size="32rpx" color="#999" @click="visible = false" />
      </view>

      <!-- 统计条件 -->
      <view class="px-24rpx pb-16rpx text-24rpx text-[#999]">
        {{ user?.deptName || '-' }} · 统计周期 {{ formatDate(params?.startTime) }} ~ {{ formatDate(params?.endTime) }}
      </view>

      <!-- 明细页签 -->
      <wd-tabs v-model="tabIndex">
        <wd-tab :title="`已填 ${user?.submittedReports?.length || 0}`" />
        <wd-tab :title="`未填 ${user?.missingCount || 0}`" />
      </wd-tabs>

      <scroll-view scroll-y class="min-h-0 flex-1 px-24rpx">
        <!-- 已填汇报 -->
        <template v-if="tabIndex === 0">
          <view v-if="!user?.submittedReports?.length" class="py-60rpx text-center text-26rpx text-[#999]">
            暂无已填汇报
          </view>
          <view
            v-for="report in user?.submittedReports"
            :key="report.id"
            class="border-b border-[#f0f0f0] border-b-solid py-16rpx"
            @click="handleReportDetail(report)"
          >
            <view class="mb-8rpx flex items-center justify-between gap-12rpx">
              <text class="line-clamp-1 min-w-0 flex-1 text-28rpx text-[#1677ff]">{{ report.title }}</text>
              <dict-tag :type="DICT_TYPE.OA_WORK_REPORT_STATUS" :value="report.status" />
            </view>
            <view class="text-22rpx text-[#999]">
              日期 {{ formatDate(report.startTime) }} · 提交 {{ formatDateTime(report.createTime) }}
            </view>
          </view>
        </template>

        <!-- 未填周期 -->
        <template v-else>
          <view v-if="!missingRows.length" class="py-60rpx text-center text-26rpx text-[#999]">
            暂无未填周期
          </view>
          <view
            v-for="(row, index) in missingRows"
            :key="row.periodKey"
            class="flex items-center justify-between gap-12rpx border-b border-[#f0f0f0] border-b-solid py-16rpx"
          >
            <view class="min-w-0 flex-1">
              <view v-if="params?.type !== OA_WORK_REPORT_TYPE.DAILY" class="text-26rpx text-[#333]">
                {{ params?.type === OA_WORK_REPORT_TYPE.WEEKLY ? `周次 ${row.periodKey}` : `月份 ${row.periodKey}` }}
              </view>
              <view class="text-26rpx text-[#333]">
                {{ params?.type === OA_WORK_REPORT_TYPE.DAILY ? '应填日期' : '起始日期' }} {{ row.startDate }}
                <text v-if="params?.type === OA_WORK_REPORT_TYPE.DAILY" class="ml-12rpx text-22rpx text-[#999]">{{ row.weekDay }}</text>
              </view>
            </view>
            <text class="shrink-0 text-24rpx" :class="row.overdueDays > 0 ? 'text-[#f5222d]' : 'text-[#999]'">
              逾期 {{ row.overdueDays }} 天
            </text>
            <text class="shrink-0 text-22rpx text-[#ccc]">#{{ index + 1 }}</text>
          </view>
        </template>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { WorkReport, WorkReportUserStatistics } from '@/api/oa/workreport'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { OA_WORK_REPORT_TYPE } from '../../../utils/constants'

interface StatisticsParams {
  type: number // 汇报类型
  startTime: string // 统计开始时间
  endTime: string // 统计结束时间
}

const visible = ref(false) // 弹窗显示状态
const tabIndex = ref(0) // 当前明细页签下标
const user = ref<WorkReportUserStatistics>() // 当前查看的成员
const params = ref<StatisticsParams>() // 当前统计条件

const missingRows = computed(() => // 未填明细，逾期从统计范围内的周期起始日期计算
  (user.value?.missingPeriodKeys || []).map((periodKey) => {
    const periodStartTime = getPeriodStart(periodKey)
    const startTime = params.value && periodStartTime.isBefore(dayjs(params.value.startTime), 'day')
      ? dayjs(params.value.startTime)
      : periodStartTime
    return {
      periodKey,
      startDate: startTime.format('YYYY-MM-DD'),
      weekDay: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][startTime.day()],
      overdueDays: Math.max(0, dayjs().startOf('day').diff(startTime.startOf('day'), 'day')),
    }
  }))

/** 获得周期起始日期：周报按周次推算，月报取月初，日报取当天 */
function getPeriodStart(periodKey: string) {
  if (params.value?.type === OA_WORK_REPORT_TYPE.WEEKLY) {
    const [year, weekNumber] = periodKey.split('-').map(Number)
    const yearStartTime = dayjs(`${year}-01-01`)
    return yearStartTime.subtract((yearStartTime.day() + 6) % 7, 'day').add((weekNumber || 1) - 1, 'week')
  }
  return dayjs(params.value?.type === OA_WORK_REPORT_TYPE.MONTHLY ? `${periodKey}-01` : periodKey)
}

/** 打开弹窗 */
function open(data: WorkReportUserStatistics, tab: number, statisticsParams: StatisticsParams) {
  user.value = data
  tabIndex.value = tab
  params.value = { ...statisticsParams }
  visible.value = true
}
defineExpose({ open })
/** 查看汇报详情 */
function handleReportDetail(report: WorkReport) {
  uni.navigateTo({
    url: `/pages-oa/workreport/detail/index?id=${report.id}`,
  })
}
</script>
