<template>
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <text class="text-30rpx text-[#333] font-semibold">
        日历
      </text>
      <wd-button
        v-if="hasAccessByCodes(['hrm:employee:personal-note:create'])"
        size="small"
        type="primary"
        @click="personalNoteVisible = true"
      >
        添加备忘
      </wd-button>
    </view>

    <!-- 月份切换 -->
    <view class="px-24rpx py-16rpx">
      <view class="flex items-center justify-between">
        <wd-button size="small" variant="plain" @click="changeMonth(-1)">
          上月
        </wd-button>
        <view class="text-34rpx text-[#333] font-semibold">
          {{ currentMonthText }}
        </view>
        <wd-button size="small" variant="plain" @click="changeMonth(1)">
          下月
        </wd-button>
      </view>
    </view>

    <!-- 日历视图 -->
    <view class="px-24rpx pb-24rpx">
      <view class="overflow-hidden border border-[#e5e7eb] rounded-12rpx">
        <view class="grid grid-cols-7 border-b border-[#e5e7eb]">
          <view
            v-for="week in weekLabels"
            :key="week"
            class="border-r border-[#e5e7eb] py-12rpx text-center text-24rpx text-[#999] last:border-r-0"
          >
            {{ week }}
          </view>
        </view>

        <view v-if="loading" class="py-80rpx text-center text-26rpx text-[#999]">
          加载中...
        </view>
        <view v-else class="grid grid-cols-7">
          <view
            v-for="day in calendarDays"
            :key="day.date"
            class="min-h-96rpx border-b border-r border-[#e5e7eb] px-8rpx py-8rpx last:border-r-0"
            :class="[
              day.isCurrentMonth ? 'bg-white' : 'bg-[#fafafa]',
              day.date === selectedDate ? 'bg-[#e8f3ff]' : '',
            ]"
            @click="selectDate(day.date)"
          >
            <view class="flex items-start justify-between gap-4rpx">
              <text
                class="text-26rpx font-semibold leading-32rpx"
                :class="[
                  day.isCurrentMonth ? 'text-[#333]' : 'text-[#c8c9cc]',
                  day.isWeekend && day.isCurrentMonth ? 'text-[#f56c6c]' : '',
                ]"
              >
                {{ day.dayOfMonth }}
              </text>
              <view
                v-if="calendarDateSet.has(day.date)"
                class="mt-8rpx h-10rpx w-10rpx rounded-full bg-[#1677ff]"
              />
            </view>
            <view v-if="day.isToday" class="mt-2rpx text-20rpx text-[#1677ff] leading-24rpx">
              今天
            </view>
          </view>
        </view>
      </view>

      <!-- 选中日期摘要 -->
      <view class="mt-24rpx flex items-center rounded-12rpx bg-[#e8f3ff] px-24rpx py-20rpx">
        <view class="mr-20rpx text-48rpx text-[#333] font-semibold leading-none">
          {{ selectedDayText }}
        </view>
        <view>
          <view class="text-28rpx text-[#333]">
            {{ selectedWeekdayText }}
          </view>
          <view class="mt-4rpx text-24rpx text-[#999]">
            {{ selectedDate }}
          </view>
        </view>
      </view>

      <!-- 当天事项 -->
      <view class="mt-24rpx text-28rpx text-[#333] font-semibold">
        当天事项
      </view>
      <view class="mt-12rpx min-h-160rpx">
        <view
          v-for="item in visibleDayItems"
          :key="`${item.type}-${item.personalNoteId || item.typeId || item.content}`"
          class="mb-16rpx flex items-center gap-12rpx"
        >
          <wd-tag :type="eventTagType(item.type)" mark>
            {{ item.typeName }}
          </wd-tag>
          <text
            v-if="shouldShowItemTime(item)"
            class="shrink-0 text-22rpx text-[#999]"
          >
            {{ formatDate(item.eventTime, 'HH:mm') }}
          </text>
          <text
            class="min-w-0 flex-1 truncate text-26rpx"
            :class="canOpenItem(item) ? 'text-[#1677ff]' : 'text-[#333]'"
            @click="handleItemClick(item)"
          >
            {{ item.content }}
          </text>
          <wd-button
            v-if="item.personalNoteId && hasAccessByCodes(['hrm:employee:personal-note:delete'])"
            size="small"
            type="error"
            variant="text"
            @click="handleDeletePersonalNote(item.personalNoteId)"
          >
            删除
          </wd-button>
        </view>
        <wd-button
          v-if="dayItems.length > 4 && !showAllEvents"
          size="small"
          type="primary"
          variant="text"
          @click="showAllEvents = true"
        >
          查看更多事项
        </wd-button>
        <view v-if="!loading && dayItems.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">
          暂无数据
        </view>
      </view>
    </view>

    <!-- 新增备忘弹窗 -->
    <PersonalNoteForm
      v-model="personalNoteVisible"
      :date="selectedDate"
      @success="refreshCalendar"
    />
  </view>
</template>

<script lang="ts" setup>
import type { HomeCalendarItem } from '@/api/hrm/home'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteEmployeePersonalNote } from '@/api/hrm/employee/personal-note'
import { useAccess } from '@/hooks/useAccess'
import { HrmHomeCalendarItemType } from '@/pages-hrm/utils/constants'
import { formatDate } from '@/utils/date'
import PersonalNoteForm from './personal-note-form.vue'

