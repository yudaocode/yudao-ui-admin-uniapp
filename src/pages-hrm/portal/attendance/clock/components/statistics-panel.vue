<template>
  <scroll-view class="min-h-0 flex-1" scroll-y>
    <view class="pb-40rpx">
      <!-- 月份切换 -->
      <view class="bg-white px-24rpx py-20rpx">
        <view
          class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-[#f7f8fa] px-24rpx"
          @click="monthVisible = true"
        >
          <text class="text-30rpx text-[#333] font-semibold">
            {{ monthText }}
          </text>
          <wd-icon name="arrow-down" size="28rpx" color="#666" />
        </view>
        <wd-datetime-picker
          v-model="selectedMonth"
          v-model:visible="monthVisible"
          title="请选择月份"
          type="year-month"
          :max-date="maxMonth"
          @confirm="handleMonthChange"
        />
      </view>

      <!-- 月历 -->
      <view class="statistics-calendar mt-20rpx bg-white px-16rpx py-20rpx">
        <wd-calendar-view
          v-model="selectedDate"
          type="date"
          :min-date="monthStart"
          :max-date="monthEnd"
          :formatter="calendarFormatter"
          :show-panel-title="false"
          :panel-height="378"
        />
        <view
          class="mt-16rpx flex items-center justify-center gap-32rpx text-22rpx text-[#999]"
        >
          <view class="flex items-center gap-8rpx">
            <view class="h-10rpx w-10rpx rounded-full bg-[#52c41a]" />
            正常
          </view>
          <view class="flex items-center gap-8rpx">
            <view class="h-10rpx w-10rpx rounded-full bg-[#ff4d4f]" />
            异常
          </view>
          <view class="flex items-center gap-8rpx">
            <view class="h-10rpx w-10rpx rounded-full bg-[#d9d9d9]" />
            休息
          </view>
        </view>
      </view>

      <!-- 选日详情 -->
      <view class="mx-24rpx mt-20rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          {{ selectedDateText }} 打卡详情
        </view>
        <view
          v-if="loading"
          class="py-40rpx text-center text-26rpx text-[#999]"
        >
          加载中
        </view>
        <view
          v-else-if="!selectedDayDetail"
          class="py-40rpx text-center text-26rpx text-[#999]"
        >
          暂无当日明细
        </view>
        <template v-else>
          <view class="mb-16rpx text-26rpx text-[#666]">
            {{
              selectedDayDetail.shiftName
                || (selectedDayDetail.scheduled === false ? "休息" : "-")
            }}
            · {{ selectedDayDetail.attendanceResult || "-" }}
          </view>
          <view
            v-if="!selectedDayDetail.clockList?.length"
            class="py-24rpx text-center text-26rpx text-[#999]"
          >
            暂无打卡记录
          </view>
          <view
            v-for="clock in selectedDayDetail.clockList || []"
            :key="clock.id || `${clock.type}-${clock.clockTime}`"
            class="mb-16rpx flex items-center justify-between gap-16rpx border-b border-b-[#f5f5f5] pb-16rpx last:mb-0 last:border-b-0 last:pb-0"
          >
            <view class="min-w-0 flex-1">
              <view class="text-28rpx text-[#333]">
                {{
                  clock.type === HrmAttendanceClockType.OFF_DUTY
                    ? "下班"
                    : "上班"
                }}
                {{ formatDate(clock.clockTime, "HH:mm:ss") || "--:--" }}
              </view>
              <view class="mt-6rpx text-24rpx text-[#999]">
                {{ clock.address || "无定位信息" }}
              </view>
            </view>
            <dict-tag
              v-if="clock.status != null"
              :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS"
              :value="clock.status"
            />
          </view>
        </template>
      </view>

      <!-- 月汇总 -->
      <view class="mx-24rpx mt-20rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          {{ String(yearMonth.month).padStart(2, "0") }}月汇总
        </view>
        <view class="grid grid-cols-3 gap-16rpx">
          <view
            class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-20rpx text-center"
          >
            <view class="text-22rpx text-[#999]">
              应出勤(天)
            </view>
            <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
              {{ monthDetail?.summary?.attendDays ?? 0 }}
            </view>
          </view>
          <view
            class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-20rpx text-center"
          >
            <view class="text-22rpx text-[#999]">
              实出勤(天)
            </view>
            <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
              {{ formatHrmDays(monthDetail?.summary?.actualDays) }}
            </view>
          </view>
          <view
            class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-20rpx text-center"
          >
            <view class="text-22rpx text-[#999]">
              迟到(次)
            </view>
            <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
              {{ monthDetail?.summary?.lateCount ?? 0 }}
            </view>
          </view>
          <view
            class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-20rpx text-center"
          >
            <view class="text-22rpx text-[#999]">
              早退(次)
            </view>
            <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
              {{ monthDetail?.summary?.earlyCount ?? 0 }}
            </view>
          </view>
          <view
            class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-20rpx text-center"
          >
            <view class="text-22rpx text-[#999]">
              缺卡(次)
            </view>
            <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
              {{ monthDetail?.summary?.misscardCount ?? 0 }}
            </view>
          </view>
          <view
            class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-20rpx text-center"
          >
            <view class="text-22rpx text-[#999]">
              请假(天)
            </view>
            <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
              {{ formatHrmDays(monthDetail?.summary?.leaveDays) }}
            </view>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import type {
  CalendarDayItem,
  CalendarFormatter,
} from '@wot-ui/ui/components/wd-calendar-view/types'
import type { PortalAttendanceMonthDetail } from '@/api/hrm/portal/attendance/statistics'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { getPortalAttendanceMonthDetail } from '@/api/hrm/portal/attendance/statistics'
import { HrmAttendanceClockType } from '@/pages-hrm/utils/constants'
import { getHrmAttendanceDayState } from '@/pages-hrm/utils/attendance'
import {
  formatHrmDays,
  formatHrmYearMonth,
  getAttendanceYearMonth,
} from '@/pages-hrm/utils/format'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'

const selectedMonth = ref(Date.now()) // 统计月份
const selectedDate = ref(Date.now()) // 选中日期
const monthVisible = ref(false) // 月份选择器
const maxMonth = dayjs().endOf('month').valueOf() // 最大月份
const loading = ref(false) // 统计加载状态
const monthDetail = ref<PortalAttendanceMonthDetail>() // 月度考勤详情

const yearMonth = computed(() => getAttendanceYearMonth(selectedMonth.value))
const monthText = computed(() =>
  formatHrmYearMonth(yearMonth.value.year, yearMonth.value.month),
)
const monthStart = computed(() =>
  dayjs(selectedMonth.value).startOf('month').valueOf(),
)
const monthEnd = computed(() =>
  dayjs(selectedMonth.value).endOf('month').valueOf(),
)
const selectedDateKey = computed(() => formatDate(selectedDate.value))
const selectedDateText = computed(
  () => formatDate(selectedDate.value, 'MM月DD日') || '-',
)
const dailyDetailMap = computed(
  () =>
    new Map(
      (monthDetail.value?.dailyDetails || []).map(item => [
        formatDate(item.attendanceTime),
        item,
      ]),
    ),
)
const selectedDayDetail = computed(() =>
  dailyDetailMap.value.get(selectedDateKey.value),
)
const calendarFormatter = computed<CalendarFormatter>(() => {
  // 月历考勤状态
  return (day: CalendarDayItem) => {
    const state = getHrmAttendanceDayState(
      dailyDetailMap.value.get(formatDate(day.date)),
    )
    return state
      ? { ...day, bottomInfo: '●', customClass: `attendance-day-${state}` }
      : day
  }
})

/** 月份变更 */
async function handleMonthChange() {
  selectedDate.value = dayjs(selectedMonth.value).startOf('month').valueOf()
  await loadStatistics()
}

/** 加载月度统计 */
async function loadStatistics() {
  loading.value = true
  try {
    const { year, month } = yearMonth.value
    monthDetail.value = await getPortalAttendanceMonthDetail({ year, month })
    const today = dayjs()
    if (today.year() === year && today.month() + 1 === month) {
      selectedDate.value = today.valueOf()
    } else if (!selectedDayDetail.value) {
      selectedDate.value = monthStart.value
    }
  } finally {
    loading.value = false
  }
}

defineExpose({ loadStatistics })
</script>

<style lang="scss" scoped>
.statistics-calendar {
  :deep(.attendance-day-normal .wd-month__day-bottom) {
    color: #52c41a;
  }

  :deep(.attendance-day-abnormal .wd-month__day-bottom) {
    color: #ff4d4f;
  }

  :deep(.attendance-day-rest .wd-month__day-bottom) {
    color: #d9d9d9;
  }
}
</style>
