<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="月度汇总"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 月度汇总列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无月度汇总"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="`${item.employeeId}-${item.year}-${item.month}`"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.employeeName || '-' }}
              </view>
              <view class="mt-8rpx truncate text-24rpx text-[#999]">
                {{ item.jobNumber || '-' }} · {{ item.deptName || '-' }}
              </view>
            </view>
            <view
              class="shrink-0 rounded-8rpx px-12rpx py-4rpx text-22rpx"
              :class="item.fullAttendance ? 'bg-[#f6ffed] text-[#52c41a]' : 'bg-[#fff7e6] text-[#fa8c16]'"
            >
              {{ item.fullAttendance ? '全勤' : '非全勤' }}
            </view>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">岗位：</text>{{ item.postName || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">应出勤：</text>{{ item.attendDays ?? 0 }} 天
            <text class="mx-8rpx text-[#ddd]">|</text>
            <text class="mr-8rpx text-[#999]">实出勤：</text>{{ formatHrmDays(item.actualDays) }} 天
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">迟到：</text>{{ item.lateCount ?? 0 }} 次 / {{ item.lateMinute ?? 0 }} 分
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">早退：</text>{{ item.earlyCount ?? 0 }} 次 / {{ item.earlyMinute ?? 0 }} 分
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">旷工：</text>{{ formatHrmDays(item.absenteeismDays) }} 天
            <text class="mx-8rpx text-[#ddd]">|</text>
            <text class="mr-8rpx text-[#999]">缺卡：</text>{{ item.misscardCount ?? 0 }} 次
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">请假：</text>{{ formatHrmDays(item.leaveDays) }} 天
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">考勤扣款：</text>{{ formatHrmMoney(item.attendanceDeductAmount) }} 元
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceMonthRecord } from '@/api/hrm/attendance/statistics'
import { ref } from 'vue'
import { getAttendanceMonthRecordPage } from '@/api/hrm/attendance/statistics'
import { formatHrmDays, formatHrmMoney, getAttendanceYearMonth } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<AttendanceMonthRecord[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数；默认当前月
  ...getAttendanceYearMonth(),
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询月度汇总列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getAttendanceMonthRecordPage({
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
  queryParams.value = {
    ...getAttendanceYearMonth(),
    ...data,
  }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery(getAttendanceYearMonth())
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看详情 */
function handleDetail(item: AttendanceMonthRecord) {
  uni.navigateTo({
    url: `/pages-hrm/attendance/statistics/detail/index?employeeId=${item.employeeId}&year=${item.year}&month=${item.month}`,
  })
}
</script>
