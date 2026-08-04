<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="绩效档案"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无绩效档案"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.employeeId"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.employeeName || '-' }}
            </view>
            <dict-tag
              v-if="item.employeeStatus != null"
              :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
              :value="item.employeeStatus"
            />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">工号：</text>{{ item.jobNumber || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">部门：</text>{{ item.deptName || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">职位：</text>{{ item.postName || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">手机：</text>{{ item.mobile || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">最近计划：</text>{{ item.latestPlanName || '-' }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">评分：</text>{{ item.latestScore ?? '-' }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            <text class="mr-8rpx text-[#999]">等级：</text>{{ item.latestResultLevel || '-' }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            <text class="mr-8rpx text-[#999]">次数：</text>{{ item.assessmentCount ?? 0 }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { PerformanceArchiveEmployee } from '@/api/hrm/performance/assessment'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getPerformanceArchiveEmployeePage } from '@/api/hrm/performance/assessment'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<PerformanceArchiveEmployee[]>([]) // 员工绩效档案列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询员工绩效档案列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPerformanceArchiveEmployeePage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
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

/** 打开员工绩效档案详情 */
function handleDetail(item: PerformanceArchiveEmployee) {
  if (!item.employeeId) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/performance/assessment/employee/index?employeeId=${item.employeeId}`,
  })
}

/** 列表刷新 */
function handleRefresh() {
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm-performance-archive-refresh', handleRefresh)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm-performance-archive-refresh', handleRefresh)
})
</script>
