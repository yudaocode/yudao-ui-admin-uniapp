<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="请假记录"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 请假记录列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无请假记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
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
            <dict-tag
              v-if="item.approvalStatus != null"
              :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
              :value="item.approvalStatus"
            />
          </view>
          <view class="mb-12rpx flex items-center gap-12rpx text-28rpx text-[#666]">
            <text class="text-[#999]">请假类型：</text>
            <dict-tag
              v-if="item.type"
              :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE"
              :value="item.type"
            />
            <text v-else>-</text>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">开始时间：</text>{{ formatDateTime(item.startTime) || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">结束时间：</text>{{ formatDateTime(item.endTime) || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">请假天数：</text>{{ item.day != null ? `${item.day} 天` : '-' }}
          </view>
          <view v-if="item.reason" class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">事由：</text>
            <text class="line-clamp-1">{{ item.reason }}</text>
          </view>
          <view v-if="item.remark" class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">备注：</text>
            <text class="line-clamp-1">{{ item.remark }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceLeave } from '@/api/hrm/attendance/leave'
import { ref } from 'vue'
import { getAttendanceLeavePage } from '@/api/hrm/attendance/leave'
import { getAttendanceMonthRange } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<AttendanceLeave[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数；默认当前月
  startTime: getAttendanceMonthRange(),
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询请假记录列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getAttendanceLeavePage({
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
    startTime: getAttendanceMonthRange(),
    ...data,
  }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({ startTime: getAttendanceMonthRange() })
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看详情 */
function handleDetail(item: AttendanceLeave) {
  uni.navigateTo({
    url: `/pages-hrm/attendance/leave/detail/index?id=${item.id}`,
  })
}
</script>
