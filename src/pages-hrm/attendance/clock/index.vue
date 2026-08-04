<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="打卡记录"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 打卡记录列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无打卡记录"
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
              v-if="item.status != null"
              :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS"
              :value="item.status"
            />
          </view>
          <view class="mb-12rpx flex items-center gap-12rpx text-28rpx text-[#666]">
            <text class="text-[#999]">打卡类型：</text>
            <dict-tag
              v-if="item.type != null"
              :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE"
              :value="item.type"
            />
            <text v-else>-</text>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">应打卡：</text>{{ formatDateTime(item.attendanceTime) || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">打卡时间：</text>{{ formatDateTime(item.clockTime) || '-' }}
          </view>
          <view class="mb-12rpx flex items-center gap-12rpx text-28rpx text-[#666]">
            <text class="text-[#999]">来源：</text>
            <dict-tag
              v-if="item.sourceType != null"
              :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_SOURCE"
              :value="item.sourceType"
            />
            <text v-else>-</text>
          </view>
          <view v-if="item.address" class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">地点：</text>
            <text class="line-clamp-1">{{ item.address }}</text>
          </view>
          <view v-if="item.remark" class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">备注：</text>
            <text class="line-clamp-1">{{ item.remark }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 手工录入按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:attendance:clock:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceClock } from '@/api/hrm/attendance/clock'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getAttendanceClockPage } from '@/api/hrm/attendance/clock'
import { useAccess } from '@/hooks/useAccess'
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

const { hasAccessByCodes } = useAccess()
const list = ref<AttendanceClock[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数；默认当前月
  attendanceTime: getAttendanceMonthRange(),
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询打卡记录列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getAttendanceClockPage({
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
    attendanceTime: getAttendanceMonthRange(),
    ...data,
  }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({ attendanceTime: getAttendanceMonthRange() })
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 手工录入打卡 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/attendance/clock/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: AttendanceClock) {
  uni.navigateTo({
    url: `/pages-hrm/attendance/clock/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:attendance:clock:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:attendance:clock:reload', reload)
})
</script>
