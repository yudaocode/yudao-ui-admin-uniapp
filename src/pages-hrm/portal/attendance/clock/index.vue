<template>
  <view class="yd-page-container flex flex-col">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="activeTab === 'clock' ? '打卡' : '统计'"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <!-- 打卡 Tab -->
      <scroll-view
        v-show="activeTab === 'clock'"
        class="min-h-0 flex-1"
        scroll-y
      >
        <view class="pb-160rpx">
          <!-- 个人信息 -->
          <view v-if="employee" class="mx-24rpx mt-24rpx flex items-center gap-20rpx rounded-16rpx bg-white p-24rpx shadow-sm">
            <view class="h-88rpx w-88rpx shrink-0 overflow-hidden rounded-full bg-[#f0f2f5]">
              <wd-img
                v-if="employee.avatar"
                :src="employee.avatar"
                width="88rpx"
                height="88rpx"
                radius="50%"
                mode="aspectFill"
              />
              <view
                v-else
                class="h-full w-full flex items-center justify-center text-32rpx text-[#1677ff] font-semibold"
              >
                {{ (employee.name || '?').slice(0, 1) }}
              </view>
            </view>
            <view class="min-w-0 flex-1">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ employee.name || '-' }}
              </view>
              <view class="mt-8rpx truncate text-24rpx text-[#999]">
                {{ employee.deptName || '未设置部门' }} · {{ employee.postName || '未设置岗位' }}
              </view>
            </view>
          </view>

          <!-- 考勤组与班次 -->
          <view class="mx-24rpx mt-20rpx rounded-16rpx bg-white px-24rpx py-20rpx shadow-sm">
            <view class="flex items-center justify-between gap-16rpx">
              <text class="text-26rpx text-[#999]">
                考勤组
              </text>
              <text class="min-w-0 flex-1 truncate text-right text-28rpx text-[#333]">
                {{ detail?.groupName || '-' }}
              </text>
            </view>
            <view class="flex items-center justify-between gap-16rpx">
              <text class="mt-16rpx text-26rpx text-[#999]">
                今日班次
              </text>
              <text class="mt-16rpx min-w-0 flex-1 text-right text-28rpx text-[#333]">
                {{ detail?.shiftTitle || (detail?.restDay ? '休息' : '-') }}
              </text>
            </view>
          </view>

          <!-- WiFi / 定位提示 -->
          <view class="mx-24rpx mt-20rpx rounded-16rpx bg-white px-24rpx py-20rpx shadow-sm">
            <view class="flex items-start gap-12rpx">
              <wd-icon name="wifi" size="32rpx" color="#1677ff" />
              <view class="min-w-0 flex-1">
                <view class="text-28rpx text-[#333]">
                  {{ wifiTipTitle }}
                </view>
                <view class="mt-8rpx text-24rpx text-[#999] leading-36rpx">
                  {{ wifiTipDesc }}
                </view>
              </view>
            </view>
            <view class="mt-16rpx flex items-start gap-12rpx">
              <wd-icon name="location" size="32rpx" color="#1677ff" />
              <view class="min-w-0 flex-1">
                <view class="text-28rpx text-[#333]">
                  {{ locationTipTitle }}
                </view>
                <view class="mt-8rpx text-24rpx text-[#999] leading-36rpx">
                  {{ locationText || '正在获取位置…' }}
                </view>
              </view>
              <wd-button size="small" type="primary" variant="plain" :loading="locating" @click="refreshLocation">
                刷新
              </wd-button>
            </view>
          </view>

          <!-- 大圆打卡按钮 -->
          <view class="mt-48rpx flex flex-col items-center">
            <view
              class="clock-btn h-280rpx w-280rpx flex flex-col items-center justify-center rounded-full text-white"
              :class="clockButtonClass"
              @click="handleClock"
            >
              <text class="text-40rpx font-semibold">
                {{ clockButtonText }}
              </text>
              <text class="mt-12rpx text-48rpx font-semibold tracking-wide">
                {{ currentTimeText }}
              </text>
            </view>
            <view class="mt-24rpx px-48rpx text-center text-24rpx text-[#999] leading-36rpx">
              {{ locationText || '未获取到定位' }}
            </view>
          </view>

          <!-- 当日打卡详情时间线 -->
          <view class="mx-24rpx mt-48rpx rounded-16rpx bg-white p-24rpx shadow-sm">
            <view class="mb-20rpx text-30rpx text-[#333] font-semibold">
              打卡详情
            </view>
            <view v-if="!(detail?.timeline?.length)" class="py-40rpx text-center text-26rpx text-[#999]">
              {{ detail?.restDay ? '今日休息，无需打卡' : '暂无打卡安排' }}
            </view>
            <view
              v-for="(item, index) in detail?.timeline || []"
              :key="`${item.type}-${item.attendanceTime}`"
              class="relative flex gap-20rpx pb-28rpx"
              :class="index === (detail?.timeline?.length || 0) - 1 ? 'pb-0' : ''"
            >
              <view class="flex flex-col items-center">
                <view
                  class="mt-8rpx h-16rpx w-16rpx rounded-full"
                  :class="item.missCard ? 'bg-[#ff4d4f]' : item.clockTime ? 'bg-[#52c41a]' : 'bg-[#d9d9d9]'"
                />
                <view
                  v-if="index < (detail?.timeline?.length || 0) - 1"
                  class="mt-8rpx w-2rpx flex-1 bg-[#f0f0f0]"
                />
              </view>
              <view class="min-w-0 flex-1">
                <view class="flex items-center justify-between gap-16rpx">
                  <text class="text-28rpx text-[#333] font-medium">
                    {{ item.type === HrmAttendanceClockType.OFF_DUTY ? '下班打卡' : '上班打卡' }}
                  </text>
                  <text
                    class="text-26rpx"
                    :class="item.missCard ? 'text-[#ff4d4f]' : 'text-[#333]'"
                  >
                    {{ item.missCard ? '缺卡' : (formatDate(item.clockTime, 'HH:mm:ss') || '--:--') }}
                  </text>
                </view>
                <view class="mt-8rpx text-24rpx text-[#999]">
                  应打 {{ formatDate(item.attendanceTime, 'HH:mm') || '--:--' }}
                  <text v-if="item.status != null && !item.missCard" class="ml-12rpx">
                    · {{ getDictLabel(DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS, item.status) }}
                  </text>
                </view>
                <view v-if="item.address" class="mt-6rpx text-24rpx text-[#999]">
                  {{ item.address }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 统计 Tab -->
      <scroll-view
        v-show="activeTab === 'statistics'"
        class="min-h-0 flex-1"
        scroll-y
      >
        <view class="pb-160rpx">
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
          <view class="mt-20rpx bg-white px-16rpx py-20rpx">
            <view class="grid grid-cols-7 mb-12rpx gap-8rpx">
              <view
                v-for="week in weekLabels"
                :key="week"
                class="py-8rpx text-center text-24rpx text-[#999]"
              >
                {{ week }}
              </view>
            </view>
            <view class="grid grid-cols-7 gap-8rpx">
              <view
                v-for="(day, index) in calendarDays"
                :key="`${day.dateKey}-${index}`"
                class="h-96rpx flex flex-col items-center justify-center rounded-12rpx"
                :class="[
                  day.inMonth ? '' : 'opacity-30',
                  day.dateKey === selectedDateKey ? 'bg-[#e8f3ff]' : '',
                ]"
                @click="handleSelectDay(day)"
              >
                <text
                  class="text-28rpx"
                  :class="day.dateKey === selectedDateKey ? 'text-[#1677ff] font-semibold' : 'text-[#333]'"
                >
                  {{ day.day }}
                </text>
                <view
                  v-if="day.dotColor"
                  class="mt-8rpx h-10rpx w-10rpx rounded-full"
                  :style="{ backgroundColor: day.dotColor }"
                />
              </view>
            </view>
            <view class="mt-16rpx flex items-center justify-center gap-32rpx text-22rpx text-[#999]">
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
            <view v-if="statisticsLoading" class="py-40rpx text-center text-26rpx text-[#999]">
              加载中
            </view>
            <view v-else-if="!selectedDayDetail" class="py-40rpx text-center text-26rpx text-[#999]">
              暂无当日明细
            </view>
            <template v-else>
              <view class="mb-16rpx text-26rpx text-[#666]">
                {{ selectedDayDetail.shiftName || (selectedDayDetail.scheduled === false ? '休息' : '-') }}
                · {{ selectedDayDetail.attendanceResult || '-' }}
              </view>
              <view v-if="!(selectedDayDetail.clockList?.length)" class="py-24rpx text-center text-26rpx text-[#999]">
                暂无打卡记录
              </view>
              <view
                v-for="clock in selectedDayDetail.clockList || []"
                :key="clock.id || `${clock.type}-${clock.clockTime}`"
                class="mb-16rpx flex items-center justify-between gap-16rpx border-b border-b-[#f5f5f5] pb-16rpx last:mb-0 last:border-b-0 last:pb-0"
              >
                <view class="min-w-0 flex-1">
                  <view class="text-28rpx text-[#333]">
                    {{ clock.type === HrmAttendanceClockType.OFF_DUTY ? '下班' : '上班' }}
                    {{ formatDate(clock.clockTime, 'HH:mm:ss') || '--:--' }}
                  </view>
                  <view class="mt-6rpx text-24rpx text-[#999]">
                    {{ clock.address || '无定位信息' }}
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
              {{ String(yearMonth.month).padStart(2, '0') }}月汇总
            </view>
            <view class="grid grid-cols-3 gap-16rpx">
              <view
                v-for="item in monthSummaryItems"
                :key="item.label"
                class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-20rpx text-center"
              >
                <view class="text-22rpx text-[#999]">
                  {{ item.label }}
                </view>
                <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
                  {{ item.value }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 底栏：打卡 | 统计 -->
      <view class="clock-tabbar safe-area-inset-bottom">
        <view
          class="flex flex-1 flex-col items-center justify-center gap-6rpx py-12rpx"
          :class="activeTab === 'clock' ? 'text-[#1677ff]' : 'text-[#666]'"
          @click="activeTab = 'clock'"
        >
          <wd-icon name="location" size="40rpx" :color="activeTab === 'clock' ? '#1677ff' : '#666'" />
          <text class="text-22rpx">
            打卡
          </text>
        </view>
        <view
          class="flex flex-1 flex-col items-center justify-center gap-6rpx py-12rpx"
          :class="activeTab === 'statistics' ? 'text-[#1677ff]' : 'text-[#666]'"
          @click="switchStatisticsTab"
        >
          <wd-icon name="calendar" size="40rpx" :color="activeTab === 'statistics' ? '#1677ff' : '#666'" />
          <text class="text-22rpx">
            统计
          </text>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type {
  PortalAttendanceClockCreateReq,
  PortalAttendanceClockDetail,
} from '@/api/hrm/portal/attendance/clock'
import type { PortalAttendanceMonthDetail } from '@/api/hrm/portal/attendance/statistics'
import type { PortalEmployee } from '@/api/hrm/portal/employee'
import dayjs from 'dayjs'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createMyAttendanceClock,
  getMyAttendanceClockDetail,
} from '@/api/hrm/portal/attendance/clock'
import { getPortalAttendanceMonthDetail } from '@/api/hrm/portal/attendance/statistics'
import { getPortalEmployee } from '@/api/hrm/portal/employee'
import { getDictLabel } from '@/hooks/useDict'
import {
  HrmAttendanceClockButtonStatus,
  HrmAttendanceClockType,
} from '@/pages-hrm/utils/constants'
import { formatHrmDays, getAttendanceYearMonth } from '@/pages-hrm/utils/format'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()