interface CalendarDay {
  date: string
  dayOfMonth: string
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

const props = defineProps<{
  getCalendarItems: (params: {
    startDate: string
    endDate: string
  }) => Promise<HomeCalendarItem[]>
  itemFilter?: (item: HomeCalendarItem) => boolean
  isItemClickable?: (item: HomeCalendarItem) => boolean
  showItemTime?: (item: HomeCalendarItem) => boolean
}>()

const emit = defineEmits<{
  'item-click': [item: HomeCalendarItem]
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const weekLabels = ['一', '二', '三', '四', '五', '六', '日'] // 周标题，对齐 MES 排班日历
const weekdayLabels = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const loading = ref(false) // 加载中
const currentMonth = ref(dayjs().startOf('month')) // 当前查看月份
const selectedDate = ref(dayjs().format('YYYY-MM-DD')) // 选中日期
const calendarItems = ref<HomeCalendarItem[]>([]) // 日历事项列表
const showAllEvents = ref(false) // 是否展示全部事项
const personalNoteVisible = ref(false) // 备忘弹窗

const currentMonthText = computed(() => currentMonth.value.format('YYYY年MM月'))
const selectedDayText = computed(() => dayjs(selectedDate.value).format('DD'))
const selectedWeekdayText = computed(() => weekdayLabels[dayjs(selectedDate.value).day()])
const calendarDateSet = computed(() => new Set(calendarItems.value.map(item => item.date)))
const dayItems = computed(() => calendarItems.value.filter(item => item.date === selectedDate.value))
const visibleDayItems = computed(() => showAllEvents.value ? dayItems.value : dayItems.value.slice(0, 4))

const calendarDays = computed<CalendarDay[]>(() => { // 当月日历格子（周一开头，对齐 MES）
  const startOfMonth = currentMonth.value.startOf('month')
  const endOfMonth = currentMonth.value.endOf('month')
  const mondayOffset = (startOfMonth.day() + 6) % 7
  const start = startOfMonth.subtract(mondayOffset, 'day')
  const totalDays = Math.ceil((mondayOffset + endOfMonth.date()) / 7) * 7
  return Array.from({ length: totalDays }, (_, index) => {
    const day = start.add(index, 'day')
    return {
      date: day.format('YYYY-MM-DD'),
      dayOfMonth: day.format('D'),
      isCurrentMonth: day.month() === currentMonth.value.month(),
      isToday: day.isSame(dayjs(), 'day'),
      isWeekend: day.day() === 0 || day.day() === 6,
    }
  })
})

watch(selectedDate, () => {
  showAllEvents.value = false
})

/** 刷新当前月份的日历 */
async function refreshCalendar() {
  loading.value = true
  try {
    const items = await props.getCalendarItems({
      startDate: currentMonth.value.startOf('month').format('YYYY-MM-DD'),
      endDate: currentMonth.value.endOf('month').format('YYYY-MM-DD'),
    })
    calendarItems.value = props.itemFilter ? items.filter(props.itemFilter) : items
  } finally {
    loading.value = false
  }
}
defineExpose({ refresh: refreshCalendar })

/** 切换月份 */
async function changeMonth(offset: number) {
  currentMonth.value = currentMonth.value.add(offset, 'month')
  const nextSelected = currentMonth.value.date(
    Math.min(dayjs(selectedDate.value).date(), currentMonth.value.daysInMonth()),
  )
  selectedDate.value = nextSelected.format('YYYY-MM-DD')
  await refreshCalendar()
}

/** 选择日期 */
function selectDate(date: string) {
  selectedDate.value = date
  const nextMonth = dayjs(date).startOf('month')
  if (!nextMonth.isSame(currentMonth.value, 'month')) {
    currentMonth.value = nextMonth
    refreshCalendar()
  }
}

/** 是否可打开日历事项 */
function canOpenItem(item: HomeCalendarItem) {
  return props.isItemClickable?.(item) === true
}

/** 是否展示事项时间 */
function shouldShowItemTime(item: HomeCalendarItem) {
  return !!item.eventTime && (props.showItemTime ? props.showItemTime(item) : true)
}

/** 日历事项点击操作 */
function handleItemClick(item: HomeCalendarItem) {
  if (canOpenItem(item)) {
    emit('item-click', item)
  }
}

/** 删除个人备忘 */
async function handleDeletePersonalNote(id: number) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该备忘吗？',
    })
  } catch {
    return
  }
  await deleteEmployeePersonalNote(id)
  toast.success('删除成功')
  await refreshCalendar()
}

/** 获取日历事项标签类型 */
function eventTagType(type: number) {
  switch (type) {
    case HrmHomeCalendarItemType.NOTE:
    case HrmHomeCalendarItemType.RECRUIT:
      return 'primary'
    case HrmHomeCalendarItemType.BIRTHDAY:
      return 'danger'
    case HrmHomeCalendarItemType.ENTRY:
    case HrmHomeCalendarItemType.REGULAR:
      return 'success'
    case HrmHomeCalendarItemType.LEAVE:
      return 'warning'
    default:
      return 'default'
  }
}

/** 初始化 */
onMounted(() => {
  refreshCalendar()
})
</script>
