<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="KPI 考核"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 状态 tab -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
        <wd-tab
          v-for="tab in statusTabs"
          :key="tab.value"
          :title="`${tab.label}(${tab.count})`"
        />
      </wd-tabs>
    </view>

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
      empty-view-text="暂无 KPI 考核"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="min-w-0" @click="handleDetail(item)">
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <dict-tag
                v-if="item.status != null"
                :type="DICT_TYPE.HRM_PERFORMANCE_PLAN_STATUS"
                :value="item.status"
              />
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">考核模板：</text>{{ item.assessmentTemplateName || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">结果模板：</text>{{ item.resultTemplateName || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">考核周期：</text>{{ item.cycle || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">起止：</text>{{ formatHrmDateRange(item.startTime, item.endTime) }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">参评/完成：</text>{{ item.employeeCount || 0 }} / {{ item.finishedCount || 0 }}
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">阶段：</text>
              <dict-tag
                v-if="item.stageType != null"
                :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
                :value="item.stageType"
              />
              <text v-else>-</text>
            </view>
            <view v-if="getStageCountList(item).length" class="flex flex-wrap gap-8rpx">
              <view
                v-for="stage in getStageCountList(item)"
                :key="stage.stageType"
                class="rounded-8rpx bg-[#f5f5f5] px-12rpx py-4rpx text-22rpx text-[#666]"
              >
                {{ getDictLabel(DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS, stage.stageType) || '未知' }}（{{ stage.count }}）
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:performance:plan:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { PerformancePlan } from '@/api/hrm/performance/plan'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import {
  getPerformancePlanPage,
  getPerformancePlanStatusCount,
} from '@/api/hrm/performance/plan'
import { getDictLabel } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { HrmPerformancePlanStatus } from '@/pages-hrm/utils/constants'
import { formatHrmDateRange } from '@/pages-hrm/utils/format'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<PerformancePlan[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数（不含状态）
const statusCounts = ref<Record<number, number>>({}) // 各状态数量
const tabIndex = ref(0) // 当前 tab 下标（默认未开始）

const statusTabs = computed(() => [ // 状态页签（无「全部」）
  {
    label: '未开始',
    value: HrmPerformancePlanStatus.NOT_STARTED,
    count: statusCounts.value[HrmPerformancePlanStatus.NOT_STARTED] || 0,
  },
  {
    label: '进行中',
    value: HrmPerformancePlanStatus.RUNNING,
    count: statusCounts.value[HrmPerformancePlanStatus.RUNNING] || 0,
  },
  {
    label: '已归档',
    value: HrmPerformancePlanStatus.ARCHIVED,
    count: statusCounts.value[HrmPerformancePlanStatus.ARCHIVED] || 0,
  },
  {
    label: '已终止',
    value: HrmPerformancePlanStatus.TERMINATED,
    count: statusCounts.value[HrmPerformancePlanStatus.TERMINATED] || 0,
  },
])

const activeStatusValue = computed(() => {
  return statusTabs.value[tabIndex.value]?.value ?? HrmPerformancePlanStatus.NOT_STARTED
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获得阶段人数列表 */
function getStageCountList(plan: PerformancePlan) {
  return Object.entries(plan.stageCountMap || {})
    .map(([stageType, count]) => ({ stageType: Number(stageType), count }))
    .filter(item => item.count > 0)
    .sort((left, right) => left.stageType - right.stageType)
}

/** 查询 KPI 考核列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const [data] = await Promise.all([
      getPerformancePlanPage({
        ...queryParams.value,
        status: activeStatusValue.value,
        pageNo,
        pageSize,
      }),
      loadStatusCounts(),
    ])
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 加载状态统计 */
async function loadStatusCounts() {
  const counts = await getPerformancePlanStatusCount({ ...queryParams.value })
  statusCounts.value = counts || {}
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  tabIndex.value = 0
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  reload()
}

/** 新增 KPI 考核 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/performance/plan/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: PerformancePlan) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/performance/plan/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm-performance-plan-refresh', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm-performance-plan-refresh', reload)
})
</script>
