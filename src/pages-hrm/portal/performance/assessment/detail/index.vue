<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="绩效详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <view v-if="loading && !detail.id" class="py-64rpx text-center text-26rpx text-[#999]">
        <wd-loading size="32rpx" />
        <view class="mt-12rpx">
          正在加载绩效详情
        </view>
      </view>

      <template v-else>
        <!-- 头部摘要 -->
        <view class="bg-white px-24rpx py-24rpx">
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-36rpx text-[#333] font-semibold">
              {{ detail.name || '-' }}
            </view>
            <dict-tag
              v-if="detail.stageType != null"
              :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
              :value="detail.stageType"
            />
          </view>
          <view class="grid grid-cols-2 mt-16rpx gap-16rpx">
            <view class="rounded-8rpx bg-[#e6f4ff] px-16rpx py-16rpx">
              <view class="text-24rpx text-[#999]">
                绩效得分
              </view>
              <view class="mt-8rpx text-32rpx text-[#1677ff] font-semibold">
                {{ formatHrmScore(detail.score) }}
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

        <!-- 分类 -->
        <view class="mt-16rpx bg-white">
          <wd-tabs v-model="tabIndex" slidable="always">
            <wd-tab title="绩效详情" />
            <wd-tab title="流程记录" />
          </wd-tabs>
        </view>

        <scroll-view scroll-y class="min-h-0 flex-1" :class="showFooter ? 'pb-160rpx' : ''">
          <!-- 绩效详情 -->
          <view v-if="tabIndex === 0" class="pb-48rpx">
            <wd-cell-group border>
              <wd-cell title="开始日期" :value="formatHrmDate(detail.startTime)" />
              <wd-cell title="结束日期" :value="formatHrmDate(detail.endTime)" />
              <wd-cell title="归档时间" :value="formatDateTime(detail.archiveTime) || '-'" />
              <wd-cell title="指标确认人" :value="detail.targetConfirmationEmployeeName || '-'" />
              <wd-cell title="指标确认结果" :value="targetConfirmResultText" />
              <wd-cell title="自评说明" :value="detail.selfComment || '-'" />
              <wd-cell title="评分说明" :value="detail.reviewerComment || '-'" />
              <wd-cell title="结果说明" :value="detail.resultComment || '-'" />
              <wd-cell title="结果确认时间" :value="formatDateTime(detail.resultConfirmationTime) || '-'" />
              <wd-cell title="指标确认意见" :value="detail.targetConfirmationComment || '-'" />
              <wd-cell title="申诉状态">
                <dict-tag
                  v-if="detail.appealStatus != null"
                  :type="DICT_TYPE.HRM_PERFORMANCE_APPEAL_STATUS"
                  :value="detail.appealStatus"
                />
                <text v-else>-</text>
              </wd-cell>
              <wd-cell title="申诉提交时间" :value="formatDateTime(detail.appealSubmitTime) || '-'" />
              <wd-cell title="申诉完成时间" :value="formatDateTime(detail.appealTime) || '-'" />
              <wd-cell title="申诉原因" :value="detail.appealReason || '-'" />
              <wd-cell title="申诉审批意见" :value="detail.appealComment || '-'" />
            </wd-cell-group>

            <view v-if="detail.appealFileUrls?.length" class="mx-24rpx mt-24rpx">
              <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
                申诉附件
              </view>
              <view
                v-for="url in detail.appealFileUrls"
                :key="url"
                class="mb-12rpx text-28rpx text-[#1677ff]"
                @click="openAttachment(url)"
              >
                {{ getFileNameFromUrl(url) }}
              </view>
            </view>

            <view v-if="detail.quotas?.length" class="mx-24rpx mt-24rpx">
              <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
                绩效指标
              </view>
              <view
                v-for="quota in detail.quotas"
                :key="quota.id || `${quota.dimensionId}-${quota.name}`"
                class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
              >
                <view class="mb-8rpx text-28rpx text-[#333] font-semibold">
                  {{ quota.dimensionName || '-' }} / {{ quota.name || '-' }}
                </view>
                <view class="mb-8rpx text-26rpx text-[#666]">
                  标准：{{ quota.standard || '-' }}
                </view>
                <view class="text-26rpx text-[#666]">
                  权重：{{ quota.weight || 0 }}% · 最终得分：{{ formatHrmScore(quota.finalScore) }}
                </view>
              </view>
            </view>

            <view v-if="detail.reviewStages?.length" class="mx-24rpx mt-24rpx">
              <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
                评分流程
              </view>
              <view
                v-for="stage in detail.reviewStages"
                :key="stage.id"
                class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
              >
                <view class="mb-8rpx text-28rpx text-[#333] font-semibold">
                  {{ stage.name || '-' }}
                </view>
                <view class="mb-8rpx text-26rpx text-[#666]">
                  评分人：{{ stage.handlerName || '-' }} · 权重：{{ stage.weight || 0 }}%
                </view>
                <view class="mb-8rpx text-26rpx text-[#666]">
                  阶段得分：{{ formatHrmScore(stage.score) }}
                </view>
                <view class="text-26rpx text-[#666]">
                  评语：{{ stage.comment || '-' }}
                </view>
              </view>
            </view>
          </view>

          <!-- 流程记录 -->
          <view v-else class="p-24rpx pb-48rpx">
            <view
              v-for="(record, index) in recordList"
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
            <view v-if="!recordList.length" class="py-80rpx text-center text-28rpx text-[#999]">
              暂无流程记录
            </view>
          </view>
        </scroll-view>

        <!-- 底部操作：当前阶段可处理入口 -->
        <view v-if="showFooter" class="yd-detail-footer">
          <view class="yd-detail-footer-actions">
            <wd-button
              v-if="canFillQuota"
              class="flex-1"
              type="primary"
              @click="handleQuota"
            >
              制定指标
            </wd-button>
            <wd-button
              v-if="canTargetConfirm"
              class="flex-1"
              type="primary"
              @click="handleTargetConfirm"
            >
              去确认
            </wd-button>
            <wd-button
              v-if="canReview"
              class="flex-1"
              type="primary"
              @click="handleReview"
            >
              去评分
            </wd-button>
            <wd-button
              v-if="canResultAudit"
              class="flex-1"
              type="primary"
              @click="handleResultAudit"
            >
              去审核
            </wd-button>
            <wd-button
              v-if="canConfirmResult"
              class="flex-1"
              type="success"
              @click="handleConfirmResult"
            >
              确认结果
            </wd-button>
            <wd-button
              v-if="canAppeal"
              class="flex-1"
              type="warning"
              @click="handleAppeal"
            >
              提交申诉
            </wd-button>
            <wd-button
              v-if="canAppealHandle"
              class="flex-1"
              type="primary"
              @click="handleAppealHandle"
            >
              去确认
            </wd-button>
          </view>
        </view>
      </template>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type {
  PerformanceProcessRecord,
  PortalPerformanceAssessment,
} from '@/api/hrm/portal/performance/assessment'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  confirmPortalPerformanceAssessmentResult,
  getPortalPerformanceAssessment,
  getPortalPerformanceAssessmentProcessRecordList,
} from '@/api/hrm/portal/performance/assessment'
import { useAccess } from '@/hooks/useAccess'
import {
  HrmPerformanceAppealStatus,
  HrmPerformanceConfirmationResult,
  HrmPerformanceStageType,
} from '@/pages-hrm/utils/constants'
import { formatHrmDate, formatHrmScore } from '@/pages-hrm/utils/format'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { getFileNameFromUrl, openAttachment } from '@/utils/download'

const props = defineProps<{
  id?: number | string
  stageId?: number | string
  actionable?: string | boolean
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
const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const tabIndex = ref(0) // 当前页签
const detail = ref<PortalPerformanceAssessment>({}) // 考核详情
const recordList = ref<PerformanceProcessRecord[]>([]) // 流程记录
const canAction = computed(() => { // 可处理绩效任务（待处理入口）
  const actionable = props.actionable === true || props.actionable === '1' || props.actionable === 'true'
  return actionable && hasAccessByCodes(['hrm:portal:performance:action'])
})

const targetConfirmResultText = computed(() => {
  if (detail.value.targetConfirmationResult === HrmPerformanceConfirmationResult.PASS) {
    return '已通过'
  }
  if (detail.value.targetConfirmationResult === HrmPerformanceConfirmationResult.REJECT) {
    return '已退回'
  }
  return '-'
})

const handleStageId = computed(() => { // 当前处理阶段编号
  return props.stageId
    ? Number(props.stageId)
    : (detail.value.currentStage?.id || detail.value.currentReviewStage?.id)
})

const canFillQuota = computed(() => { // 可制定指标
  return canAction.value
    && detail.value.stageType === HrmPerformanceStageType.FILL_QUOTA
    && !!detail.value.id
})

const canTargetConfirm = computed(() => { // 可确认目标
  return canAction.value
    && (detail.value.canConfirmTarget
      || detail.value.currentStage?.canHandle
      || detail.value.stageType === HrmPerformanceStageType.TARGET_CONFIRM)
    && !!detail.value.id
    && !!handleStageId.value
    && detail.value.stageType === HrmPerformanceStageType.TARGET_CONFIRM
})

const canReview = computed(() => { // 可评分
  const reviewStage = detail.value.currentReviewStage
  return canAction.value
    && !!detail.value.id
    && !!reviewStage?.id
    && (reviewStage.canScore
      || detail.value.stageType === HrmPerformanceStageType.OTHER_SCORE
      || detail.value.stageType === HrmPerformanceStageType.SELF_SCORE)
    && (detail.value.stageType === HrmPerformanceStageType.OTHER_SCORE
      || detail.value.stageType === HrmPerformanceStageType.SELF_SCORE)
})

const canResultAudit = computed(() => { // 可审核结果
  return canAction.value
    && detail.value.stageType === HrmPerformanceStageType.RESULT_AUDIT
    && !!detail.value.id
    && !!handleStageId.value
    && (detail.value.currentStage?.canHandle !== false)
})

const canConfirmResult = computed(() => { // 可确认结果
  return canAction.value
    && detail.value.stageType === HrmPerformanceStageType.RESULT_CONFIRM
    && !!detail.value.id
})

const canAppeal = computed(() => { // 可提交申诉
  return canAction.value
    && detail.value.stageType === HrmPerformanceStageType.RESULT_CONFIRM
    && detail.value.appealStatus !== HrmPerformanceAppealStatus.PENDING
    && !!detail.value.id
})

const canAppealHandle = computed(() => { // 可处理申诉
  return canAction.value
    && detail.value.stageType === HrmPerformanceStageType.APPEAL_CONFIRM
    && !!detail.value.id
    && !!handleStageId.value
    && (detail.value.currentStage?.canHandle !== false)
})

const showFooter = computed(() => { // 是否展示底部操作
  return canFillQuota.value
    || canTargetConfirm.value
    || canReview.value
    || canResultAudit.value
    || canConfirmResult.value
    || canAppeal.value
    || canAppealHandle.value
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  loading.value = true
  try {
    const stageId = props.stageId ? Number(props.stageId) : undefined
    const [assessmentData, records] = await Promise.all([
      getPortalPerformanceAssessment(Number(props.id), stageId),
      getPortalPerformanceAssessmentProcessRecordList(Number(props.id), stageId),
    ])
    detail.value = assessmentData
    recordList.value = records
  } finally {
    loading.value = false
  }
}

/** 制定指标 */
function handleQuota() {
  if (!detail.value.id) {
    return
  }
  uni.navigateTo({ url: `/pages-hrm/portal/performance/assessment/quota/index?id=${detail.value.id}` })
}

/** 确认绩效结果 */
async function handleConfirmResult() {
  if (!detail.value.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认当前绩效结果？确认后将进入后续流程。',
    })
    await confirmPortalPerformanceAssessmentResult({
      assessmentId: detail.value.id,
      pass: 1,
      comment: '结果确认',
    })
    toast.success('绩效结果已确认')
    await getDetail()
  } catch {}
}

/** 提交申诉 */
function handleAppeal() {
  if (!detail.value.id) {
    return
  }
  uni.navigateTo({ url: `/pages-hrm/portal/performance/assessment/appeal/index?id=${detail.value.id}` })
}

/** 目标确认 */
function handleTargetConfirm() {
  if (!detail.value.id || !handleStageId.value) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/portal/performance/assessment/target-confirm/index?id=${detail.value.id}&stageId=${handleStageId.value}`,
  })
}

/** 去评分 */
function handleReview() {
  const stageId = detail.value.currentReviewStage?.id || handleStageId.value
  if (!detail.value.id || !stageId) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/portal/performance/assessment/review/index?id=${detail.value.id}&stageId=${stageId}`,
  })
}

/** 结果审核 */
function handleResultAudit() {
  if (!detail.value.id || !handleStageId.value) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/portal/performance/assessment/handle/index?id=${detail.value.id}&stageId=${handleStageId.value}&mode=result-audit`,
  })
}

/** 申诉处理 */
function handleAppealHandle() {
  if (!detail.value.id || !handleStageId.value) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/portal/performance/assessment/handle/index?id=${detail.value.id}&stageId=${handleStageId.value}&mode=appeal`,
  })
}

/** 初始化 / 返回刷新 */
onShow(async () => {
  accessible.value = await checkHrmPortalAccess()
  if (!accessible.value) {
    return
  }
  await getDetail()
})
</script>
