<template>
  <!-- 月历网格：日程打点，纯样式实现 -->
  <view class="rounded-12rpx bg-white p-24rpx">
    <!-- 月份切换 -->
    <view class="mb-16rpx flex items-center justify-between">
      <wd-icon name="arrow-left" size="36rpx" color="#666" @click="handleMonthChange(-1)" />
      <text class="text-30rpx text-[#333] font-semibold">{{ currentMonth.format('YYYY 年 MM 月') }}</text>
      <wd-icon name="arrow-right" size="36rpx" color="#666" @click="handleMonthChange(1)" />
    </view>
    <!-- 星期表头 -->
    <view class="grid grid-cols-7 mb-8rpx">
      <text
        v-for="day in weekDays"
        :key="day"
        class="py-8rpx text-center text-24rpx text-[#999]"
      >
        {{ day }}
      </text>
    </view>
    <!-- 日期网格 -->
    <view class="grid grid-cols-7">
      <view
        v-for="cell in dayCells"
        :key="cell.key"
        class="flex flex-col items-center py-8rpx"
        @click="handleSelect(cell)"
      >
        <view
          class="h-56rpx w-56rpx flex items-center justify-center rounded-full text-26rpx"
          :class="getDayClass(cell)"
        >
          {{ cell.date.date() }}
        </view>
        <view
          class="mt-2rpx h-8rpx w-8rpx rounded-full"
          :class="hasSchedule(cell) ? 'bg-[#3b82f6]' : 'bg-transparent'"
        />
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Schedule } from '@/api/oa/schedule'
import type { Dayjs } from 'dayjs'
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'

interface DayCell {
  key: string // 唯一标识
  date: Dayjs // 日期
  inMonth: boolean // 是否当前月份
}

const props = defineProps<{
  modelValue: string // 选中日期，YYYY-MM-DD
  schedules: Schedule[] // 当前月份日程，用于打点
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'monthChange': [month: string] // 月份切换，YYYY-MM
}>()

const weekDays = ['日', '一', '二', '三', '四', '五', '六'] // 星期表头
const currentMonth = ref(dayjs(props.modelValue).startOf('month')) // 当前展示月份

// 当前月份日历格子，固定 6 行 42 格
const dayCells = computed<DayCell[]>(() => {
  const firstDay = currentMonth.value.startOf('month')
  const start = firstDay.subtract(firstDay.day(), 'day')
  return Array.from({ length: 42 }, (_, index) => {
    const date = start.add(index, 'day')
    return {
      key: date.format('YYYY-MM-DD'),
      date,
      inMonth: date.month() === currentMonth.value.month(),
    }
  })
})

// 有日程的日期集合，跨天日程归入覆盖的每个自然日
const scheduleDateSet = computed(() => {
  const result = new Set<string>()
  props.schedules.forEach((item) => {
    let currentDate = dayjs(item.startTime).startOf('day')
    const endDate = dayjs(item.endTime).startOf('day')
    while (!currentDate.isAfter(endDate)) {
      result.add(currentDate.format('YYYY-MM-DD'))
      currentDate = currentDate.add(1, 'day')
    }
  })
  return result
})

/** 判断日期是否存在日程 */
function hasSchedule(cell: DayCell) {
  return cell.inMonth && scheduleDateSet.value.has(cell.key)
}

/** 日期样式：选中 > 今天 > 当月 > 其他月 */
function getDayClass(cell: DayCell) {
  if (cell.key === props.modelValue) {
    return 'bg-[#3b82f6] text-white'
  }
  if (cell.key === dayjs().format('YYYY-MM-DD')) {
    return 'border border-[#3b82f6] border-solid text-[#3b82f6]'
  }
  return cell.inMonth ? 'text-[#333]' : 'text-[#ccc]'
}

/** 选择日期 */
function handleSelect(cell: DayCell) {
  emit('update:modelValue', cell.key)
  // 点到其他月份的日期时跟随切换月份
  if (!cell.inMonth) {
    currentMonth.value = cell.date.startOf('month')
    emit('monthChange', currentMonth.value.format('YYYY-MM'))
  }
}

/** 切换月份 */
function handleMonthChange(offset: number) {
  currentMonth.value = currentMonth.value.add(offset, 'month')
  emit('monthChange', currentMonth.value.format('YYYY-MM'))
}

/** 外部选中日期变化时跟随切月 */
watch(() => props.modelValue, (value) => {
  const month = dayjs(value).startOf('month')
  if (!month.isSame(currentMonth.value, 'month')) {
    currentMonth.value = month
  }
})
</script>
