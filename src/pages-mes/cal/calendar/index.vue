<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="排班日历" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 视图筛选 -->
    <view class="bg-white px-24rpx py-16rpx">
      <view class="grid grid-cols-3 overflow-hidden rounded-12rpx bg-[#f5f7fa] p-6rpx">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="rounded-10rpx py-12rpx text-center text-26rpx"
          :class="activeTab === tab.key ? 'bg-white text-[#1677ff] font-semibold shadow-sm' : 'text-[#666]'"
          @click="handleTabChange(tab.key)"
        >
          {{ tab.title }}
        </view>
      </view>

      <view class="mt-14rpx">
        <scroll-view v-if="activeTab === 'type'" scroll-x>
          <view class="flex gap-12rpx">
            <wd-tag
              v-for="dict in calendarTypeOptions"
              :key="dict.value"
              custom-class="shrink-0"
              :type="selectedCalendarType === dict.value ? 'primary' : 'default'"
              :plain="selectedCalendarType !== dict.value"
              @click="selectCalendarType(dict.value)"
            >
              {{ dict.label }}
            </wd-tag>
          </view>
        </scroll-view>

        <view v-else-if="activeTab === 'team'">
          <wd-cell
            title="班组"
            :value="selectedTeamName || '请选择班组'"
            is-link
            @click="teamPickerVisible = true"
          />
          <view v-if="teamOptions.length === 0" class="mt-16rpx text-24rpx text-[#999]">
            暂无班组数据，请先维护班组后查看排班日历。
          </view>
        </view>

        <UserPicker
          v-else
          v-model="selectedUserId"
          type="radio"
          label="人员"
          placeholder="请选择人员"
          @confirm="handleUserConfirm"
        />
      </view>
    </view>

    <!-- 月份切换和图例 -->
    <view class="mt-12rpx bg-white px-24rpx py-16rpx">
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
      <view class="mt-12rpx flex flex-wrap items-center justify-center gap-x-18rpx gap-y-8rpx text-22rpx text-[#666]">
        <view class="flex items-center gap-8rpx">
          <text class="h-14rpx w-14rpx rounded-4rpx bg-[#95d475]" />
          <text>白班</text>
        </view>
        <view class="flex items-center gap-8rpx">
          <text class="h-14rpx w-14rpx rounded-4rpx bg-[#f0a020]" />
          <text>中班（三班倒）</text>
        </view>
        <view class="flex items-center gap-8rpx">
          <text class="h-14rpx w-14rpx rounded-4rpx bg-[#909399]" />
          <text>中班/夜班</text>
        </view>
        <view class="flex items-center gap-8rpx">
          <text class="h-14rpx w-14rpx rounded-4rpx bg-[#52c41a]" />
          <text>节假日</text>
        </view>
      </view>
    </view>

    <!-- 日历视图 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="px-24rpx py-18rpx">
        <view class="mx-auto max-w-760rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
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
              class="min-h-112rpx border-b border-r border-[#e5e7eb] px-8rpx py-8rpx last:border-r-0"
              :class="day.isCurrentMonth ? 'bg-white' : 'bg-[#fafafa]'"
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
                <text
                  v-if="day.isCurrentMonth"
                  class="rounded-6rpx px-6rpx py-1rpx text-18rpx text-white leading-24rpx"
                  :class="isHoliday(day.date) ? 'bg-[#52c41a]' : 'bg-[#1677ff]'"
                >
                  {{ isHoliday(day.date) ? '休' : '班' }}
                </text>
              </view>
              <view v-if="day.isToday" class="mt-2rpx text-20rpx text-[#1677ff] leading-24rpx">
                今天
              </view>
              <view v-if="day.isCurrentMonth && !isHoliday(day.date)" class="mt-4rpx">
                <view
                  v-if="getPrimaryShift(day.date)"
                  class="truncate rounded-6rpx px-5rpx py-1rpx text-18rpx text-white leading-24rpx"
                  :class="getShiftClass(day.date, getPrimaryShift(day.date)?.sort || 0)"
                >
                  {{ getShiftSummary(day.date) }}
                </view>
              </view>
              <view v-if="day.isCurrentMonth && isHoliday(day.date)" class="mt-4rpx truncate text-20rpx text-[#52c41a] leading-24rpx">
                节假日
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 班组选择 -->
    <wd-picker
      v-model:visible="teamPickerVisible"
      :model-value="teamPickerValue"
      title="选择班组"
      :columns="teamOptions"
      label-key="label"
      value-key="value"
      @cancel="teamPickerVisible = false"
      @confirm="handleTeamConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { CalCalendarDay, CalCalendarTeamShiftItem } from '@/api/mes/cal/calendar'
