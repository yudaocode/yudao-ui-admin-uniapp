<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="绩效评分"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <view v-if="loading && !detail.id" class="py-64rpx text-center text-26rpx text-[#999]">
        <wd-loading size="32rpx" />
        <view class="mt-12rpx">
          正在加载评分信息
        </view>
      </view>

      <view v-else class="pb-160rpx">
        <view class="bg-white px-24rpx py-24rpx">
          <view class="mb-8rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="text-34rpx text-[#333] font-semibold">
                {{ detail.employeeName || '-' }}
              </view>
              <view class="mt-8rpx text-26rpx text-[#999]">
                {{ detail.name || '-' }}
              </view>
            </view>
            <view class="shrink-0 text-right">
              <wd-tag type="warning" plain>
                {{ currentStage?.name || '待评分' }}
              </wd-tag>
              <view class="mt-8rpx text-24rpx text-[#999]">
                权重 {{ currentStage?.weight || 0 }}%
              </view>
            </view>
          </view>
        </view>

        <view v-if="detail.reviewStages?.length" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
            评分流程
          </view>
          <view
            v-for="stage in detail.reviewStages"
            :key="stage.id"
            class="mb-16rpx flex items-center justify-between gap-16rpx border-b border-[#f0f0f0] pb-16rpx last:mb-0 last:border-b-0 last:pb-0"
          >
            <view class="min-w-0 flex-1">
              <view class="text-26rpx text-[#333]">
                {{ stage.name || '-' }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ stage.handlerName || '-' }} · {{ stage.weight || 0 }}%
              </view>
            </view>
            <view class="shrink-0 text-right">
              <dict-tag
                v-if="stage.status != null"
                :type="DICT_TYPE.HRM_PERFORMANCE_ASSESSMENT_STAGE_STATUS"
                :value="stage.status"
              />
              <view class="mt-4rpx text-26rpx text-[#666]">
                {{ formatHrmScore(stage.score) }}
              </view>
            </view>
          </view>
        </view>

        <view
          v-if="currentStage?.rejectReason"
          class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] px-24rpx py-20rpx text-26rpx text-[#fa8c16]"
        >
          评分被驳回：{{ currentStage.rejectReason }}
        </view>

        <view
          v-if="scorePreview"
          class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between gap-16rpx">
            <text class="text-26rpx text-[#999]">
              本阶段试算
            </text>
            <text class="text-28rpx text-[#333] font-semibold">
              {{ formatHrmScore(scorePreview.stageScore) }} 分
              <text v-if="scorePreview.stageResultLevel" class="ml-8rpx text-24rpx text-[#1677ff]">
                {{ scorePreview.stageResultLevel }}
              </text>
            </text>
          </view>
          <view class="flex items-center justify-between gap-16rpx">
            <text class="text-26rpx text-[#999]">
              当前累计分
            </text>
            <text class="text-28rpx text-[#333] font-semibold">
              {{ formatHrmScore(scorePreview.cumulativeScore) }} 分
              <text v-if="scorePreview.cumulativeResultLevel" class="ml-8rpx text-24rpx text-[#52c41a]">
                {{ scorePreview.cumulativeResultLevel }}
              </text>
            </text>
          </view>
        </view>

        <view class="mx-24rpx mt-24rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-20rpx text-24rpx text-[#1677ff]">
          单项评分范围为 0～{{ detail.upperLimitScore ?? '-' }} 分，最多保留两位小数；总分按评分、维度权重和指标权重计算。
        </view>

        <view class="mx-24rpx mt-24rpx">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            指标评分
          </view>
          <view
            v-for="quota in detail.quotas || []"
            :key="quota.id || `${quota.dimensionId}-${quota.name}`"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
              {{ quota.dimensionName || '-' }} / {{ quota.name || '-' }}
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              目标值：{{ quota.targetValue || '-' }}
            </view>
            <view class="mb-16rpx">
              <view class="mb-8rpx text-24rpx text-[#999]">
                实际值
              </view>
              <wd-input
                v-model="quota.actualValue"
                clearable
                placeholder="实际完成情况"
                :maxlength="1000"
              />
            </view>
            <view class="mb-16rpx">
              <view class="mb-8rpx text-24rpx text-[#999]">
                评分
              </view>
              <wd-input-number
                v-model="quota.finalScore"
                :min="0"
                :max="detail.upperLimitScore"
                :precision="2"
                allow-null
                @change="schedulePreview"
              />
            </view>
            <view>
              <view class="mb-8rpx text-24rpx text-[#999]">
                评语
              </view>
              <wd-textarea
                v-model="quota.comment"
                clearable
                placeholder="指标评语"
                :maxlength="1000"
              />
            </view>
          </view>
        </view>

        <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
            {{ currentStage?.raterType === HrmPerformanceRaterType.SELF ? '自评说明' : '评分说明' }}
          </view>
          <wd-textarea
            v-model="stageComment"
            clearable
            :placeholder="currentStage?.raterType === HrmPerformanceRaterType.SELF ? '自评说明' : '评分说明'"
            :maxlength="2000"
            show-word-limit
          />
        </view>
      </view>

      <view class="yd-detail-footer">
        <view class="yd-detail-footer-actions">
          <wd-button
            v-if="canReject"
            class="flex-1"
            type="error"
            variant="plain"
            :loading="submitting"
            @click="rejectPreviousStage"
          >
            驳回上一阶段
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="submitting" @click="submitReview">
            提交评分
          </wd-button>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type {
  PortalPerformanceAssessment,
  PortalPerformanceScorePreview,
} from '@/api/hrm/portal/performance/assessment'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  getPortalPerformanceAssessment,
  previewPortalPerformanceAssessmentScore,
  rejectPortalPerformanceAssessmentReviewStage,
  scorePortalPerformanceAssessment,
} from '@/api/hrm/portal/performance/assessment'
import {
  HrmPerformanceAssessmentStageStatus,
  HrmPerformanceRaterType,
} from '@/pages-hrm/utils/constants'
import { formatHrmScore } from '@/pages-hrm/utils/format'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  id?: number | string
  stageId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const submitting = ref(false) // 提交中
