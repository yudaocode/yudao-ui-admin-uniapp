<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="提交绩效申诉"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <view v-if="loading" class="py-64rpx text-center text-26rpx text-[#999]">
        <wd-loading size="32rpx" />
        <view class="mt-12rpx">
          正在加载申诉信息
        </view>
      </view>

      <view v-else class="pb-160rpx">
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="退回评分节点" prop="reviewStageIds" vertical>
              <wd-checkbox-group v-model="formData.reviewStageIds">
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
            </wd-form-item>
            <wd-form-item title="申诉原因" prop="appealReason" vertical>
              <wd-textarea
                v-model="formData.appealReason"
                clearable
                placeholder="请输入申诉原因"
                :maxlength="500"
                show-word-limit
              />
            </wd-form-item>
            <wd-form-item title="申诉附件" prop="appealFileUrls" vertical>
              <yd-upload-file
                v-model="formData.appealFileUrls"
                directory="hrm/performance/appeal"
                :limit="1"
                :file-size="20"
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </view>

      <view class="yd-detail-footer">
        <view class="yd-detail-footer-actions">
          <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
            提交申诉
          </wd-button>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { PerformanceAssessmentStage } from '@/api/hrm/performance/assessment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  getPortalPerformanceAssessment,
  submitPortalPerformanceAssessmentAppeal,
} from '@/api/hrm/portal/performance/assessment'
import { HrmPerformanceAssessmentStageStatus } from '@/pages-hrm/utils/constants'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | string
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
const formLoading = ref(false) // 表单提交状态
const formRef = ref<any>() // 表单引用
const completedReviewStages = ref<PerformanceAssessmentStage[]>([]) // 已完成的评分阶段
const formData = ref({
  assessmentId: undefined as number | undefined,
  appealReason: '',
  appealFileUrls: [] as string[],
  reviewStageIds: [] as number[],
})
const formSchema = createFormSchema({
  reviewStageIds: [{ required: true, message: '请选择需要退回的评分节点' }],
  appealReason: [{ required: true, message: '申诉原因不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !formData.value.assessmentId) {
    return
  }
  formLoading.value = true
  try {
    await submitPortalPerformanceAssessmentAppeal({
      assessmentId: formData.value.assessmentId,
      appealReason: formData.value.appealReason,
      appealFileUrls: formData.value.appealFileUrls,
      reviewStageIds: formData.value.reviewStageIds,
    })
    toast.success('绩效申诉已提交')
    navigateBackPlus()
  } finally {
    formLoading.value = false
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  loading.value = true
  formData.value.assessmentId = Number(props.id)
  try {
    const assessment = await getPortalPerformanceAssessment(Number(props.id))
    completedReviewStages.value = (assessment.reviewStages || []).filter(
      stage => stage.id != null && stage.status === HrmPerformanceAssessmentStageStatus.PROCESSED,
    )
    const latestStage = completedReviewStages.value[completedReviewStages.value.length - 1]
    formData.value.reviewStageIds = latestStage?.id ? [latestStage.id] : []
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
