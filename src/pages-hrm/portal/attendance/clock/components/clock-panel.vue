<template>
  <scroll-view class="min-h-0 flex-1" scroll-y>
    <view class="pb-40rpx">
      <!-- 个人信息 -->
      <view
        v-if="employee"
        class="mx-24rpx mt-24rpx flex items-center gap-20rpx rounded-16rpx bg-white p-24rpx shadow-sm"
      >
        <view
          class="h-88rpx w-88rpx shrink-0 overflow-hidden rounded-full bg-[#f0f2f5]"
        >
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
            {{ (employee.name || "?").slice(0, 1) }}
          </view>
        </view>
        <view class="min-w-0 flex-1">
          <view class="truncate text-30rpx text-[#333] font-semibold">
            {{ employee.name || "-" }}
          </view>
          <view class="mt-8rpx truncate text-24rpx text-[#999]">
            {{ employee.deptName || "未设置部门" }} ·
            {{ employee.postName || "未设置岗位" }}
          </view>
        </view>
      </view>

      <!-- 考勤组与班次 -->
      <view
        class="mx-24rpx mt-20rpx rounded-16rpx bg-white px-24rpx py-20rpx shadow-sm"
      >
        <view class="flex items-center justify-between gap-16rpx">
          <text class="text-26rpx text-[#999]"> 考勤组 </text>
          <text
            class="min-w-0 flex-1 truncate text-right text-28rpx text-[#333]"
          >
            {{ clockDetail?.groupName || "-" }}
          </text>
        </view>
        <view class="flex items-center justify-between gap-16rpx">
          <text class="mt-16rpx text-26rpx text-[#999]"> 今日班次 </text>
          <text
            class="mt-16rpx min-w-0 flex-1 text-right text-28rpx text-[#333]"
          >
            {{
              clockDetail?.shiftTitle || (clockDetail?.restDay ? "休息" : "-")
            }}
          </text>
        </view>
      </view>

      <!-- WiFi / 定位要求 -->
      <view
        class="mx-24rpx mt-20rpx rounded-16rpx bg-white px-24rpx py-20rpx shadow-sm"
      >
        <view class="flex items-start gap-12rpx">
          <wd-icon name="wifi" size="32rpx" color="#1677ff" />
          <view class="min-w-0 flex-1">
            <template v-if="clockDetail?.openWifiCard">
              <view class="text-28rpx text-[#333]">
                {{ attendanceWifiText }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999] leading-36rpx">
                <template v-if="wifiLoading">
                  正在读取当前 WiFi…
                </template>
                <template v-else-if="wifiState === 'ready' && wifiMatched">
                  {{ wifiText }}，已符合考勤要求
                </template>
                <template v-else-if="wifiState === 'ready'">
                  {{ wifiText }}，请切换至考勤 WiFi
                </template>
                <template v-else>
                  {{ wifiText }}
                </template>
              </view>
            </template>
            <template v-else>
              <view class="text-28rpx text-[#333]">
                未启用 WiFi 打卡
              </view>
              <view class="mt-8rpx text-24rpx text-[#999] leading-36rpx">
                当前考勤组未要求连接指定 WiFi
              </view>
            </template>
          </view>
          <wd-button
            v-if="clockDetail?.openWifiCard"
            size="small"
            type="primary"
            variant="plain"
            :loading="wifiLoading"
            @click="refreshWifi"
          >
            刷新
          </wd-button>
        </view>
        <view class="mt-16rpx flex items-start gap-12rpx">
          <wd-icon name="location" size="32rpx" color="#1677ff" />
          <view class="min-w-0 flex-1">
            <template v-if="clockDetail?.openPointCard">
              <view class="text-28rpx text-[#333]">
                {{
                  clockDetail.points?.[0]?.name
                    ? `考勤地点：${clockDetail.points[0].name}`
                    : "已启用定位打卡"
                }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999] leading-36rpx">
                {{ attendanceLocationText }}
              </view>
            </template>
            <template v-else>
              <view class="text-28rpx text-[#333]">
                未启用定位打卡
              </view>
              <view class="mt-8rpx text-24rpx text-[#999] leading-36rpx">
                当前考勤组未要求获取位置
              </view>
            </template>
          </view>
          <wd-button
            v-if="clockDetail?.openPointCard"
            size="small"
            type="primary"
            variant="plain"
            :loading="locating"
            @click="refreshLocation"
          >
            刷新
          </wd-button>
        </view>
      </view>

      <!-- 打卡按钮 -->
      <view class="mt-48rpx flex flex-col items-center">
        <view
          class="clock-btn h-280rpx w-280rpx flex flex-col items-center justify-center rounded-full text-white"
          :class="[clockButtonClass, clockLoading ? 'opacity-75' : '']"
          @click="handleClock"
        >
          <text class="text-40rpx font-semibold">
            {{ clockButtonText }}
          </text>
          <text class="mt-12rpx text-48rpx font-semibold tracking-wide">
            {{ currentTimeText }}
          </text>
        </view>
        <view
          class="mt-24rpx px-48rpx text-center text-24rpx text-[#999] leading-36rpx"
        >
          <template v-if="clockDetail?.openPointCard">
            {{ attendanceLocationText }}
          </template>
          <template v-else-if="clockDetail?.openWifiCard">
            {{ wifiText }}
          </template>
          <template v-else>
            当前考勤组无需定位或 WiFi
          </template>
        </view>
      </view>

      <!-- 当日打卡详情 -->
      <view class="mx-24rpx mt-48rpx rounded-16rpx bg-white p-24rpx shadow-sm">
        <view class="mb-20rpx text-30rpx text-[#333] font-semibold">
          打卡详情
        </view>
        <view
          v-if="!clockDetail?.timeline?.length"
          class="py-40rpx text-center text-26rpx text-[#999]"
        >
          {{ clockDetail?.restDay ? "今日休息，无需打卡" : "暂无打卡安排" }}
        </view>
        <view
          v-for="(item, index) in clockDetail?.timeline || []"
          :key="`${item.type}-${item.attendanceTime}`"
          class="relative flex gap-20rpx pb-28rpx"
          :class="
            index === (clockDetail?.timeline?.length || 0) - 1 ? 'pb-0' : ''
          "
        >
          <view class="flex flex-col items-center">
            <view
              class="mt-8rpx h-16rpx w-16rpx rounded-full"
              :class="
                item.missCard
                  ? 'bg-[#ff4d4f]'
                  : item.clockTime
                    ? 'bg-[#52c41a]'
                    : 'bg-[#d9d9d9]'
              "
            />
            <view
              v-if="index < (clockDetail?.timeline?.length || 0) - 1"
              class="mt-8rpx w-2rpx flex-1 bg-[#f0f0f0]"
            />
          </view>
          <view class="min-w-0 flex-1">
            <view class="flex items-center justify-between gap-16rpx">
              <text class="text-28rpx text-[#333] font-medium">
                {{
                  item.type === HrmAttendanceClockType.OFF_DUTY
                    ? "下班打卡"
                    : "上班打卡"
                }}
              </text>
              <text
                class="text-26rpx"
                :class="item.missCard ? 'text-[#ff4d4f]' : 'text-[#333]'"
              >
                {{
                  item.missCard
                    ? "缺卡"
                    : formatDate(item.clockTime, "HH:mm:ss") || "--:--"
                }}
              </text>
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              应打 {{ formatDate(item.attendanceTime, "HH:mm") || "--:--" }}
              <text
                v-if="item.status != null && !item.missCard"
                class="ml-12rpx"
              >
                ·
                {{
                  getDictLabel(
                    DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS,
                    item.status,
                  )
                }}
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
</template>

