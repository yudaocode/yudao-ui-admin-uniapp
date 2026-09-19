<template>
  <view class="rounded-12rpx bg-[linear-gradient(135deg,#409eff,#66b1ff)] p-24rpx text-white" @click="handleGo('/pages-oa/attendance/my/index')">
    <view class="mb-8rpx flex items-center justify-between">
      <text class="text-26rpx opacity-90">今日考勤</text>
      <text class="text-24rpx underline" @click.stop="handleClock">立即打卡</text>
    </view>
    <view class="truncate text-36rpx font-semibold">
      {{ attendanceText }}
    </view>
    <view class="mt-4rpx truncate text-22rpx opacity-85">
      {{ attendanceDescription }}
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Attendance } from '@/api/oa/attendance'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { clockAttendance, getMyTodayAttendanceList } from '@/api/oa/attendance'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'

const toast = useToast()
const attendance = ref<Attendance>() // 今日最近打卡
const clockLoading = ref(false) // 打卡提交中

const attendanceText = computed(() => { // 今日最近打卡类型
  if (!attendance.value?.type) {
    return '未打卡'
  }
  return getDictLabel(DICT_TYPE.OA_ATTENDANCE_TYPE, attendance.value.type)
})
const attendanceDescription = computed(() => { // 今日最近打卡说明
  if (!attendance.value?.attendanceTime) {
    return '今天还没有考勤记录'
  }
  const status = getDictLabel(DICT_TYPE.OA_ATTENDANCE_STATUS, attendance.value.status)
  return `${dayjs(attendance.value.attendanceTime).format('HH:mm:ss')} · ${status}`
})

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 今日考勤打卡 */
async function handleClock() {
  if (clockLoading.value) {
    return
  }
  clockLoading.value = true
  try {
    await clockAttendance()
    toast.success('打卡成功')
    attendance.value = (await getMyTodayAttendanceList()).slice(-1)[0]
  } finally {
    clockLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getMyTodayAttendanceList().then((data) => {
    attendance.value = data.slice(-1)[0]
  })
})
</script>
