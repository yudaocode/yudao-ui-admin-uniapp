<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="员工考核详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 头部摘要 -->
    <view v-if="detail.id" class="bg-white px-24rpx py-24rpx">
      <view class="mb-12rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1">
          <view class="truncate text-36rpx text-[#333] font-semibold">
            {{ detail.name || '-' }}
          </view>
          <view class="mt-8rpx text-26rpx text-[#666]">
            {{ detail.employeeName || '-' }} · {{ detail.jobNumber || '-' }}
          </view>
        </view>
        <dict-tag
          v-if="detail.status != null"
          :type="DICT_TYPE.HRM_PERFORMANCE_PLAN_STATUS"
          :value="detail.status"
        />
      </view>
      <view class="grid grid-cols-2 mt-16rpx gap-16rpx">
        <view class="rounded-8rpx bg-[#e6f4ff] px-16rpx py-16rpx">
          <view class="text-24rpx text-[#999]">
            绩效得分
          </view>
          <view class="mt-8rpx text-32rpx text-[#1677ff] font-semibold">
            {{ detail.score ?? '-' }}
          </view>
        </view>
        <view class="rounded-8rpx bg-[#f6ffed] px-16rpx py-16rpx">
          <view class="text-24rpx text-[#999]">
            考核结果
          </view>
          <view class="mt-8rpx text-28rpx text-[#52c41a] font-semibold">
            {{ detail.resultLevel || '-' }}
            <text v-if="detail.coefficient != null" class="text-22rpx font-normal">
              （系数 {{ detail.coefficient }}）
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 基本信息 -->
    <wd-cell-group border>
      <wd-cell title="考核周期" :value="formatHrmPerformanceCycleType(detail.cycleType)" />
      <wd-cell title="周期范围" :value="detail.cycle || '-'" />
      <wd-cell title="部门" :value="detail.deptName || '-'" />
      <wd-cell title="职位" :value="detail.postName || '-'" />
      <wd-cell title="聘用形式">
        <dict-tag
          v-if="detail.employeeType != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
          :value="detail.employeeType"
        />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="当前阶段">
        <dict-tag
          v-if="detail.stageType != null"
          :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
          :value="detail.stageType"
        />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="当前处理人" :value="detail.currentHandlerName || '-'" />
      <wd-cell title="考核时间" :value="formatHrmDateRange(detail.startTime, detail.endTime)" />
    </wd-cell-group>

    <!-- 分类 -->
    <view class="mt-16rpx bg-white">
      <wd-tabs v-model="tabIndex" slidable="always">
        <wd-tab title="考核评分" />
        <wd-tab title="考核流程" />
        <wd-tab title="考核记录" />
      </wd-tabs>
    </view>

    <scroll-view scroll-y class="min-h-0 flex-1" :class="canDelete ? 'pb-160rpx' : ''">
      <!-- 考核评分 -->
      <view v-if="tabIndex === 0" class="p-24rpx pb-48rpx">
        <view
          v-for="row in scoreRows"
          :key="row.key"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-8rpx text-28rpx text-[#333] font-semibold">
            {{ row.dimensionName || '-' }} / {{ row.quotaName || '-' }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            目标：{{ row.targetValue || '-' }} · 实际：{{ row.actualValue || '-' }} · 权重：{{ row.weight ?? 0 }}%
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            评分人：{{ row.raterName || '-' }} · 评分：{{ row.score ?? '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            评语：{{ row.comment || '-' }}
          </view>
          <view v-if="row.standard" class="mt-8rpx text-24rpx text-[#999]">
            标准：{{ row.standard }}
          </view>
        </view>
        <view v-if="!scoreRows.length" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无评分明细
        </view>
        <wd-cell-group v-if="hasAssessmentComment" border title="考核评语" class="mt-8rpx">
          <wd-cell title="自评说明" :value="detail.selfComment || '-'" />
          <wd-cell title="评分说明" :value="detail.reviewerComment || '-'" />
          <wd-cell title="结果说明" :value="detail.resultComment || '-'" />
        </wd-cell-group>
      </view>

      <!-- 考核流程 -->
      <view v-else-if="tabIndex === 1" class="p-24rpx pb-48rpx">
        <view
          v-for="(stage, index) in stageList"
          :key="stage.id || index"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          :class="index === activeStage ? 'ring-2 ring-[#1677ff]' : ''"
        >
          <view class="mb-8rpx flex items-center justify-between gap-16rpx">
            <text class="min-w-0 flex-1 text-28rpx text-[#333] font-semibold">
              {{ stage.name || '-' }}
            </text>
            <dict-tag
              v-if="stage.status != null"
              :type="DICT_TYPE.HRM_PERFORMANCE_ASSESSMENT_STAGE_STATUS"
              :value="stage.status"
            />
          </view>
          <view class="text-26rpx text-[#666]">
            处理人：{{ stage.handlerName || '系统' }}
          </view>
        </view>
        <view v-if="!stageList.length" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无考核流程
        </view>
      </view>

      <!-- 考核记录 -->
      <view v-else class="p-24rpx pb-48rpx">
        <view
          v-for="(record, index) in processRecordList"
          :key="index"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-8rpx flex items-center justify-between gap-16rpx">
            <text class="min-w-0 flex-1 text-28rpx text-[#333] font-semibold">
              {{ record.title || '-' }}
            </text>
            <text class="shrink-0 text-24rpx text-[#999]">
              {{ formatDateTime(record.operateTime) || '-' }}
            </text>
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            操作人：{{ record.operatorName || '-' }}
          </view>
          <view class="whitespace-pre-wrap break-words text-26rpx text-[#666]">
            {{ record.content || '-' }}
          </view>
        </view>
        <view v-if="!processRecordList.length" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无考核记录
        </view>
      </view>
    </scroll-view>

    <!-- 底部删除：归档考核可删 -->
    <view v-if="canDelete" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type {
  PerformanceAssessment,
  PerformanceAssessmentQuota,
  PerformanceAssessmentStage,
  PerformanceProcessRecord,
} from '@/api/hrm/performance/assessment'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deletePerformanceArchiveRecords,
  getPerformanceAssessment,
  getPerformanceAssessmentArchive,
  getPerformanceAssessmentArchiveProcessRecordList,
  getPerformanceAssessmentProcessRecordList,
} from '@/api/hrm/performance/assessment'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import {
  HrmPerformanceAssessmentStageStatus,
  HrmPerformancePlanStatus,
} from '@/pages-hrm/utils/constants'
import {
  formatHrmDateRange,
  formatHrmPerformanceCycleType,
} from '@/pages-hrm/utils/format'

interface PerformanceScoreRow {
  key: string
  dimensionName?: string
  quotaName?: string
  description?: string
  standard?: string
  targetValue?: string
  actualValue?: string
  weight?: number
  raterName?: string
  score?: number
  comment?: string
}

const props = defineProps<{
  id?: number | string
  planId?: number | string
  employeeId?: number | string
  archived?: string | boolean
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const detail = ref<PerformanceAssessment>({}) // 考核详情
const processRecordList = ref<PerformanceProcessRecord[]>([]) // 流程记录
const tabIndex = ref(0) // 当前 tab
const deleting = ref(false) // 删除中

const stageList = computed(() => {
  return [...(detail.value.stages || [])].sort((a, b) => (a.sort || 0) - (b.sort || 0))
})
const activeStage = computed(() => {
  if (detail.value.status === HrmPerformancePlanStatus.ARCHIVED) {
    return stageList.value.length
  }
  const index = stageList.value.findIndex(
    stage => stage.status !== HrmPerformanceAssessmentStageStatus.PROCESSED,
  )
  return index >= 0 ? index : stageList.value.length
})
const scoreRows = computed(() => {
  return (detail.value.quotas || []).flatMap(quota => buildQuotaScoreRows(quota))
})
const hasAssessmentComment = computed(() => {
  return !!detail.value.selfComment || !!detail.value.reviewerComment || !!detail.value.resultComment
})

const isArchived = computed(() => { // 是否归档详情
  return props.archived === true || props.archived === 'true'
})
const canDelete = computed(() => { // 归档详情可删
  return isArchived.value && hasAccessByCodes(['hrm:performance:archive:delete'])
})

/** 返回上一页 */
function handleBack() {
  if (props.planId) {
    navigateBackPlus(`/pages-hrm/performance/plan/detail/index?id=${props.planId}&tab=employees`)
    return
  }
  if (props.employeeId) {
    navigateBackPlus(`/pages-hrm/performance/assessment/employee/index?employeeId=${props.employeeId}`)
    return
  }
  if (isArchived.value) {
    navigateBackPlus('/pages-hrm/performance/assessment/index')
    return
  }
  navigateBackPlus('/pages-hrm/performance/plan/index')
}

/** 删除归档考核 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认删除该归档考核？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePerformanceArchiveRecords([Number(props.id)])
    toast.success('删除成功')
    uni.$emit('hrm-performance-archive-refresh')
    handleBack()
  } finally {
    deleting.value = false
  }
}

/** 构建指标评分明细 */
function buildQuotaScoreRows(quota: PerformanceAssessmentQuota): PerformanceScoreRow[] {
  const scoreStages = (detail.value.reviewStages || []).filter(stage =>
    stage.quotaScoreList?.some(score => score.assessmentQuotaId === quota.id),
  )
  if (!scoreStages.length) {
    return [buildScoreRow(quota)]
  }
  return scoreStages.map((stage) => {
    const quotaScore = stage.quotaScoreList?.find(score => score.assessmentQuotaId === quota.id)
    return buildScoreRow(quota, stage, quotaScore?.score, quotaScore?.comment)
  })
}

/** 构建一行指标评分 */
function buildScoreRow(
  quota: PerformanceAssessmentQuota,
  stage?: PerformanceAssessmentStage,
  score?: number,
  comment?: string,
): PerformanceScoreRow {
  return {
    key: `${quota.id || 0}-${stage?.id || 0}`,
    dimensionName: quota.dimensionName,
    quotaName: quota.name,
    description: quota.description,
    standard: quota.standard,
    targetValue: quota.targetValue,
    actualValue: quota.actualValue,
    weight: quota.weight,
    raterName: stage?.handlerName,
    score: score ?? quota.finalScore,
    comment: comment || quota.comment,
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const [assessment, records] = isArchived.value
    ? await Promise.all([
        getPerformanceAssessmentArchive(Number(props.id)),
        getPerformanceAssessmentArchiveProcessRecordList(Number(props.id)),
      ])
    : await Promise.all([
        getPerformanceAssessment(Number(props.id)),
        getPerformanceAssessmentProcessRecordList(Number(props.id)),
      ])
  detail.value = assessment
  processRecordList.value = records || []
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
