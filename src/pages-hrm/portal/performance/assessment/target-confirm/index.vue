<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="确认绩效指标"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <view v-if="loading && !detail.id" class="py-64rpx text-center text-26rpx text-[#999]">
        <wd-loading size="32rpx" />
        <view class="mt-12rpx">
          正在加载指标确认
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
            <wd-tag type="warning" plain>
              待指标确认
            </wd-tag>
          </view>
        </view>

        <wd-cell-group border>
          <wd-cell title="工号" :value="detail.jobNumber || '-'" />
          <wd-cell title="确认人" :value="detail.targetConfirmationEmployeeName || '-'" />
          <wd-cell title="指标数" :value="String(detail.quotas?.length || 0)" />
        </wd-cell-group>

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
              说明：{{ quota.description || '-' }}
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              标准：{{ quota.standard || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              权重：{{ quota.dimensionWeight || 0 }}% / {{ quota.weight || 0 }}%
            </view>
          </view>
        </view>

        <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
            确认意见
          </view>
          <wd-textarea
            v-model="comment"
            clearable
            placeholder="填写确认意见；退回时必填"
            :maxlength="1000"
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
            @click="submitConfirm(HrmPerformanceConfirmationResult.REJECT)"
          >
            退回指标
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            :loading="submitting"
            @click="submitConfirm(HrmPerformanceConfirmationResult.PASS)"
          >
            确认通过
          </wd-button>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { PortalPerformanceAssessment } from '@/api/hrm/portal/performance/assessment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  confirmPortalPerformanceAssessmentTarget,
  getPortalPerformanceAssessment,
} from '@/api/hrm/portal/performance/assessment'
import { HrmPerformanceConfirmationResult } from '@/pages-hrm/utils/constants'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'

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

const toast = useToast()
const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const submitting = ref(false) // 提交中
const detail = ref<PortalPerformanceAssessment>({}) // 详情数据
const comment = ref('') // 处理意见

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 提交目标确认 */
async function submitConfirm(pass: number) {
  if (!detail.value.id) {
    return
  }
  if (pass === HrmPerformanceConfirmationResult.REJECT && !comment.value.trim()) {
    toast.error('退回指标时请填写原因')
    return
  }
  submitting.value = true
  try {
    await confirmPortalPerformanceAssessmentTarget({
      assessmentId: detail.value.id,
      pass,
      comment: comment.value.trim()
        || (pass === HrmPerformanceConfirmationResult.PASS ? '指标确认通过' : undefined),
    })
    toast.success(pass === HrmPerformanceConfirmationResult.PASS ? '指标已确认' : '指标已退回')
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
  try {
    detail.value = await getPortalPerformanceAssessment(Number(props.id), Number(props.stageId))
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