import type { CalHoliday } from '@/api/mes/cal/holiday'
import type { CalTeam } from '@/api/mes/cal/team'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { getCalendarList } from '@/api/mes/cal/calendar'
import { getHolidayList } from '@/api/mes/cal/holiday'
import { getTeamList } from '@/api/mes/cal/team'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesCalHolidayTypeEnum, MesCalShiftTypeEnum } from '@/utils/constants'
import { formatDateEndTime, formatDateOnly, formatDateStartTime } from '@/utils/date'

interface CalendarDay {
  date: string
  dayOfMonth: string
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

type CalendarTab = 'type' | 'team' | 'user'
const tabs: Array<{ key: CalendarTab, title: string }> = [ // 视图切换
  { key: 'type', title: '按分类' },
  { key: 'team', title: '按班组' },
  { key: 'user', title: '按个人' },
]

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const activeTab = ref<CalendarTab>('type') // 当前视图
const currentMonth = ref(dayjs().startOf('month')) // 当前查看月份
const calendarDayMap = ref<Record<string, CalCalendarDay>>({}) // 日期维度排班
const holidayMap = ref<Record<string, CalHoliday>>({}) // 日期维度假期
const loading = ref(false) // 排班加载状态
const teamList = ref<CalTeam[]>([]) // 班组列表
const selectedCalendarType = ref<number>() // 当前班组类型
const selectedTeamId = ref<number>() // 当前班组
const selectedUserId = ref<number>() // 当前人员
const teamPickerVisible = ref(false) // 班组选择显示状态
const teamPickerValue = ref<number[]>([]) // 班组选择器值

const weekLabels = ['一', '二', '三', '四', '五', '六', '日'] // 周标题
const currentMonthText = computed(() => currentMonth.value.format('YYYY年MM月'))
const calendarTypeOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE))
const teamOptions = computed(() =>
  teamList.value
    .filter(item => item.id != null)
    .map(item => ({
      label: item.name,
      value: Number(item.id),
    })),
)
const selectedTeamName = computed(() => teamList.value.find(item => item.id === selectedTeamId.value)?.name || '')
const calendarDays = computed<CalendarDay[]>(() => {
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

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 判断是否节假日 */
function isHoliday(day: string) {
  return holidayMap.value[day]?.type === MesCalHolidayTypeEnum.HOLIDAY
}

/** 获取当天排班 */
function getTeamShifts(day: string) {
  return calendarDayMap.value[day]?.teamShifts || []
}

/** 获取当天主班次 */
function getPrimaryShift(day: string) {
  return getTeamShifts(day)[0]
}

/** 获取当天班次摘要 */
function getShiftSummary(day: string) {
  const shifts = getTeamShifts(day)
  const first = shifts[0]
  if (!first) {
    return ''
  }
  const label = `${first.shiftName || '-'} · ${first.teamName || '-'}`
  return shifts.length > 1 ? `${label} +${shifts.length - 1}` : label
}

/** 班次配色 */
function getShiftClass(day: string, sort: number) {
  const shiftType = calendarDayMap.value[day]?.shiftType
  if (sort === 1) {
    return 'bg-[#95d475]'
  }
  if (sort === 2 && shiftType === MesCalShiftTypeEnum.THREE) {
    return 'bg-[#f0a020]'
  }
  return 'bg-[#909399]'
}

/** 当前月范围 */
function getMonthRange() {
  return {
    startDay: formatDateStartTime(currentMonth.value.startOf('month')),
    endDay: formatDateEndTime(currentMonth.value.endOf('month')),
  }
}

/** 加载假期 */
async function loadHolidays() {
  const { startDay, endDay } = getMonthRange()
  const list = await getHolidayList({ startDay, endDay })
  holidayMap.value = list.reduce<Record<string, CalHoliday>>((map, item) => {
    const day = formatDateOnly(item.day)
    if (day) {
      map[day] = item
    }
    return map
  }, {})
}

/** 查询排班日历 */
async function fetchCalendar() {
  const params = buildCalendarParams()
  if (!params) {
    calendarDayMap.value = {}
    return
  }
  loading.value = true
  try {
    const list = await getCalendarList(params)
    calendarDayMap.value = list.reduce<Record<string, CalCalendarDay>>((map, item) => {
      const day = formatDateOnly(item.day)
      if (day) {
        map[day] = {
          ...item,
          day,
          teamShifts: sortTeamShifts(item.teamShifts || []),
        }
      }
      return map
    }, {})
  } finally {
    loading.value = false
  }
}

/** 构造排班查询参数 */
function buildCalendarParams(): Record<string, any> | undefined {
  const { startDay, endDay } = getMonthRange()
  if (activeTab.value === 'type') {
    if (!selectedCalendarType.value) {
      return undefined
    }
    return { queryType: 'TYPE', calendarType: selectedCalendarType.value, startDay, endDay }
  }
  if (activeTab.value === 'team') {
    if (!selectedTeamId.value) {
      return undefined
    }
    return { queryType: 'TEAM', teamId: selectedTeamId.value, startDay, endDay }
  }
  if (!selectedUserId.value) {
    return undefined
  }
  return { queryType: 'USER', userId: selectedUserId.value, startDay, endDay }
}

/** 班次按顺序排列 */
function sortTeamShifts(list: CalCalendarTeamShiftItem[]) {
  return [...list].sort((a, b) => a.sort - b.sort)
}

/** 切换月份 */
async function changeMonth(step: number) {
  currentMonth.value = currentMonth.value.add(step, 'month').startOf('month')
  await refreshCalendar()
}

/** 切换视图 */
async function handleTabChange(key: 'type' | 'team' | 'user') {
  activeTab.value = key
  teamPickerVisible.value = false
  await ensureDefaultSelection()
  await refreshCalendar()
}

/** 选择班组类型 */
async function selectCalendarType(value: number) {
  selectedCalendarType.value = value
  await refreshCalendar()
}

/** 选择班组 */
async function handleTeamConfirm({ value }: { value: number[] }) {
  const id = Number(value?.[0])
  selectedTeamId.value = Number.isFinite(id) ? id : undefined
  teamPickerValue.value = selectedTeamId.value ? [selectedTeamId.value] : []
  teamPickerVisible.value = false
  await refreshCalendar()
}

/** 选择人员 */
async function handleUserConfirm() {
  await refreshCalendar()
}

/** 刷新假期和排班 */
async function refreshCalendar() {
  await loadHolidays()
  await fetchCalendar()
}

/** 补齐默认筛选 */
async function ensureDefaultSelection() {
  if (activeTab.value === 'type' && !selectedCalendarType.value) {
    selectedCalendarType.value = calendarTypeOptions.value[0]?.value
  }
  if (activeTab.value === 'team') {
    teamList.value = await getTeamList()
    if (!selectedTeamId.value && teamOptions.value.length > 0) {
      selectedTeamId.value = teamOptions.value[0].value
      teamPickerValue.value = [selectedTeamId.value]
    }
  }
  if (activeTab.value === 'user' && !selectedUserId.value) {
    toast.warning('请选择人员后查看排班日历')
  }
}

/** 初始化 */
onMounted(async () => {
  await ensureDefaultSelection()
  await refreshCalendar()
})
</script>
