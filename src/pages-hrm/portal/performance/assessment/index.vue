<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="KPI 考核"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <!-- 搜索组件 -->
      <SearchForm @search="handleQuery" @reset="handleReset" />

      <!-- 主阶段页签 -->
      <view class="bg-white">
        <wd-tabs v-model="mainTabIndex" slidable="always" @change="handleMainTabChange">
          <wd-tab
            v-for="tab in mainTabs"
            :key="tab.name"
            :title="tab.count > 0 ? `${tab.label}(${tab.count})` : tab.label"
          />
        </wd-tabs>
      </view>

      <!-- 状态页签 -->
      <view class="bg-white">
        <scroll-view scroll-x class="whitespace-nowrap px-24rpx py-16rpx">
          <view
            v-for="item in statusTabs"
            :key="item.name"
            class="mr-16rpx inline-flex rounded-full px-24rpx py-10rpx text-24rpx"
            :class="activeStatus === item.name
              ? 'bg-[#1677ff] text-white'
              : 'bg-[#f5f5f5] text-[#666]'"
            @click="handleStatusChange(item.name)"
          >
            {{ item.label }}
            <text v-if="item.count > 0" class="ml-6rpx">
              {{ item.count }}
            </text>
          </view>
        </scroll-view>
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
        empty-view-text="暂无绩效任务"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="`${item.id}-${item.currentStage?.id || item.currentReviewStage?.id || 0}`"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleDetail(item)"
          >
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <dict-tag
                v-if="item.stageType != null && !isSelfTaskTab"
                :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
                :value="item.stageType"
              />
            </view>

            <view v-if="!isSelfTaskTab" class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">被考核人：</text>
              {{ item.employeeName || '-' }}
              <text v-if="item.jobNumber" class="ml-8rpx text-24rpx text-[#999]">
                {{ item.jobNumber }}
              </text>
            </view>

            <view v-if="isSelfTaskTab" class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">考核周期：</text>
              {{ formatHrmDateRange(item.startTime, item.endTime) }}
            </view>

            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">当前阶段：</text>
              {{ currentStageName(item) }}
            </view>

            <view v-if="activeTab === HrmPerformanceStageType.TARGET_CONFIRM" class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">指标数：</text>{{ item.quotas?.length || 0 }}
            </view>
            <view
              v-else-if="activeTab === HrmPerformanceStageType.OTHER_SCORE"
              class="mb-12rpx text-28rpx text-[#666]"
            >
              <text class="mr-8rpx text-[#999]">评分权重：</text>
              {{ item.currentReviewStage?.weight || 0 }}%
            </view>
            <view v-else class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">绩效得分：</text>{{ formatHrmScore(item.score) }}
              <text class="mx-8rpx text-[#ddd]">|</text>
              <text class="mr-8rpx text-[#999]">等级：</text>{{ item.resultLevel || '-' }}
              <text v-if="isSelfTaskTab" class="mx-8rpx text-[#ddd]">|</text>
              <text v-if="isSelfTaskTab" class="mr-8rpx text-[#999]">系数：</text>
              <text v-if="isSelfTaskTab">{{ item.coefficient ?? '-' }}</text>
            </view>
          </view>
        </view>
      </z-paging>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type {
  PortalPerformanceAssessment,
  PortalPerformanceTaskCount,
} from '@/api/hrm/portal/performance/assessment'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import {
  getPortalPerformanceAssessmentAppealTaskPage,
  getPortalPerformanceAssessmentFillQuotaTaskPage,
  getPortalPerformanceAssessmentResultAuditTaskPage,
  getPortalPerformanceAssessmentResultConfirmationTaskPage,
  getPortalPerformanceAssessmentReviewTaskPage,
  getPortalPerformanceAssessmentTargetConfirmationTaskPage,
  getPortalPerformanceAssessmentTaskCount,
} from '@/api/hrm/portal/performance/assessment'
import {
  HrmPerformanceAssessmentStageStatus,
  HrmPerformanceStageType,
} from '@/pages-hrm/utils/constants'
import { formatHrmDateRange, formatHrmScore } from '@/pages-hrm/utils/format'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const accessible = ref(false) // 是否可访问
const list = ref<PortalPerformanceAssessment[]>([]) // 任务列表
const pagingRef = ref<any>() // 分页组件引用
const mainTabIndex = ref(0) // 主阶段页签下标
const activeStatus = ref(HrmPerformanceAssessmentStageStatus.PENDING) // 当前状态
const queryParams = ref<Record<string, any>>({}) // 查询参数
const taskCount = ref<PortalPerformanceTaskCount>({
  fillPendingCount: 0,
  fillCompletedCount: 0,
  targetPendingCount: 0,
  targetCompletedCount: 0,
  reviewPendingCount: 0,
  reviewCompletedCount: 0,
  resultAuditPendingCount: 0,
  resultAuditCompletedCount: 0,
  resultConfirmationPendingCount: 0,
  resultConfirmationCompletedCount: 0,
  resultConfirmationAppealedCount: 0,
  appealPendingCount: 0,
  appealCompletedCount: 0,
}) // 任务数量

