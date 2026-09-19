<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="考勤报表"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 报表类型页签 -->
    <wd-tabs v-model="tabIndex" @change="handleTypeChange">
      <wd-tab title="周报" />
      <wd-tab title="月报" />
    </wd-tabs>

    <!-- 统计周期：周报为所在周，月报为年月 -->
    <view class="flex items-center justify-between bg-white px-24rpx py-16rpx">
      <view class="flex items-center gap-8rpx text-28rpx text-[#1677ff]" @click="handlePeriodChange(-1)">
        <wd-icon name="arrow-left" size="28rpx" color="#1677ff" />
        <text>{{ tabIndex === 0 ? '上一周' : '上一月' }}</text>
      </view>
      <view class="flex items-center gap-8rpx text-28rpx text-[#333] font-semibold" @click="periodPickerVisible = true">
        <text>{{ periodText }}</text>
        <wd-icon name="arrow-down" size="28rpx" color="#999" />
      </view>
      <view class="flex items-center gap-8rpx text-28rpx text-[#1677ff]" @click="handlePeriodChange(1)">
        <text>{{ tabIndex === 0 ? '下一周' : '下一月' }}</text>
        <wd-icon name="arrow-right" size="28rpx" color="#1677ff" />
      </view>
    </view>
    <wd-datetime-picker
      v-model="periodDate"
      v-model:visible="periodPickerVisible"
      :type="tabIndex === 0 ? 'date' : 'year-month'"
      title="选择统计周期"
      @confirm="handlePeriodDateChange"
    />

    <!-- 成员筛选 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <UserSearchPicker v-model="queryUserId" label="成员" placeholder="请选择成员，默认管理范围" @confirm="getReport" />
    </view>

    <!-- 周报：成员 x 每日打卡 -->
    <view v-if="tabIndex === 0" class="px-24rpx pb-24rpx">
      <view
        v-for="user in weekReports"
        :key="user.userId"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx"
      >
        <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
          {{ user.userName }}<text v-if="user.deptName" class="ml-12rpx text-24rpx text-[#999] font-normal">{{ user.deptName }}</text>
        </view>
        <view
          v-for="day in user.dailyAttendances"
          :key="day.date"
          class="flex items-center justify-between border-0 border-b border-[#f5f5f5] border-solid py-12rpx text-26rpx last:border-b-0"
        >
          <text class="w-180rpx shrink-0 text-[#666]">{{ formatDate(day.date) }} {{ getWeekDayText(day.date) }}</text>
          <view class="flex flex-1 items-center gap-8rpx">
            <text class="shrink-0 text-22rpx text-[#999]">上班</text>
            <text :class="day.clockInTime ? 'text-[#333]' : 'text-[#999]'">{{ formatClockTime(day.clockInTime) }}</text>
            <dict-tag v-if="day.clockInStatus != null" :type="DICT_TYPE.OA_ATTENDANCE_STATUS" :value="day.clockInStatus" />
          </view>
          <view class="flex flex-1 items-center gap-8rpx">
            <text class="shrink-0 text-22rpx text-[#999]">下班</text>
            <text :class="day.clockOutTime ? 'text-[#333]' : 'text-[#999]'">{{ formatClockTime(day.clockOutTime) }}</text>
            <dict-tag v-if="day.clockOutStatus != null" :type="DICT_TYPE.OA_ATTENDANCE_STATUS" :value="day.clockOutStatus" />
          </view>
        </view>
      </view>
      <view v-if="!weekReports.length" class="py-60rpx text-center text-28rpx text-[#999]">
        暂无周报数据
      </view>
    </view>

    <!-- 月报：成员 x 次数汇总 -->
    <view v-else class="px-24rpx pb-24rpx">
      <view
        v-for="user in monthReports"
        :key="user.userId"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx"
      >
        <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
          {{ user.userName }}<text v-if="user.deptName" class="ml-12rpx text-24rpx text-[#999] font-normal">{{ user.deptName }}</text>
        </view>
        <view class="grid grid-cols-4 gap-12rpx text-center">
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#333] font-semibold">
              {{ user.normalCount }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              正常
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#f5222d] font-semibold">
              {{ user.lateCount }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              迟到
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#fa8c16] font-semibold">
              {{ user.earlyCount }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              早退
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#f5222d] font-semibold">
              {{ user.absentDays }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              旷工
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#333] font-semibold">
              {{ user.clockInCount }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              上班打卡
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#333] font-semibold">
              {{ user.clockOutCount }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              下班打卡
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#1677ff] font-semibold">
              {{ user.leaveDays }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              请假(天)
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#1677ff] font-semibold">
              {{ user.travelDays }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              出差(天)
            </view>
          </view>
        </view>
      </view>
      <view v-if="!monthReports.length" class="py-60rpx text-center text-28rpx text-[#999]">
        暂无月报数据
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceMonthReport, AttendanceWeekReport } from '@/api/oa/attendance'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { getAttendanceMonthReport, getAttendanceWeekReport } from '@/api/oa/attendance'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabIndex = ref(0) // 报表类型页签下标：0 周报 / 1 月报
const WEEK_DAY_TEXTS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] // 星期文案，下标对齐 dayjs day()
const periodDate = ref<number>(Date.now()) // 统计周期内任意日期
const periodPickerVisible = ref(false) // 周期选择器显示状态
const queryUserId = ref<number>() // 成员筛选，空为管理范围
const weekReports = ref<AttendanceWeekReport[]>([]) // 周报数据
const monthReports = ref<AttendanceMonthReport[]>([]) // 月报数据

/** 周期展示文本：周报显示周一起止，月报显示年月 */
const periodText = computed(() => {
  if (tabIndex.value === 0) {
    const begin = getWeekBegin(dayjs(periodDate.value))
    return `${formatDate(begin.toDate())} ~ ${formatDate(begin.add(6, 'day').toDate())}`
  }
  return dayjs(periodDate.value).format('YYYY-MM')
})

/** 周报固定从周一开始，周日归入当前周 */
function getWeekBegin(date: dayjs.Dayjs) {
  const dayOfWeek = date.day()
  return date.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day')
}

/** 取日期的星期文案 */
function getWeekDayText(date: string) {
  return WEEK_DAY_TEXTS[dayjs(date).day()]
}

/** 取打卡时间的时分 */
function formatClockTime(time?: string) {
  return time ? formatDateTime(time)?.slice(11, 16) : '未打卡'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询报表 */
async function getReport() {
  if (tabIndex.value === 0) {
    weekReports.value = await getAttendanceWeekReport({
      startDate: formatDate(periodDate.value),
      userId: queryUserId.value,
    })
    return
  }
  const date = dayjs(periodDate.value)
  monthReports.value = await getAttendanceMonthReport({
    year: date.year(),
    month: date.month() + 1,
    userId: queryUserId.value,
  })
}

/** 切换报表类型：保留已选周期日期，周报按所在周、月报按所在月解释 */
function handleTypeChange({ index }: { index: number }) {
  tabIndex.value = index
  getReport()
}

/** 切换上一个或下一个统计周期 */
function handlePeriodChange(step: number) {
  periodDate.value = dayjs(periodDate.value).add(step, tabIndex.value === 0 ? 'week' : 'month').valueOf()
  getReport()
}

/** 选择统计周期 */
function handlePeriodDateChange() {
  getReport()
}

/** 初始化 */
onMounted(() => {
  getReport()
})
</script>
