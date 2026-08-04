<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="考勤组设置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 考勤组列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无考勤组数据"
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
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <wd-tag v-if="item.defaultStatus" type="primary" plain>
              默认
            </wd-tag>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">考勤规则：</text>早晚打卡
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">班次：</text>
            <text class="line-clamp-2">{{ formatShifts(item) }}</text>
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">适用范围：</text>
            <text class="line-clamp-2">{{ formatAttendanceGroupScope(item) }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:attendance:group:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceGroup } from '@/api/hrm/attendance/group'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getAttendanceGroupPage } from '@/api/hrm/attendance/group'
import { useAccess } from '@/hooks/useAccess'
import {
  formatAttendanceGroupScope,
  formatHrmAttendanceWeeks,
} from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<AttendanceGroup[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 格式化班次摘要 */
function formatShifts(item: AttendanceGroup) {
  if (!item.shifts?.length) {
    return '-'
  }
  return item.shifts
    .map(shift => `${formatHrmAttendanceWeeks(shift.weeks)} ${shift.startTime}-${shift.endTime}`)
    .join('；')
}

/** 查询考勤组列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getAttendanceGroupPage({
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

/** 新增考勤组 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/attendance/config/group/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: AttendanceGroup) {
  uni.navigateTo({
    url: `/pages-hrm/attendance/config/group/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:attendance:group:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:attendance:group:reload', reload)
})
</script>
