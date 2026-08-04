<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="发放记录"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 发放记录列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无发放记录"
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
              {{ formatHrmYearMonth(item.year, item.month) }}
            </view>
            <view class="shrink-0 text-26rpx text-[#999]">
              已查看 {{ item.readCount ?? 0 }}
            </view>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建人：</text>{{ item.creatorName || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">发放时间：</text>{{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">工资表总人数：</text>{{ item.employeeCount ?? 0 }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">发放人数：</text>{{ item.sendEmployeeCount ?? 0 }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { SalarySlipSendRecord } from '@/api/hrm/salary/slip/send-record'
import { ref } from 'vue'
import { getSalarySlipSendRecordPage } from '@/api/hrm/salary/slip/send-record'
import { formatHrmYearMonth, getAttendanceYearMonth } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<SalarySlipSendRecord[]>([]) // 发放记录列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({
  ...getAttendanceYearMonth(),
}) // 查询参数；默认当前月

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询发放记录列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSalarySlipSendRecordPage({
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
    year: data?.year,
    month: data?.month,
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
function handleDetail(item: SalarySlipSendRecord) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/salary/slip/send-record/detail/index?id=${item.id}`,
  })
}
</script>