const accessible = ref(false) // 是否可访问
const activeTab = ref<'clock' | 'statistics'>('clock') // 底栏 Tab
const employee = ref<PortalEmployee>() // 个人信息
const detail = ref<PortalAttendanceClockDetail>() // 打卡详情
const clockLoading = ref(false) // 打卡提交中
const locating = ref(false) // 定位中
const locationText = ref('') // 当前位置文案
const currentLatitude = ref<number>() // 当前纬度
const currentLongitude = ref<number>() // 当前经度
const wifiUnavailableTip = ref(true) // H5/多数端无法读取 WiFi
const currentTimeText = ref(dayjs().format('HH:mm:ss')) // 大按钮当前时间
const selectedMonth = ref(Date.now()) // 统计选中月份
const monthVisible = ref(false) // 月份选择器
const maxMonth = dayjs().endOf('month').valueOf() // 禁止未来月
const statisticsLoading = ref(false) // 统计加载中
const monthDetail = ref<PortalAttendanceMonthDetail>() // 月度详情
const selectedDateKey = ref(dayjs().format('YYYY-MM-DD')) // 选中日期
const weekLabels = ['日', '一', '二', '三', '四', '五', '六'] // 月历星期头
let clockTimer: ReturnType<typeof setInterval> | undefined

const yearMonth = computed(() => getAttendanceYearMonth(selectedMonth.value))
const monthText = computed(() => {
  const { year, month } = yearMonth.value
  return `${year}年${String(month).padStart(2, '0')}月`
})
const selectedDateText = computed(() => formatDate(selectedDateKey.value, 'MM月DD日') || selectedDateKey.value)
const selectedDayDetail = computed(() => { // 选中日的考勤明细
  return (monthDetail.value?.dailyDetails || []).find((item) => {
    return formatDate(item.attendanceTime) === selectedDateKey.value
  })
})
// TODO @AI：按照项目的习惯，应该是 html 里直接 format，而不是通过这样的方式；
const monthSummaryItems = computed(() => {
  const summary = monthDetail.value?.summary
  return [
    { label: '应出勤(天)', value: summary?.attendDays ?? 0 },
    { label: '实出勤(天)', value: formatHrmDays(summary?.actualDays) },
    { label: '迟到(次)', value: summary?.lateCount ?? 0 },
    { label: '早退(次)', value: summary?.earlyCount ?? 0 },
    { label: '缺卡(次)', value: summary?.misscardCount ?? 0 },
    { label: '请假(天)', value: formatHrmDays(summary?.leaveDays) },
  ]
})
// TODO @AI：按照项目的习惯，应该是 html 里直接 format，而不是通过这样的方式；
const wifiTipTitle = computed(() => {
  if (!detail.value?.openWifiCard) {
    return '未启用 WiFi 打卡'
  }
  const ssid = detail.value.wifis?.[0]?.ssid
  return ssid ? `考勤 WiFi：${ssid}` : '已启用 WiFi 打卡'
})
// TODO @AI：按照项目的习惯，应该是 html 里直接 format，而不是通过这样的方式；
const wifiTipDesc = computed(() => {
  if (!detail.value?.openWifiCard) {
    return '当前考勤组未要求连接指定 WiFi'
  }
  if (wifiUnavailableTip.value) {
    return '当前端无法读取 WiFi 信息，请在支持的 App 端打卡，或改用定位打卡'
  }
  return '请连接考勤组配置的 WiFi 后再打卡'
})
// TODO @AI：按照项目的习惯，应该是 html 里直接 format，而不是通过这样的方式；
const locationTipTitle = computed(() => {
  if (!detail.value?.openPointCard) {
    return '未启用定位打卡'
  }
  const name = detail.value.points?.[0]?.name
  return name ? `考勤地点：${name}` : '已启用定位打卡'
})
const clockButtonText = computed(() => {
  if (!detail.value?.nextClock) {
    return '打卡'
  }
  if (detail.value.restDay) {
    return '今日休息'
  }
  const { buttonStatus, type } = detail.value.nextClock
  if (buttonStatus === HrmAttendanceClockButtonStatus.UPDATE) {
    return '更新打卡'
  }
  if (buttonStatus === HrmAttendanceClockButtonStatus.LATE) {
    return '迟到打卡'
  }
  if (buttonStatus === HrmAttendanceClockButtonStatus.EARLY) {
    return '早退打卡'
  }
  if (buttonStatus === HrmAttendanceClockButtonStatus.NORMAL) {
    return type === HrmAttendanceClockType.OFF_DUTY ? '下班打卡' : '上班打卡'
  }
  return '未到打卡时间'
})
const clockButtonEnabled = computed(() => !detail.value?.restDay
  && detail.value?.nextClock?.buttonStatus != null
  && detail.value.nextClock.buttonStatus !== HrmAttendanceClockButtonStatus.NOT_YET)
