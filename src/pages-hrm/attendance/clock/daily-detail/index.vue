<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="navbarTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 空状态 -->
    <view v-if="!loading && !detail" class="py-120rpx text-center text-28rpx text-[#999]">
      暂无当日考勤详情
    </view>

    <template v-else-if="detail">
      <!-- 摘要 -->
      <view class="bg-white px-24rpx py-24rpx">
        <view class="mb-12rpx truncate text-36rpx text-[#333] font-semibold">
          {{ detail.employeeName || '-' }}
        </view>
        <view class="text-26rpx text-[#666]">
          {{ detail.jobNumber || '-' }} · {{ detail.deptName || '-' }} · {{ detail.postName || '-' }}
        </view>
        <view class="mt-8rpx text-26rpx text-[#666]">
          {{ formatDate(detail.attendanceTime) || attendanceDate || '-' }}
        </view>
      </view>

      <!-- 概况字段 -->
      <wd-cell-group border class="mt-16rpx">
        <wd-cell title="班次" :value="detail.shiftName || '未排班'" />
        <wd-cell title="考勤结果" :value="detail.attendanceResult || '-'" />
        <wd-cell title="应打卡次数" :value="`${detail.requiredClockCount ?? 0}`" />
        <wd-cell title="实际打卡次数" :value="`${detail.clockList?.length || 0}`" />
        <wd-cell title="迟到" :value="`${detail.lateCount ?? 0} 次 / ${detail.lateMinutes ?? 0} 分`" />
        <wd-cell title="早退" :value="`${detail.earlyCount ?? 0} 次 / ${detail.earlyMinutes ?? 0} 分`" />
        <wd-cell title="缺卡" :value="`${detail.misscardCount ?? 0} 次`" />
        <wd-cell title="旷工" :value="detail.absenteeism ? `${formatHrmDays(detail.absenteeismDays)} 天` : '否'" />
        <wd-cell
          v-if="detail.leaveStatus"
          title="请假"
          :value="`${formatHrmDays(detail.leaveDays)} 天`"
        />
      </wd-cell-group>

      <!-- 打卡记录 -->
      <view class="mt-16rpx px-24rpx py-16rpx text-28rpx text-[#999]">
        打卡记录
      </view>
      <view v-if="!(detail.clockList?.length)" class="py-48rpx text-center text-28rpx text-[#999]">
        暂无打卡记录
      </view>
      <view v-else class="px-24rpx pb-48rpx">
        <view
          v-for="clock in detail.clockList"
          :key="clock.id || String(clock.clockTime)"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between gap-12rpx">
            <dict-tag
              v-if="clock.type != null"
              :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE"
              :value="clock.type"
            />
            <text v-else class="text-28rpx text-[#333]">-</text>
            <dict-tag
              v-if="clock.status != null"
              :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS"
              :value="clock.status"
            />
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">应打卡：</text>{{ formatDateTime(clock.attendanceTime) || '-' }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">打卡时间：</text>{{ formatDateTime(clock.clockTime) || '-' }}
          </view>
          <view v-if="clock.address" class="text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">地点：</text>{{ clock.address }}
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceDailyDetail } from '@/api/hrm/attendance/statistics'
import { computed, onMounted, ref } from 'vue'
import { getAttendanceDailyDetail } from '@/api/hrm/attendance/statistics'
import { formatHrmDays } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateStartTime, formatDateTime } from '@/utils/date'

const props = defineProps<{
  employeeId?: number | any
  attendanceDate?: string | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const loading = ref(false) // 详情加载中
const detail = ref<AttendanceDailyDetail>() // 每日考勤详情
const attendanceDate = computed(() => { // 考勤日期文案
  const value = props.attendanceDate ? String(props.attendanceDate) : ''
  return formatDate(value) || value || ''
})
const navbarTitle = computed(() => { // 导航栏标题
  if (!detail.value?.employeeName) {
    return '每日考勤详情'
  }
  return `${detail.value.employeeName} ${attendanceDate.value}`.trim()
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/attendance/clock/index')
}

/** 加载每日考勤详情 */
async function getDetail() {
  if (!props.employeeId || !props.attendanceDate) {
    return
  }
  loading.value = true
  try {
    detail.value = await getAttendanceDailyDetail({
      employeeId: Number(props.employeeId),
      attendanceTime: formatDateStartTime(String(props.attendanceDate)),
    })
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