const detail = ref<PortalPerformanceAssessment>({}) // 详情数据
const stageComment = ref('') // 阶段评语
const scorePreview = ref<PortalPerformanceScorePreview>() // 分数预览
let previewTimer: ReturnType<typeof setTimeout> | undefined

const currentStage = computed(() => detail.value.currentReviewStage) // 当前评分阶段
const canReject = computed(() => {
  return currentStage.value?.rejectAuthority === true
    && !!detail.value.reviewStages?.some(
      stage =>
        stage.status === HrmPerformanceAssessmentStageStatus.PROCESSED
        && (stage.sort || 0) < (currentStage.value?.sort || 0),
    )
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 预览绩效分数 */
async function previewScore() {
  const stage = currentStage.value
  const quotaList = detail.value.quotas || []
  if (
    !detail.value.id
    || !stage?.id
    || !quotaList.length
    || quotaList.some(quota => quota.finalScore === undefined || quota.finalScore === null)
  ) {
    scorePreview.value = undefined
    return
  }
  try {
    scorePreview.value = await previewPortalPerformanceAssessmentScore({
      assessmentId: detail.value.id,
      reviewStageId: stage.id,
      quotas: quotaList,
    })
  } catch {
    scorePreview.value = undefined
  }
}

/** 评分预览调度 */
function schedulePreview() {
  if (previewTimer) {
    clearTimeout(previewTimer)
  }
  previewTimer = setTimeout(() => {
    previewScore()
  }, 250)
}

/** 驳回至上一评分阶段 */
async function rejectPreviousStage() {
  const stage = currentStage.value
  if (!detail.value.id || !stage?.id) {
    return
  }
  let reason = ''
  try {
    const result = await dialog.prompt({
      title: '驳回上一评分阶段',
      msg: '请输入驳回原因',
      inputProps: { maxlength: 500, placeholder: '请输入驳回原因' },
    })
    reason = String(result.value || '').trim()
  } catch {
    return
  }
  if (!reason) {
    toast.warning('驳回原因不能为空')
    return
  }
  submitting.value = true
  try {
    await rejectPortalPerformanceAssessmentReviewStage({
      assessmentId: detail.value.id,
      reviewStageId: stage.id,
      reason,
    })
    toast.success('上一评分阶段已驳回')
    navigateBackPlus()
  } finally {
    submitting.value = false
  }
}

/** 提交绩效评分 */
async function submitReview() {
  const stage = currentStage.value
  if (!detail.value.id || !stage?.id) {
    return
  }
  const quotaList = detail.value.quotas || []
  if (
    !quotaList.length
    || quotaList.some(quota => quota.finalScore === undefined || quota.finalScore === null)
  ) {
    toast.error('请完成全部指标评分')
    return
  }
  if (stage.requiredSetting && !stageComment.value.trim()) {
    toast.error('请填写本阶段评语')
    return
  }
  submitting.value = true
  try {
    await scorePortalPerformanceAssessment({
      assessmentId: detail.value.id,
      reviewStageId: stage.id,
      comment: stageComment.value.trim(),
      selfComment:
        stage.raterType === HrmPerformanceRaterType.SELF ? stageComment.value.trim() : undefined,
      reviewerComment:
        stage.raterType === HrmPerformanceRaterType.SELF ? undefined : stageComment.value.trim(),
      quotas: quotaList,
    })
    toast.success('当前阶段评分已提交')
    navigateBackPlus()
  } finally {
    submitting.value = false
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || !props.stageId) {
    return
  }
  loading.value = true
  stageComment.value = ''
  scorePreview.value = undefined
  try {
    detail.value = await getPortalPerformanceAssessment(Number(props.id), Number(props.stageId))
    stageComment.value = detail.value.currentReviewStage?.comment || ''
    const scoreMap = new Map(
      (detail.value.currentReviewStage?.quotaScoreList || []).map(score => [
        score.assessmentQuotaId,
        score.score,
      ]),
    )
    detail.value.quotas?.forEach((quota) => {
      quota.finalScore = scoreMap.get(quota.id)
    })
    schedulePreview()
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  accessible.value = await checkHrmPortalAccess()
  if (!accessible.value) {
    return
  }
  await getDetail()
})

onUnmounted(() => {
  if (previewTimer) {
    clearTimeout(previewTimer)
  }
})
</script>