<script lang="ts" setup>
import type {
  PortalAttendanceClockCreateReq,
  PortalAttendanceClockDetail,
} from '@/api/hrm/portal/attendance/clock'
import type { PortalEmployee } from '@/api/hrm/portal/employee'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createMyAttendanceClock } from '@/api/hrm/portal/attendance/clock'
import { getDictLabel } from '@/hooks/useDict'
import { useAttendanceClockDevice } from '@/pages-hrm/utils/attendance'
import {
  HrmAttendanceClockButtonStatus,
  HrmAttendanceClockType,
} from '@/pages-hrm/utils/constants'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  active: boolean
  employee?: PortalEmployee
  detail?: PortalAttendanceClockDetail
}>()

const emit = defineEmits<{
  clocked: []
  dayChange: []
}>()

const toast = useToast()
const clockLoading = ref(false) // 打卡提交状态
const currentTimeText = ref(formatDate(Date.now(), 'HH:mm:ss')) // 当前时间
let currentDateKey = formatDate(Date.now()) // 当前自然日
let clockTimer: ReturnType<typeof setInterval> | undefined

const {
  locationState,
  location,
  locationText,
  locating,
  wifiState,
  wifi,
  wifiText,
  wifiLoading,
  resetLocation,
  resetWifi,
  refreshLocation,
  refreshWifi,
  stopWifi,
} = useAttendanceClockDevice()

