<template>
  <wd-popup v-model="visible" position="bottom" safe-area-inset-bottom @close="visible = false">
    <view class="bg-white px-24rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ dialogTitle }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker
            v-if="!cancelMode"
            v-model="formData.result"
            label="面试结果"
            label-width="180rpx"
            prop="result"
            :columns="resultOptions"
            placeholder="请选择面试结果"
          />
          <wd-form-item
            v-if="cancelMode"
            title="取消原因"
            title-width="180rpx"
            prop="cancelReason"
            vertical
          >
            <wd-textarea
              v-model="formData.cancelReason"
              clearable
              placeholder="请输入取消原因"
              :maxlength="255"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item
            v-else
            title="面试评价"
            title-width="180rpx"
            prop="evaluate"
            vertical
          >
            <wd-textarea
              v-model="formData.evaluate"
              clearable
              placeholder="请输入面试评价"
              :maxlength="255"
              show-word-limit
            />
          </wd-form-item>
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
import type { RecruitInterview } from '@/api/hrm/recruit/interview'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { updateRecruitInterviewResult } from '@/api/hrm/recruit/interview'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { HrmRecruitInterviewResult } from '@/pages-hrm/utils/constants'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const cancelMode = ref(false) // 是否取消面试
const formData = ref({
  id: 0,
  result: HrmRecruitInterviewResult.PASS as number,
  evaluate: '',
  cancelReason: '',
})
const formSchema = createFormSchema({
  result: [{ required: () => !cancelMode.value, message: '面试结果不能为空' }],
  cancelReason: [{ required: () => cancelMode.value, message: '取消原因不能为空' }],
})
const formRef = ref<FormInstance>() // 表单引用
const dialogTitle = computed(() => cancelMode.value ? '取消面试' : '登记面试结果')
const resultOptions = computed(() => // 可登记的面试结果
  getIntDictOptions(DICT_TYPE.HRM_RECRUIT_INTERVIEW_RESULT).filter(item =>
    item.value === HrmRecruitInterviewResult.PASS
    || item.value === HrmRecruitInterviewResult.NOT_PASS,
  ),
)

/** 打开弹窗 */
function open(interview: RecruitInterview, result: number = HrmRecruitInterviewResult.PASS) {
  cancelMode.value = result === HrmRecruitInterviewResult.CANCELED
  formData.value = {
    id: interview.id!,
    result,
    evaluate: interview.evaluate ?? '',
    cancelReason: interview.cancelReason ?? '',
  }
  visible.value = true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const canceled = formData.value.result === HrmRecruitInterviewResult.CANCELED
    await updateRecruitInterviewResult({
      id: formData.value.id,
      result: formData.value.result,
      evaluate: canceled ? '' : formData.value.evaluate,
      cancelReason: canceled ? formData.value.cancelReason : '',
    })
    toast.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
