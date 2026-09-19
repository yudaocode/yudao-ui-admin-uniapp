<template>
  <view>
    <ScheduleCalendar v-model="selectedDate" :schedules="schedules" @month-change="getScheduleList" />
    <view class="mt-16rpx rounded-12rpx bg-white p-24rpx">
      <view class="mb-12rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">{{ selectedDateTitle }}</text>
        <text class="text-26rpx text-[#1677ff]" @click="handleGo('/pages-oa/schedule/calendar/index')">日程管理</text>
      </view>
      <view v-if="!selectedSchedules.length" class="py-16rpx text-center text-24rpx text-[#999]">
        暂无日程
      </view>
      <view
        v-for="item in selectedSchedules"
        :key="item.id"
        class="mb-8rpx flex items-center gap-16rpx"
        @click="handleGo(`/pages-oa/schedule/detail/index?id=${item.id}`)"
      >
        <text class="w-88rpx shrink-0 text-24rpx text-[#1677ff]">
          {{ dayjs(item.startTime).isSame(selectedDate, 'day') ? dayjs(item.startTime).format('HH:mm') : '持续' }}
        </text>
        <text class="line-clamp-1 min-w-0 flex-1 text-28rpx text-[#333]">{{ item.title }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Schedule } from '@/api/oa/schedule'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { getMySchedulePage } from '@/api/oa/schedule'
import ScheduleCalendar from '../../schedule/components/schedule-calendar.vue'

const schedules = ref<Schedule[]>([]) // 当前月份日程
const selectedDate = ref(dayjs().format('YYYY-MM-DD')) // 选中日期

const selectedDateTitle = computed(() => dayjs(selectedDate.value).format('MM 月 DD 日日程')) // 选中日期标题
const selectedSchedules = computed(() => // 选中日期的日程列表，跨天日程归入覆盖的每个自然日
  schedules.value.filter((item) => {
    const selected = dayjs(selectedDate.value)
    return !dayjs(item.startTime).startOf('day').isAfter(selected) && !dayjs(item.endTime).startOf('day').isBefore(selected)
  }))

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 查询选中月份的全部日程，避免只展示第一页 */
async function getScheduleList(month: string) {
  const beginTime = dayjs(`${month}-01`).startOf('month').format('YYYY-MM-DD HH:mm:ss')
  const endTime = dayjs(`${month}-01`).endOf('month').format('YYYY-MM-DD HH:mm:ss')
  const list: Schedule[] = []
  let pageNo = 1
  let total = 0
  do {
    const data = await getMySchedulePage({
      pageNo,
      pageSize: 200,
      startTime: [beginTime, endTime],
    })
    list.push(...data.list)
    total = data.total
    pageNo++
    if (!data.list.length) {
      break
    }
  } while (list.length < total)
  schedules.value = list
}

/** 初始化 */
onMounted(() => {
  getScheduleList(dayjs().format('YYYY-MM'))
})
</script>
