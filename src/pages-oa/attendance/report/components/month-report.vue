<template>
  <view>
    <!-- 统计周期 -->
    <view class="flex items-center justify-between bg-white px-24rpx py-16rpx">
      <view class="flex items-center gap-8rpx text-28rpx text-[#1677ff]" @click="handlePeriodChange(-1)">
        <wd-icon name="arrow-left" size="28rpx" color="#1677ff" />
        <text>上一月</text>
      </view>
      <view class="flex items-center gap-8rpx text-28rpx text-[#333] font-semibold" @click="periodPickerVisible = true">
        <text>{{ periodText }}</text>
        <wd-icon name="arrow-down" size="28rpx" color="#999" />
      </view>
      <view class="flex items-center gap-8rpx text-28rpx text-[#1677ff]" @click="handlePeriodChange(1)">
        <text>下一月</text>
        <wd-icon name="arrow-right" size="28rpx" color="#1677ff" />
      </view>
    </view>
    <wd-datetime-picker
      v-model="periodDate"
      v-model:visible="periodPickerVisible"
      type="year-month"
      title="选择统计周期"
      @confirm="getList"
    />

    <!-- 成员筛选 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <UserSearchPicker v-model="queryUserId" label="成员" placeholder="请选择成员，默认管理范围" @change="getList" />
    </view>

    <!-- 月报：成员 x 次数汇总 -->
    <view class="px-24rpx pb-24rpx">
      <view
        v-for="user in list"
        :key="user.userId"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx"
      >
        <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
          {{ user.userName }}<text v-if="user.deptName" class="ml-12rpx text-24rpx text-[#999] font-normal">{{ user.deptName }}</text>
        </view>
        <view class="grid grid-cols-4 gap-12rpx text-center">
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#333] font-semibold">
              {{ user.normalCount }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              正常
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#f5222d] font-semibold">
              {{ user.lateCount }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              迟到
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#fa8c16] font-semibold">
              {{ user.earlyCount }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              早退
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#f5222d] font-semibold">
              {{ user.absentDays }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              旷工
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#333] font-semibold">
              {{ user.clockInCount }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              上班打卡
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#333] font-semibold">
              {{ user.clockOutCount }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              下班打卡
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#1677ff] font-semibold">
              {{ user.leaveDays }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              请假(天)
            </view>
          </view>
          <view class="rounded-12rpx bg-[#f7f8fa] p-12rpx">
            <view class="text-28rpx text-[#1677ff] font-semibold">
              {{ user.travelDays }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              出差(天)
            </view>
          </view>
        </view>
      </view>
      <view v-if="!list.length" class="py-60rpx text-center text-28rpx text-[#999]">
        暂无月报数据
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceMonthReport } from '@/api/oa/attendance'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { getAttendanceMonthReport } from '@/api/oa/attendance'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'

const periodDate = ref<number>(Date.now()) // 统计周期内任意日期
const periodPickerVisible = ref(false) // 周期选择器显示状态
const queryUserId = ref<number>() // 成员筛选，空为管理范围
const list = ref<AttendanceMonthReport[]>([]) // 月报数据

const periodText = computed(() => dayjs(periodDate.value).format('YYYY-MM')) // 月报显示年月

/** 查询考勤月报 */
async function getList() {
  const date = dayjs(periodDate.value)
  list.value = await getAttendanceMonthReport({
    year: date.year(),
    month: date.month() + 1,
    userId: queryUserId.value,
  })
}

/** 切换上一个或下一个统计周期 */
function handlePeriodChange(step: number) {
  periodDate.value = dayjs(periodDate.value).add(step, 'month').valueOf()
  getList()
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
