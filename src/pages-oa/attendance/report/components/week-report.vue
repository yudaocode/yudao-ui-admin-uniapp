<template>
  <view>
    <!-- 统计周期 -->
    <view class="flex items-center justify-between bg-white px-24rpx py-16rpx">
      <view class="flex items-center gap-8rpx text-28rpx text-[#1677ff]" @click="handlePeriodChange(-1)">
        <wd-icon name="arrow-left" size="28rpx" color="#1677ff" />
        <text>上一周</text>
      </view>
      <view class="flex items-center gap-8rpx text-28rpx text-[#333] font-semibold" @click="periodPickerVisible = true">
        <text>{{ periodText }}</text>
        <wd-icon name="arrow-down" size="28rpx" color="#999" />
      </view>
      <view class="flex items-center gap-8rpx text-28rpx text-[#1677ff]" @click="handlePeriodChange(1)">
        <text>下一周</text>
        <wd-icon name="arrow-right" size="28rpx" color="#1677ff" />
      </view>
    </view>
    <wd-datetime-picker
      v-model="periodDate"
      v-model:visible="periodPickerVisible"
      type="date"
      title="选择统计周期"
      @confirm="getList"
    />

    <!-- 成员筛选 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <UserSearchPicker v-model="queryUserId" label="成员" placeholder="请选择成员，默认管理范围" @change="getList" />
    </view>

    <!-- 周报：成员 x 每日打卡 -->
    <view class="px-24rpx pb-24rpx">
      <view
        v-for="user in list"
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
            <text
              v-if="day.clockInId && hasAccessByCodes(['oa:attendance:update'])"
              class="text-[#1677ff]"
              @click="handleDetail(day.clockInId)"
            >
              {{ formatClockTime(day.clockInTime) }}
            </text>
            <text v-else :class="day.clockInTime ? 'text-[#333]' : 'text-[#999]'">{{ formatClockTime(day.clockInTime) }}</text>
            <dict-tag v-if="day.clockInStatus != null" :type="DICT_TYPE.OA_ATTENDANCE_STATUS" :value="day.clockInStatus" />
          </view>
          <view class="flex flex-1 items-center gap-8rpx">
            <text class="shrink-0 text-22rpx text-[#999]">下班</text>
            <text
              v-if="day.clockOutId && hasAccessByCodes(['oa:attendance:update'])"
              class="text-[#1677ff]"
              @click="handleDetail(day.clockOutId)"
            >
              {{ formatClockTime(day.clockOutTime) }}
            </text>
            <text v-else :class="day.clockOutTime ? 'text-[#333]' : 'text-[#999]'">{{ formatClockTime(day.clockOutTime) }}</text>
            <dict-tag v-if="day.clockOutStatus != null" :type="DICT_TYPE.OA_ATTENDANCE_STATUS" :value="day.clockOutStatus" />
          </view>
        </view>
      </view>
      <view v-if="!list.length" class="py-60rpx text-center text-28rpx text-[#999]">
        暂无周报数据
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceWeekReport } from '@/api/oa/attendance'
import dayjs from 'dayjs'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getAttendanceWeekReport } from '@/api/oa/attendance'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

const { hasAccessByCodes } = useAccess()
const periodDate = ref<number>(Date.now()) // 统计周期内任意日期
const periodPickerVisible = ref(false) // 周期选择器显示状态
const queryUserId = ref<number>() // 成员筛选，空为管理范围
const list = ref<AttendanceWeekReport[]>([]) // 周报数据
const WEEK_DAY_TEXTS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] // 星期文案，下标对齐 dayjs day()

const periodText = computed(() => { // 周报显示周一起止日期
  const begin = getWeekBegin(dayjs(periodDate.value))
  return `${formatDate(begin.toDate())} ~ ${formatDate(begin.add(6, 'day').toDate())}`
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

/** 查询考勤周报 */
async function getList() {
  list.value = await getAttendanceWeekReport({
    startDate: formatDate(periodDate.value),
    userId: queryUserId.value,
  })
}

/** 切换上一个或下一个统计周期 */
function handlePeriodChange(step: number) {
  periodDate.value = dayjs(periodDate.value).add(step, 'week').valueOf()
  getList()
}

/** 查看打卡记录，在详情页修改状态 */
function handleDetail(id: number) {
  uni.navigateTo({ url: `/pages-oa/attendance/detail/index?id=${id}` })
}

/** 初始化并监听考勤修改 */
onMounted(() => {
  uni.$on('oa:attendance:reload', getList)
  getList()
})
/** 卸载时移除刷新监听 */
onBeforeUnmount(() => {
  uni.$off('oa:attendance:reload', getList)
})
</script>
