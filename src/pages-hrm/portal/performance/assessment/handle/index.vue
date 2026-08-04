<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="pageTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <view v-if="loading && !detail.id" class="py-64rpx text-center text-26rpx text-[#999]">
        <wd-loading size="32rpx" />
        <view class="mt-12rpx">
          正在加载处理信息
        </view>
      </view>

      <view v-else class="pb-160rpx">
        <wd-cell-group border>
          <wd-cell title="考核名称" :value="detail.name || '-'" />
          <wd-cell title="被考核人" :value="detail.employeeName || '-'" />
          <wd-cell title="工号" :value="detail.jobNumber || '-'" />
          <wd-cell title="当前节点" :value="detail.currentStage?.name || '-'" />
          <wd-cell title="绩效得分" :value="formatHrmScore(detail.score)" />
          <wd-cell title="绩效等级" :value="detail.resultLevel || '-'" />
        </wd-cell-group>

        <template v-if="isAppealMode">
          <wd-cell-group border>
            <wd-cell title="申诉原因" :value="detail.appealReason || '-'" />
            <wd-cell title="申诉时间" :value="formatDateTime(detail.appealSubmitTime) || '-'" />
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
        </template>

        <view class="mx-24rpx mt-24rpx">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            绩效指标
          </view>
          <view
            v-for="quota in detail.quotas || []"
            :key="quota.id || `${quota.dimensionId}-${quota.name}`"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-8rpx text-28rpx text-[#333] font-semibold">
              {{ quota.dimensionName || '-' }} / {{ quota.name || '-' }}
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              目标：{{ quota.targetValue || '-' }} · 实际：{{ quota.actualValue || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              最终分：{{ formatHrmScore(quota.finalScore) }}
            </view>
          </view>
        </view>

        <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
            {{ isAppealMode ? '申诉评分节点' : '退回评分节点' }}
          </view>
          <view v-if="isAppealMode" class="mb-16rpx text-26rpx text-[#666]">
            {{ appealReviewStageNames || '-' }}
          </view>
          <wd-checkbox-group v-else v-model="reviewStageIds">
            <wd-checkbox
              v-for="stage in completedReviewStages"
              :key="stage.id"
              :name="stage.id!"
              shape="square"
            >
              {{ stage.name || '评分阶段' }}
              <text v-if="stage.handlerName">
                （{{ stage.handlerName }}）
              </text>
            </wd-checkbox>
          </wd-checkbox-group>

          <view class="mb-16rpx mt-24rpx text-28rpx text-[#333] font-semibold">
            处理意见
          </view>
          <wd-textarea
            v-model="comment"
            clearable
            placeholder="请输入处理意见"
            :maxlength="500"
            show-word-limit
          />
        </view>
      </view>

      <view class="yd-detail-footer">
        <view class="yd-detail-footer-actions">
          <wd-button
            class="flex-1"
            type="error"
            variant="plain"
            :loading="submitting"
            @click="submitForm(false)"
          >
            驳回
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            :loading="submitting"
            @click="submitForm(true)"
          >
            通过
          </wd-button>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { PortalPerformanceAssessment } from '@/api/hrm/portal/performance/assessment'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  getPortalPerformanceAssessment,
  handlePortalPerformanceAssessmentAppeal,
  handlePortalPerformanceAssessmentResultAudit,
} from '@/api/hrm/portal/performance/assessment'
import {
  HrmPerformanceAssessmentStageStatus,
  HrmPerformanceConfirmationResult,
} from '@/pages-hrm/utils/constants'
import { formatHrmScore } from '@/pages-hrm/utils/format'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { getFileNameFromUrl, openAttachment } from '@/utils/download'

const props = defineProps<{
  id?: number | string
  stageId?: number | string
  mode?: string
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
const reviewStageIds = ref<number[]>([]) // 评分阶段编号
const comment = ref('') // 处理意见

const isAppealMode = computed(() => props.mode === 'appeal') // 申诉处理模式
const pageTitle = computed(() => (isAppealMode.value ? '绩效申诉确认' : '绩效结果审核'))
const completedReviewStages = computed(() =>
  (detail.value.reviewStages || []).filter(
    stage => stage.id != null && stage.status === HrmPerformanceAssessmentStageStatus.PROCESSED,
  ),
)
const appealReviewStageNames = computed(() => {
  const selectedIds = new Set(detail.value.appealReviewStageIds || [])
  return completedReviewStages.value
    .filter(stage => stage.id != null && selectedIds.has(stage.id))
    .map(stage => stage.name || '评分阶段')
    .join('、')
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 处理当前绩效阶段 */
async function submitForm(pass: boolean) {
  if (!detail.value.id || !detail.value.currentStage?.id) {
    return
  }
  if (!pass && !isAppealMode.value && !reviewStageIds.value.length) {
    toast.warning('请选择需要退回的评分节点')
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认${pass ? '通过' : '驳回'}当前${pageTitle.value}？`,
    })
    submitting.value = true
    const data = {
      assessmentId: detail.value.id,
      stageId: detail.value.currentStage.id,
      pass: pass ? HrmPerformanceConfirmationResult.PASS : HrmPerformanceConfirmationResult.REJECT,
      comment: comment.value.trim() || undefined,
      reviewStageIds: !pass && !isAppealMode.value ? reviewStageIds.value : undefined,
    }
    if (isAppealMode.value) {
      await handlePortalPerformanceAssessmentAppeal(data)
    } else {
      await handlePortalPerformanceAssessmentResultAudit(data)
    }
    toast.success(`${pageTitle.value}处理成功`)
    navigateBackPlus()
  } catch {
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
  try {
    detail.value = await getPortalPerformanceAssessment(Number(props.id), Number(props.stageId))
    const latestStage = completedReviewStages.value[completedReviewStages.value.length - 1]
    reviewStageIds.value = latestStage?.id ? [latestStage.id] : []
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
</script>