const clockButtonClass = computed(() => {
  if (!clockButtonEnabled.value) {
    return 'is-disabled'
  }
  const status = detail.value?.nextClock?.buttonStatus
  if (status === HrmAttendanceClockButtonStatus.LATE
    || status === HrmAttendanceClockButtonStatus.EARLY) {
    return 'is-warn'
  }
  return 'is-primary'
})
// TODO @AI：这种有必要抽方法么？全局有其他地方也有类似的逻辑么？？？
const calendarDays = computed(() => { // 月历单元格（含上月末/下月初占位）
  const month = dayjs(selectedMonth.value)
  const start = month.startOf('month')
  const end = month.endOf('month')
  const startWeek = start.day()
  const days: Array<{
    day: number
    dateKey: string
    inMonth: boolean
    dotColor?: string
  }> = []
  for (let i = 0; i < startWeek; i++) {
    const date = start.subtract(startWeek - i, 'day')
    days.push({ day: date.date(), dateKey: date.format('YYYY-MM-DD'), inMonth: false })
  }
  for (let cursor = start; cursor.isBefore(end) || cursor.isSame(end, 'day'); cursor = cursor.add(1, 'day')) {
    const dateKey = cursor.format('YYYY-MM-DD')
    days.push({
      day: cursor.date(),
      dateKey,
      inMonth: true,
      dotColor: getDayDotColor(dateKey),
    })
  }
  const remain = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remain; i++) {
    const date = end.add(i, 'day')
    days.push({ day: date.date(), dateKey: date.format('YYYY-MM-DD'), inMonth: false })
  }
  return days
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 刷新当前时间文案 */
function tickClock() {
  // TODO @AI：使用 format 可以么？全局有合适的方法么？
  currentTimeText.value = dayjs().format('HH:mm:ss')
}

/** 加载打卡详情 */
async function loadDetail() {
  detail.value = await getMyAttendanceClockDetail()
}

/** 加载个人信息 */
async function loadEmployee() {
  employee.value = await getPortalEmployee()
}

/** 刷新定位（H5 尽力获取，失败给明确提示） */
async function refreshLocation() {
  locating.value = true
  try {
    const result = await new Promise<UniApp.GetLocationSuccess>((resolve, reject) => {
      uni.getLocation({
        type: 'gcj02',
        isHighAccuracy: true,
        success: resolve,
        fail: reject,
      })
    })
    currentLatitude.value = result.latitude
    currentLongitude.value = result.longitude
    // H5 通常只有经纬度；App 端若带地址则优先展示
    locationText.value = (result as UniApp.GetLocationSuccess & { address?: string }).address
      || `${result.latitude.toFixed(5)}, ${result.longitude.toFixed(5)}`
  } catch {
    currentLatitude.value = undefined
    currentLongitude.value = undefined
    locationText.value = '定位失败，请检查定位权限后重试'
  } finally {
    locating.value = false
  }
}

/** 执行打卡 */
// TODO @AI：按照现在代码规范，代码块内，有没需要写的注释？
async function handleClock() {
  if (clockLoading.value) {
    return
  }
  if (detail.value?.restDay) {
    toast.info('今日休息，无需打卡')
    return
  }
  if (!clockButtonEnabled.value) {
    toast.info(clockButtonText.value)
    return
  }
  if (detail.value.openPointCard && (currentLatitude.value == null || currentLongitude.value == null)) {
    toast.warning('请先获取定位后再打卡')
    await refreshLocation()
    return
  }
  if (detail.value.openWifiCard && !detail.value.openPointCard) {
    toast.warning('当前端无法读取 WiFi，请在支持的 App 端打卡，或联系管理员开启定位打卡')
    return
  }

  clockLoading.value = true
  try {
    const payload: PortalAttendanceClockCreateReq = {
      address: locationText.value || undefined,
      latitude: currentLatitude.value,
      longitude: currentLongitude.value,
    }
    await createMyAttendanceClock(payload)
    toast.success('打卡成功')
    await loadDetail()
  } finally {
    clockLoading.value = false
  }
}

/** 切换到统计 Tab 并按需加载 */
async function switchStatisticsTab() {
  activeTab.value = 'statistics'
  if (!monthDetail.value) {
    await loadStatistics()
  }
}

/** 月份变更 */
async function handleMonthChange() {
  // TODO @AI：全局有合适的 format 方法哇？
  selectedDateKey.value = dayjs(selectedMonth.value).startOf('month').format('YYYY-MM-DD')
  await loadStatistics()
}

/** 选择月历日期 */
function handleSelectDay(day: { dateKey: string, inMonth: boolean }) {
  if (!day.inMonth) {
    return
  }
  selectedDateKey.value = day.dateKey
}

/** 加载月度统计 */
async function loadStatistics() {
  statisticsLoading.value = true
  try {
    const { year, month } = yearMonth.value
    monthDetail.value = await getPortalAttendanceMonthDetail({ year, month })
    // 默认选中当天；跨月时选月初
    // TODO @AI：全局有合适的 format 方法哇？
    const todayKey = dayjs().format('YYYY-MM-DD')
    const hasToday = (monthDetail.value.dailyDetails || []).some(
      item => formatDate(item.attendanceTime) === todayKey,
    )
    if (hasToday && dayjs(todayKey).month() + 1 === month && dayjs(todayKey).year() === year) {
      selectedDateKey.value = todayKey
    } else if (!selectedDayDetail.value) {
      // TODO @AI：全局有合适的 format 方法哇？
      selectedDateKey.value = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('YYYY-MM-DD')
    }
  } finally {
    statisticsLoading.value = false
  }
}

/** 月历圆点颜色：绿正常 / 红异常 / 灰休息 */
// TODO @AI：这个全局有类似的方法，可以复用么？
function getDayDotColor(dateKey: string) {
  const dayDetail = (monthDetail.value?.dailyDetails || []).find(
    item => formatDate(item.attendanceTime) === dateKey,
  )
  if (!dayDetail) {
    return undefined
  }
  if (dayDetail.scheduled === false) {
    return '#d9d9d9'
  }
  const abnormal = (dayDetail.lateCount || 0) > 0
    || (dayDetail.earlyCount || 0) > 0
    || (dayDetail.misscardCount || 0) > 0
    || dayDetail.absenteeism === true
  if (abnormal) {
    return '#ff4d4f'
  }
  if ((dayDetail.clockList?.length || 0) > 0) {
    return '#52c41a'
  }
  return undefined
}

/** 初始化 */
onMounted(async () => {
  accessible.value = await checkHrmPortalAccess()
  if (!accessible.value) {
    return
  }
  tickClock()
  clockTimer = setInterval(tickClock, 1000)
  await Promise.all([loadEmployee(), loadDetail(), refreshLocation()])
})

onUnmounted(() => {
  if (clockTimer) {
    clearInterval(clockTimer)
  }
})
// TODO @AI：unocss？另外 tarbar 是不是可以用 wot 组件噢？
</script>

<style lang="scss" scoped>
.clock-btn {
  box-shadow: 0 12rpx 40rpx rgba(22, 119, 255, 0.35);

  &.is-primary {
    background: linear-gradient(180deg, #3b8bff 0%, #1677ff 100%);
  }

  &.is-warn {
    background: linear-gradient(180deg, #ff9f40 0%, #fa8c16 100%);
    box-shadow: 0 12rpx 40rpx rgba(250, 140, 22, 0.35);
  }

  &.is-disabled {
    background: linear-gradient(180deg, #c0c4cc 0%, #909399 100%);
    box-shadow: none;
  }
}

.clock-tabbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
}
</style>