const mainTabs = computed(() => [ // 主阶段页签
  {
    label: '指标填写',
    name: HrmPerformanceStageType.FILL_QUOTA,
    count: taskCount.value.fillPendingCount,
  },
  {
    label: '指标确认',
    name: HrmPerformanceStageType.TARGET_CONFIRM,
    count: taskCount.value.targetPendingCount,
  },
  {
    label: '指标评分',
    name: HrmPerformanceStageType.OTHER_SCORE,
    count: taskCount.value.reviewPendingCount,
  },
  {
    label: '结果审核',
    name: HrmPerformanceStageType.RESULT_AUDIT,
    count: taskCount.value.resultAuditPendingCount,
  },
  {
    label: '结果确认',
    name: HrmPerformanceStageType.RESULT_CONFIRM,
    count: taskCount.value.resultConfirmationPendingCount,
  },
  {
    label: '申诉确认',
    name: HrmPerformanceStageType.APPEAL_CONFIRM,
    count: taskCount.value.appealPendingCount,
  },
])
const activeTab = computed(() => mainTabs.value[mainTabIndex.value]?.name || HrmPerformanceStageType.FILL_QUOTA)
const isSelfTaskTab = computed(() => { // 本人考核任务页签
  return activeTab.value === HrmPerformanceStageType.FILL_QUOTA
    || activeTab.value === HrmPerformanceStageType.RESULT_CONFIRM
})
const statusTabs = computed(() => {
  if (activeTab.value === HrmPerformanceStageType.FILL_QUOTA) {
    return [
      { label: '待填写', name: HrmPerformanceAssessmentStageStatus.PENDING, count: taskCount.value.fillPendingCount },
      { label: '已填写', name: HrmPerformanceAssessmentStageStatus.PROCESSED, count: taskCount.value.fillCompletedCount },
    ]
  }
  if (activeTab.value === HrmPerformanceStageType.TARGET_CONFIRM) {
    return [
      { label: '待确认', name: HrmPerformanceAssessmentStageStatus.PENDING, count: taskCount.value.targetPendingCount },
      { label: '已确认', name: HrmPerformanceAssessmentStageStatus.PROCESSED, count: taskCount.value.targetCompletedCount },
    ]
  }
  if (activeTab.value === HrmPerformanceStageType.OTHER_SCORE) {
    return [
      { label: '待评分', name: HrmPerformanceAssessmentStageStatus.PENDING, count: taskCount.value.reviewPendingCount },
      { label: '已评分', name: HrmPerformanceAssessmentStageStatus.PROCESSED, count: taskCount.value.reviewCompletedCount },
    ]
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_AUDIT) {
    return [
      { label: '待审核', name: HrmPerformanceAssessmentStageStatus.PENDING, count: taskCount.value.resultAuditPendingCount },
      { label: '已审核', name: HrmPerformanceAssessmentStageStatus.PROCESSED, count: taskCount.value.resultAuditCompletedCount },
    ]
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_CONFIRM) {
    return [
      { label: '待确认结果', name: HrmPerformanceAssessmentStageStatus.PENDING, count: taskCount.value.resultConfirmationPendingCount },
      { label: '已确认', name: HrmPerformanceAssessmentStageStatus.PROCESSED, count: taskCount.value.resultConfirmationCompletedCount },
      { label: '已申诉', name: HrmPerformanceAssessmentStageStatus.APPEALED, count: taskCount.value.resultConfirmationAppealedCount },
    ]
  }
  return [
    { label: '待确认', name: HrmPerformanceAssessmentStageStatus.PENDING, count: taskCount.value.appealPendingCount },
    { label: '已确认', name: HrmPerformanceAssessmentStageStatus.PROCESSED, count: taskCount.value.appealCompletedCount },
  ]
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 当前阶段展示文案 */
function currentStageName(item: PortalPerformanceAssessment) {
  if (activeTab.value === HrmPerformanceStageType.OTHER_SCORE) {
    return item.currentReviewStage?.name || '待评分'
  }
  if (
    activeTab.value === HrmPerformanceStageType.FILL_QUOTA
    || activeTab.value === HrmPerformanceStageType.RESULT_CONFIRM
    || activeTab.value === HrmPerformanceStageType.RESULT_AUDIT
    || activeTab.value === HrmPerformanceStageType.APPEAL_CONFIRM
  ) {
    return item.currentStage?.name || '-'
  }
  return item.currentStage?.name || '-'
}

/** 获取任务分页 */
async function getTaskPage(params: Record<string, any>) {
  if (activeTab.value === HrmPerformanceStageType.FILL_QUOTA) {
    return await getPortalPerformanceAssessmentFillQuotaTaskPage(params)
  }
  if (activeTab.value === HrmPerformanceStageType.TARGET_CONFIRM) {
    return await getPortalPerformanceAssessmentTargetConfirmationTaskPage(params)
  }
  if (activeTab.value === HrmPerformanceStageType.OTHER_SCORE) {
    return await getPortalPerformanceAssessmentReviewTaskPage(params)
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_AUDIT) {
    return await getPortalPerformanceAssessmentResultAuditTaskPage(params)
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_CONFIRM) {
    return await getPortalPerformanceAssessmentResultConfirmationTaskPage(params)
  }
  return await getPortalPerformanceAssessmentAppealTaskPage(params)
}

/** 查询任务数量 */
async function getTaskCount() {
  taskCount.value = await getPortalPerformanceAssessmentTaskCount(queryParams.value.search)
}

/** 查询绩效任务列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const [pageResult] = await Promise.all([
      getTaskPage({
        ...queryParams.value,
        stageStatus: activeStatus.value,
        pageNo,
        pageSize,
      }),
      getTaskCount(),
    ])
    pagingRef.value?.completeByTotal(pageResult.list, pageResult.total)
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

/** 主页签切换操作 */
function handleMainTabChange({ index }: { index: number }) {
  mainTabIndex.value = index
  activeStatus.value = HrmPerformanceAssessmentStageStatus.PENDING
  pagingRef.value?.reload()
}

/** 状态页签切换操作 */
function handleStatusChange(status: number) {
  if (activeStatus.value === status) {
    return
  }
  activeStatus.value = status
  pagingRef.value?.reload()
}

/** 打开详情 */
function handleDetail(item: PortalPerformanceAssessment) {
  if (!item.id) {
    return
  }
  const stageId = activeTab.value === HrmPerformanceStageType.OTHER_SCORE
    ? item.currentReviewStage?.id
    : item.currentStage?.id
  const query = [
    `id=${item.id}`,
    stageId ? `stageId=${stageId}` : '',
    activeStatus.value === HrmPerformanceAssessmentStageStatus.PENDING ? 'actionable=1' : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-hrm/portal/performance/assessment/detail/index?${query}` })
}

/** 初始化 / 返回刷新 */
onShow(async () => {
  accessible.value = await checkHrmPortalAccess()
  if (!accessible.value) {
    return
  }
  pagingRef.value?.reload()
})
</script>
