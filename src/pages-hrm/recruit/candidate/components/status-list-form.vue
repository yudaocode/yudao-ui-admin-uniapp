<template>
  <wd-popup v-model="visible" position="bottom" safe-area-inset-bottom @close="visible = false">
    <view class="bg-white px-24rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        批量流转候选人
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="候选人数" title-width="180rpx">
            <text>{{ candidateIds.length }} 人</text>
          </wd-form-item>
          <yd-form-picker
            v-model="formData.status"
            label="目标状态"
            label-width="180rpx"
            prop="status"
            :columns="statusOptions"
            placeholder="请选择目标状态"
          />
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { computed, ref } from 'vue'
import { updateRecruitCandidateStatus } from '@/api/hrm/recruit/candidate'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { executeBatch } from '@/pages-hrm/utils/batch'
import {
  HrmRecruitCandidateStatus,
} from '@/pages-hrm/utils/constants'
import type { HrmRecruitCandidateStatusValue } from '@/pages-hrm/utils/constants'

const emit = defineEmits<{
  success: []
}>()

const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const candidateIds = ref<number[]>([]) // 候选人编号数组
const sourceStatus = ref<HrmRecruitCandidateStatusValue>() // 当前候选人状态
const formData = ref({
  status: undefined as number | undefined,
})
const formSchema = createFormSchema({
  status: [{ required: true, message: '目标状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单引用

const statusTransitionMap: Partial<Record<HrmRecruitCandidateStatusValue, HrmRecruitCandidateStatusValue[]>> = { // 可直接批量流转的候选人状态
  [HrmRecruitCandidateStatus.NEW]: [
    HrmRecruitCandidateStatus.PRIMARY_PASS,
    HrmRecruitCandidateStatus.INTERVIEW_PASS,
  ],
  [HrmRecruitCandidateStatus.PRIMARY_PASS]: [
    HrmRecruitCandidateStatus.NEW,
    HrmRecruitCandidateStatus.INTERVIEW_PASS,
  ],
  [HrmRecruitCandidateStatus.INTERVIEW_PASS]: [
    HrmRecruitCandidateStatus.OFFER_SENT,
    HrmRecruitCandidateStatus.NEW,
    HrmRecruitCandidateStatus.PRIMARY_PASS,
  ],
  [HrmRecruitCandidateStatus.ELIMINATED]: [HrmRecruitCandidateStatus.NEW],
}

const statusOptions = computed(() => {
  const statusValues = sourceStatus.value ? statusTransitionMap[sourceStatus.value] || [] : []
  return getIntDictOptions(DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS).filter(item =>
    statusValues.includes(item.value as HrmRecruitCandidateStatusValue),
  )
})

/** 打开弹窗 */
function open(ids: number[], status: HrmRecruitCandidateStatusValue) {
  candidateIds.value = [...ids]
  sourceStatus.value = status
  formData.value = { status: undefined }
  visible.value = true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || formData.value.status == null) {
    return
  }
  formLoading.value = true
  try {
    const hasSuccess = await executeBatch(
      candidateIds.value.map(id => updateRecruitCandidateStatus({
        id,
        status: formData.value.status!,
      })),
    )
    if (!hasSuccess) {
      return
    }
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
