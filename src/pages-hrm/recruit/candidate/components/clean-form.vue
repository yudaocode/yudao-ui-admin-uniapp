<template>
  <wd-popup v-model="visible" position="bottom" safe-area-inset-bottom @close="visible = false">
    <view class="bg-white px-24rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        一键清理候选人
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker
            v-model="formData.statuses"
            label="候选人状态"
            label-width="180rpx"
            prop="statuses"
            type="checkbox"
            :columns="cleanStatusOptions"
            placeholder="请选择候选人状态"
          />
          <yd-form-picker
            v-model="formData.days"
            label="持续天数"
            label-width="180rpx"
            prop="days"
            :columns="dayOptions"
            placeholder="请选择持续天数"
          />
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="danger" :loading="formLoading" @click="handleSubmit">
          确认清理
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  eliminateRecruitCandidate,
  getCleanRecruitCandidateIdList,
} from '@/api/hrm/recruit/candidate'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { executeBatch } from '@/pages-hrm/utils/batch'
import { HrmRecruitCandidateStatus } from '@/pages-hrm/utils/constants'

const emit = defineEmits<{
  success: []
}>()

const dialog = useDialog()
const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const cleanStatuses: number[] = [ // 允许一键清理的候选人状态
  HrmRecruitCandidateStatus.NEW,
  HrmRecruitCandidateStatus.PRIMARY_PASS,
  HrmRecruitCandidateStatus.INTERVIEW,
  HrmRecruitCandidateStatus.INTERVIEW_PASS,
]
const dayOptions = [3, 5, 7, 15, 30, 45].map(days => ({
  label: `${days} 天`,
  value: days,
})) // 状态持续天数选项
const cleanStatusOptions = computed(() =>
  getIntDictOptions(DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS).filter(item =>
    cleanStatuses.includes(item.value),
  ),
)
const formData = ref({
  statuses: [...cleanStatuses] as number[],
  days: 30 as number | undefined,
})
const formSchema = createFormSchema({
  statuses: [{ required: true, message: '候选人状态不能为空' }],
  days: [{ required: true, message: '状态持续天数不能为空' }],
})
const formRef = ref<FormInstance>() // 表单引用

/** 打开弹窗 */
function open() {
  formData.value = {
    statuses: [...cleanStatuses],
    days: 30,
  }
  visible.value = true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !formData.value.statuses?.length || formData.value.days == null) {
    return
  }
  formLoading.value = true
  try {
    const ids = await getCleanRecruitCandidateIdList(formData.value.statuses, formData.value.days)
    if (!ids.length) {
      toast.warning('暂无可清理候选人')
      return
    }
    try {
      await dialog.confirm({
        title: '提示',
        msg: `确认将 ${ids.length} 位候选人移至已淘汰状态吗？`,
      })
    } catch {
      return
    }
    const hasSuccess = await executeBatch(
      ids.map(id => eliminateRecruitCandidate({
        id,
        eliminate: '长期未跟进',
        remark: `状态持续 ${formData.value.days} 天，由一键清理操作淘汰`,
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
