<template>
  <wd-popup v-model="visible" position="bottom" safe-area-inset-bottom @close="visible = false">
    <view class="bg-white px-24rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ dialogTitle }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item v-if="formType === 'batch'" title="候选人数" title-width="180rpx">
            <text>{{ candidateIds.length }} 人</text>
          </wd-form-item>
          <yd-form-picker
            v-model="formData.type"
            label="面试方式"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.HRM_RECRUIT_INTERVIEW_TYPE"
            placeholder="请选择面试方式"
          />
          <wd-form-item title="面试时间" title-width="180rpx" prop="interviewTime">
            <wd-datetime-picker
              v-model="interviewTimePicker"
              type="datetime"
              placeholder="请选择面试时间"
            />
          </wd-form-item>
          <EmployeeFormPicker
            v-model="formData.interviewEmployeeId"
            label="主面试官"
            prop="interviewEmployeeId"
            placeholder="请选择主面试官"
            :entry-status="HrmEmployeeEntryStatus.ACTIVE"
          />
          <EmployeeFormPicker
            v-model="formData.otherInterviewEmployeeIds"
            type="checkbox"
            label="其他面试官"
            prop="otherInterviewEmployeeIds"
            placeholder="请选择其他面试官"
            :entry-status="HrmEmployeeEntryStatus.ACTIVE"
          />
          <wd-form-item title="面试地址" title-width="180rpx" prop="address">
            <wd-input v-model="formData.address" clearable placeholder="请输入面试地址" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx" prop="remark" vertical>
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
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
import { ref } from 'vue'
import {
  createRecruitInterview,
  updateRecruitInterview,
} from '@/api/hrm/recruit/interview'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { executeBatch } from '@/pages-hrm/utils/batch'
import {
  HrmEmployeeEntryStatus,
  HrmRecruitInterviewType,
} from '@/pages-hrm/utils/constants'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'

type FormType = 'create' | 'update' | 'batch'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const dialogTitle = ref('安排面试') // 弹窗标题
const formLoading = ref(false) // 表单提交状态
const formType = ref<FormType>('create') // 表单类型
const candidateIds = ref<number[]>([]) // 候选人编号数组
const interviewTimePicker = ref<string | number>('') // 面试时间本地值
const formData = ref<RecruitInterview>({
  id: undefined,
  candidateId: undefined,
  type: HrmRecruitInterviewType.VIDEO,
  interviewEmployeeId: undefined,
  otherInterviewEmployeeIds: [],
  interviewTime: undefined,
  address: '',
  remark: '',
})
const formSchema = createFormSchema({
  type: [{ required: true, message: '面试方式不能为空' }],
  interviewEmployeeId: [{ required: true, message: '主面试官不能为空' }],
  interviewTime: [{
    validator: () => {
      if (!interviewTimePicker.value) {
        return '面试时间不能为空'
      }
      return true
    },
  }],
})
const formRef = ref<FormInstance>() // 表单引用

/** 打开弹窗 */
function open(
  type: FormType,
  candidateIdOrIds: number | number[],
  interview?: RecruitInterview,
  createTitle = '安排面试',
) {
  const isBatch = Array.isArray(candidateIdOrIds)
  formType.value = type
  candidateIds.value = isBatch ? [...candidateIdOrIds] : [candidateIdOrIds]
  dialogTitle.value = type === 'update'
    ? '更改面试安排'
    : type === 'batch'
      ? '批量安排面试'
      : createTitle
  formData.value = {
    id: undefined,
    candidateId: candidateIds.value[0],
    type: HrmRecruitInterviewType.VIDEO,
    interviewEmployeeId: undefined,
    otherInterviewEmployeeIds: [],
    interviewTime: undefined,
    address: '',
    remark: '',
  }
  interviewTimePicker.value = ''
  if (interview) {
    formData.value = {
      ...interview,
      otherInterviewEmployeeIds: interview.otherInterviewEmployeeIds ?? [],
    }
    interviewTimePicker.value = interview.interviewTime
      ? Number(interview.interviewTime)
      : ''
  }
  visible.value = true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formData.value.interviewTime = interviewTimePicker.value
    ? Number(interviewTimePicker.value)
    : undefined
  formLoading.value = true
  try {
    if (formType.value === 'update') {
      await updateRecruitInterview(formData.value)
      toast.success('修改成功')
    } else if (formType.value === 'batch') {
      const hasSuccess = await executeBatch(
        candidateIds.value.map(candidateId =>
          createRecruitInterview({ ...formData.value, candidateId }),
        ),
      )
      if (!hasSuccess) {
        return
      }
    } else {
      await createRecruitInterview({
        ...formData.value,
        candidateId: candidateIds.value[0],
      })
      toast.success('安排成功')
    }
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
