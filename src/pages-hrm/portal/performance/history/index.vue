<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我的绩效档案"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
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
            :key="item.id"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleDetail(item)"
          >
            <view class="mb-16rpx truncate text-32rpx text-[#333] font-semibold">
              {{ item.name || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">考核周期：</text>
              {{ formatHrmDateRange(item.startTime, item.endTime) }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">绩效得分：</text>{{ formatHrmScore(item.score) }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">绩效等级：</text>{{ item.resultLevel || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">绩效系数：</text>{{ item.coefficient ?? '-' }}
            </view>
            <view class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">归档时间：</text>
              {{ formatDateTime(item.archiveTime) || '-' }}
            </view>
          </view>
        </view>
      </z-paging>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { PortalPerformanceAssessmentSummary } from '@/api/hrm/portal/performance/assessment'
import { onMounted, ref } from 'vue'
import { getPortalPerformanceAssessmentPage } from '@/api/hrm/portal/performance/assessment'
import { formatHrmDateRange, formatHrmScore } from '@/pages-hrm/utils/format'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const accessible = ref(false) // 是否可访问
const list = ref<PortalPerformanceAssessmentSummary[]>([]) // 绩效档案列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询我的绩效档案 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPortalPerformanceAssessmentPage({
      ...queryParams.value,
      archived: true,
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
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 查看详情 */
function handleDetail(item: PortalPerformanceAssessmentSummary) {
  uni.navigateTo({
    url: `/pages-hrm/portal/performance/assessment/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(async () => {
  accessible.value = await checkHrmPortalAccess()
})
</script>
