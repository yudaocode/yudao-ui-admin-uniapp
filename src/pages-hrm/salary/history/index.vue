<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="历史工资"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 历史工资表列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无历史工资表"
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
              {{ item.title || '-' }}
            </view>
            <view class="shrink-0 text-26rpx text-[#999]">
              {{ formatHrmYearMonth(item.year, item.month) }}
            </view>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">计薪人数：</text>{{ item.employeeCount ?? 0 }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">应发工资：</text>{{ formatHrmMoney(item.expectedPaySalary) }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">实发工资：</text>{{ formatHrmMoney(item.realPaySalary) }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">个税总额：</text>{{ formatHrmMoney(item.personalTax) }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { SalaryMonthRecord } from '@/api/hrm/salary/month-record'
import { ref } from 'vue'
import { getSalaryMonthRecordPage } from '@/api/hrm/salary/month-record'
import { HrmSalaryMonthStatus } from '@/pages-hrm/utils/constants'
import { formatHrmMoney, formatHrmYearMonth } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<SalaryMonthRecord[]>([]) // 历史工资表列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({
  year: new Date().getFullYear(),
}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询历史工资表列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSalaryMonthRecordPage({
      pageNo,
      pageSize,
      year: queryParams.value.year,
      status: HrmSalaryMonthStatus.HISTORY,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    year: data?.year ?? new Date().getFullYear(),
  }
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

/** 查看详情 */
function handleDetail(item: SalaryMonthRecord) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/salary/history/detail/index?id=${item.id}`,
  })
}
</script>
