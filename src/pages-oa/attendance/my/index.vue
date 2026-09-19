<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我的考勤"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 今日打卡 -->
    <view class="m-24rpx rounded-12rpx bg-white p-24rpx">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">{{ formatDate(Date.now()) }} 今日考勤</text>
        <wd-button size="small" type="primary" :loading="clocking" @click="handleClock">
          {{ clockButtonText }}
        </wd-button>
      </view>
      <view class="flex gap-24rpx">
        <view class="flex-1 rounded-12rpx bg-[#f7f8fa] p-20rpx">
          <view class="mb-8rpx text-26rpx text-[#999]">
            上班打卡
          </view>
          <view class="text-28rpx text-[#333]">
            {{ todayClockIn ? formatTime(todayClockIn.attendanceTime) : '未打卡' }}
          </view>
          <dict-tag v-if="todayClockIn" :type="DICT_TYPE.OA_ATTENDANCE_STATUS" :value="todayClockIn.status" />
        </view>
        <view class="flex-1 rounded-12rpx bg-[#f7f8fa] p-20rpx">
          <view class="mb-8rpx text-26rpx text-[#999]">
            下班打卡
          </view>
          <view class="text-28rpx text-[#333]">
            {{ todayClockOut ? formatTime(todayClockOut.attendanceTime) : '未打卡' }}
          </view>
          <dict-tag v-if="todayClockOut" :type="DICT_TYPE.OA_ATTENDANCE_STATUS" :value="todayClockOut.status" />
        </view>
      </view>
    </view>

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 考勤列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无考勤数据"
      @query="queryList"
    >
      <view class="px-24rpx pb-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx"
        >
          <view class="mb-12rpx flex items-center justify-between gap-12rpx">
            <text class="text-32rpx text-[#333] font-semibold">{{ formatDate(item.attendanceTime) }}</text>
            <dict-tag :type="DICT_TYPE.OA_ATTENDANCE_STATUS" :value="item.status" />
          </view>
          <view class="mb-8rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">考勤类型：</text>
            <dict-tag :type="DICT_TYPE.OA_ATTENDANCE_TYPE" :value="item.type" />
          </view>
          <view class="flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">考勤时间：</text>
            <text>{{ formatDateTime(item.attendanceTime) || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Attendance } from '@/api/oa/attendance'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { clockAttendance, getMyAttendancePage, getMyTodayAttendanceList } from '@/api/oa/attendance'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { OA_ATTENDANCE_TYPE } from '../../utils/constants'
import SearchForm from '../components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const todayList = ref<Attendance[]>([]) // 今日考勤列表
const clocking = ref(false) // 打卡状态
const list = ref<Attendance[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const todayClockIn = computed(() => todayList.value.find(item => item.type === OA_ATTENDANCE_TYPE.CLOCK_IN)) // 今日上班打卡
const todayClockOut = computed(() => todayList.value.find(item => item.type === OA_ATTENDANCE_TYPE.CLOCK_OUT)) // 今日下班打卡
const clockButtonText = computed(() => { // 打卡按钮文案：首次上班，其后下班，重复下班为更新时间
  if (!todayClockIn.value) {
    return '上班打卡'
  }
  return todayClockOut.value ? '更新下班打卡' : '下班打卡'
})

/** 取打卡时间的时分秒 */
function formatTime(time?: string) {
  return formatDateTime(time)?.slice(11) || ''
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载今日考勤 */
async function getTodayList() {
  todayList.value = await getMyTodayAttendanceList()
}

/** 执行打卡 */
async function handleClock() {
  clocking.value = true
  try {
    await clockAttendance()
    toast.success('打卡成功')
    getTodayList()
    reload()
  } finally {
    clocking.value = false
  }
}

/** 查询考勤列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getMyAttendancePage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:attendance:reload', reload)
  getTodayList()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:attendance:reload', reload)
})
</script>