const attendanceWifiText = computed(() => {
  // 考勤 WiFi 文案
  const names = (props.detail?.wifis || [])
    .map(item => item.ssid)
    .filter(Boolean)
  return names.length ? `考勤 WiFi：${names.join('、')}` : '已启用 WiFi 打卡'
})
const clockDetail = computed(() => props.detail) // 打卡详情
const matchedWifi = computed(() => {
  // 当前 WiFi 命中的考勤配置
  if (!wifi.value) {
    return undefined
  }
  const currentMac = normalizeWifiMac(wifi.value.mac)
  const currentSsid = normalizeWifiSsid(wifi.value.ssid)
  return (props.detail?.wifis || []).find((item) => {
    const macMatched = Boolean(
      item.mac && currentMac && normalizeWifiMac(item.mac) === currentMac,
    )
    const ssidMatched = Boolean(
      item.ssid && currentSsid && normalizeWifiSsid(item.ssid) === currentSsid,
    )
    return macMatched || ssidMatched
  })
})
const wifiMatched = computed(() => Boolean(matchedWifi.value)) // 当前 WiFi 是否符合考勤要求
const pointMatched = computed(() => {
  // 当前定位是否在任一考勤范围内
  const currentLocation = location.value
  if (!currentLocation) {
    return false
  }
  return (props.detail?.points || []).some(point =>
    isAttendancePointMatched(
      currentLocation.latitude,
      currentLocation.longitude,
      point.latitude,
      point.longitude,
      point.radius,
    ),
  )
})
const attendanceLocationText = computed(() => {
  // 考勤定位文案
  if (locationState.value !== 'ready') {
    return locationText.value
  }
  return pointMatched.value
    ? `${locationText.value}，已进入考勤范围`
    : `${locationText.value}，当前不在考勤范围`
})
const clockButtonText = computed(() => {
  if (!props.detail?.nextClock) {
    return '打卡'
  }
  if (props.detail.restDay) {
    return '今日休息'
  }
  const { buttonStatus, type } = props.detail.nextClock
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
const clockButtonEnabled = computed(
  () =>
    !props.detail?.restDay
    && props.detail?.nextClock?.buttonStatus != null
    && props.detail.nextClock.buttonStatus
    !== HrmAttendanceClockButtonStatus.NOT_YET,
)
const clockButtonClass = computed(() => {
  if (!clockButtonEnabled.value) {
    return 'is-disabled'
  }
  const status = props.detail?.nextClock?.buttonStatus
  if (
    status === HrmAttendanceClockButtonStatus.LATE
    || status === HrmAttendanceClockButtonStatus.EARLY
  ) {
    return 'is-warn'
  }
  return 'is-primary'
})

/** 刷新当前时间 */
function tickClock() {
  currentTimeText.value = formatDate(Date.now(), 'HH:mm:ss')
  const dateKey = formatDate(Date.now())
  if (dateKey && dateKey !== currentDateKey) {
    currentDateKey = dateKey
    emit('dayChange')
  }
}

/** 启动页面时钟 */
function startClock() {
  tickClock()
  if (!clockTimer) {
    clockTimer = setInterval(tickClock, 1000)
  }
}

/** 停止页面时钟 */
function stopClock() {
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = undefined
  }
}

/** 刷新考勤组要求的设备信息 */
async function refreshRequiredDevices() {
  const tasks: Promise<boolean>[] = []
  if (props.detail?.openPointCard) {
    tasks.push(refreshLocation())
  } else {
    resetLocation()
  }
  if (props.detail?.openWifiCard) {
    tasks.push(refreshWifi())
  } else {
    resetWifi()
    stopWifi()
  }
  await Promise.all(tasks)
}

/** 确保具备打卡所需设备信息 */
async function ensureDeviceReady(): Promise<boolean> {
  const pointRequired = Boolean(props.detail?.openPointCard)
  const wifiRequired = Boolean(props.detail?.openWifiCard)
  if (!pointRequired && !wifiRequired) {
    return true
  }

  // 刷新缺失的打卡凭据
  const tasks: Promise<boolean>[] = []
  if (pointRequired && locationState.value !== 'ready') {
    tasks.push(refreshLocation())
  }
  if (wifiRequired && !wifiMatched.value) {
    tasks.push(refreshWifi())
  }
  await Promise.all(tasks)

  const pointReady
    = pointRequired && locationState.value === 'ready' && pointMatched.value
  const wifiReady = wifiRequired && wifiMatched.value
  if (pointRequired && wifiRequired) {
    if (pointReady || wifiReady) {
      return true
    }
    toast.warning('请获取考勤地点定位或连接考勤 WiFi 后再打卡')
    return false
  }
  if (pointRequired && !pointReady) {
    toast.warning('请获取考勤地点定位后再打卡')
    return false
  }
  if (wifiRequired && !wifiReady) {
    toast.warning(
      wifiState.value === 'unsupported'
        ? '当前端不支持读取 WiFi，请使用支持的 App 或微信小程序打卡'
        : '请连接考勤组配置的 WiFi 后再打卡',
    )
    return false
  }
  return true
}

/** 执行打卡 */
async function handleClock() {
  if (clockLoading.value) {
    return
  }
  if (props.detail?.restDay) {
    toast.info('今日休息，无需打卡')
    return
  }
  if (!clockButtonEnabled.value) {
    toast.info(clockButtonText.value)
    return
  }
  if (!(await ensureDeviceReady())) {
    return
  }

  clockLoading.value = true
  try {
    const payload: PortalAttendanceClockCreateReq = {
      address: location.value?.address,
      latitude: location.value?.latitude,
      longitude: location.value?.longitude,
      ssid: matchedWifi.value?.ssid || wifi.value?.ssid,
      mac: matchedWifi.value?.mac || wifi.value?.mac,
    }
    await createMyAttendanceClock(payload)
    toast.success('打卡成功')
    emit('clocked')
  } finally {
    clockLoading.value = false
  }
}

/** 同步组件显示状态与设备信息 */
watch(
  [() => props.active, () => props.detail],
  ([active, detail]) => {
    if (!active) {
      stopClock()
      stopWifi()
      return
    }
    startClock()
    if (detail) {
      refreshRequiredDevices()
    }
  },
  { immediate: true },
)

/** 释放设备与时钟 */
onUnmounted(() => {
  stopClock()
  stopWifi()
})

/** 标准化 WiFi MAC 地址 */
function normalizeWifiMac(mac?: string) {
  return mac?.replace(/[:-]/g, '').toLowerCase()
}

/** 标准化 WiFi 名称 */
function normalizeWifiSsid(ssid?: string) {
  return ssid?.replace(/^"(.*)"$/, '$1')
}

/** 判断当前位置是否在考勤范围内 */
function isAttendancePointMatched(
  latitude: number,
  longitude: number,
  pointLatitude?: number,
  pointLongitude?: number,
  radius?: number,
) {
  if (pointLatitude == null || pointLongitude == null || radius == null) {
    return false
  }
  const earthRadius = 6371000
  const latitudeDelta = toRadians(pointLatitude - latitude)
  const longitudeDelta = toRadians(pointLongitude - longitude)
  const haversine
    = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(toRadians(latitude))
      * Math.cos(toRadians(pointLatitude))
      * Math.sin(longitudeDelta / 2) ** 2
  return (
    earthRadius
    * 2
    * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
    <= radius
  )
}

/** 角度转弧度 */
function toRadians(value: number) {
  return (value * Math.PI) / 180
}
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
</style>
