<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="`${roomName} - 预约信息`"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 最近五天 -->
        <view class="mb-24rpx flex gap-12rpx">
          <view
            v-for="date in dates"
            :key="date"
            class="flex-1 rounded-8rpx py-12rpx text-center"
            :class="selectedDate === date ? 'bg-[#3b82f6] text-white' : 'bg-white text-[#333]'"
            @click="selectedDate = date"
          >
            <view class="text-26rpx">
              {{ dayjs(date).format('MM-DD') }}
            </view>
            <view class="mt-4rpx text-20rpx" :class="selectedDate === date ? 'text-white' : 'text-[#999]'">
              {{ weekDayNames[dayjs(date).day()] }}
            </view>
          </view>
        </view>

        <!-- 状态说明 -->
        <view class="mb-16rpx flex items-center gap-24rpx text-22rpx text-[#666]">
          <view class="flex items-center gap-8rpx">
            <view class="h-20rpx w-20rpx border border-[#ddd] border-solid bg-white" />
            可预约
          </view>
          <view class="flex items-center gap-8rpx">
            <view class="h-20rpx w-20rpx bg-[#22c55e]" />
            已预约
          </view>
          <view class="flex items-center gap-8rpx">
            <view class="h-20rpx w-20rpx bg-[#e5e5e5]" />
            已过期
          </view>
        </view>

        <!-- 半小时占用格 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-16rpx">
          <view
            v-for="period in [0, 1]"
            :key="period"
            :class="period === 1 ? 'mt-16rpx border-t border-[#f0f0f0] border-t-solid pt-16rpx' : ''"
          >
            <view class="mb-8rpx text-24rpx text-[#666] font-semibold">
              {{ period === 0 ? '上午' : '下午' }}
            </view>
            <view class="grid grid-cols-12 mb-4rpx text-center text-18rpx text-[#999]">
              <text v-for="hour in 12" :key="hour">
                {{ String(period * 12 + hour - 1).padStart(2, '0') }}
              </text>
            </view>
            <view class="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-2rpx">
              <view
                v-for="slot in slots.slice(period * 24, (period + 1) * 24)"
                :key="slot.startTime"
                class="h-32rpx border border-[#eee] rounded-4rpx border-solid"
                :class="slot.expired ? 'bg-[#e5e5e5]' : slot.booking ? 'bg-[#22c55e]' : 'bg-white'"
                @click="handleSlotClick(slot)"
              />
            </view>
          </view>
        </view>

        <!-- 当日预定信息 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx">
          <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
            {{ dayjs(selectedDate).format('MM 月 DD 日') }}已预约
          </view>
          <view v-if="!dayBookings.length" class="py-24rpx text-center text-24rpx text-[#999]">
            暂无预约记录
          </view>
          <view
            v-for="booking in dayBookings"
            :key="booking.id"
            class="mb-16rpx border border-[#f0f0f0] rounded-8rpx border-solid p-16rpx"
          >
            <view class="mb-8rpx flex items-start justify-between gap-12rpx">
              <text class="line-clamp-2 min-w-0 flex-1 text-26rpx text-[#1677ff] font-medium">{{ booking.title }}</text>
              <dict-tag
                v-if="booking.status !== undefined"
                :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
                :value="booking.status"
              />
            </view>
            <view class="mb-4rpx text-24rpx text-[#333]">
              {{ dayjs(Number(booking.startTime)).format('HH:mm') }} - {{ dayjs(Number(booking.endTime)).format('HH:mm') }}
            </view>
            <view class="text-22rpx text-[#999]">
              主持人：{{ booking.moderatorName || '-' }}<text class="ml-16rpx">申请人：{{ booking.creatorName || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { MeetingRoomBooking } from '@/api/oa/meetingroom/booking'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getMeetingRoomBookingSchedule } from '@/api/oa/meetingroom/booking'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  roomId?: string
  roomName?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] // 星期展示
const toast = useToast()
const roomName = computed(() => { // 会议室名称，URL 传入可能仍带百分号编码
  if (!props.roomName) {
    return '会议室'
  }
  try {
    return decodeURIComponent(props.roomName)
  } catch {
    return props.roomName
  }
})
const list = ref<MeetingRoomBooking[]>([]) // 五天内的有效预定
const selectedDate = ref(dayjs().startOf('day').valueOf()) // 当前选中日期零点
const dates = Array.from({ length: 5 }, (_, index) => // 最近五天日期选项
  dayjs().startOf('day').add(index, 'day').valueOf())

/** 当前日期的预定，包含跨日会议 */
const dayBookings = computed(() => {
  const endTime = selectedDate.value + 24 * 60 * 60 * 1000
  return list.value.filter(
    booking => Number(booking.startTime) < endTime && Number(booking.endTime) > selectedDate.value,
  )
})

/** 半小时占用格，审批中的预定也占用时段 */
const slots = computed(() => {
  return Array.from({ length: 48 }, (_, index) => {
    const startTime = selectedDate.value + index * 30 * 60 * 1000
    const endTime = startTime + 30 * 60 * 1000
    const booking = dayBookings.value.find(
      item => Number(item.startTime) < endTime && Number(item.endTime) > startTime,
    )
    const expired = endTime <= Date.now()
    const title = `${dayjs(startTime).format('HH:mm')}-${dayjs(endTime).format('HH:mm')} - ${
      expired ? '已过期' : booking ? `${booking.title}（${booking.moderatorName}）` : '可预约'}`
    return { startTime, booking, expired, title }
  })
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 点击时段格展示占用说明 */
function handleSlotClick(slot: { title: string }) {
  toast.show(slot.title)
}

/** 查询五天内的有效预定 */
async function getList() {
  if (!props.roomId) {
    return
  }
  list.value = await getMeetingRoomBookingSchedule(
    Number(props.roomId),
    dayjs(dates[0]).format('YYYY-MM-DD HH:mm:ss'),
    dayjs(dates[4]).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
  )
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
