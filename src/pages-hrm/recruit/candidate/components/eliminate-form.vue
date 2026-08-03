<template>
  <wd-popup v-model="visible" position="bottom" safe-area-inset-bottom @close="visible = false">
    <view class="bg-white px-24rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="候选人" title-width="180rpx">
            <text>{{ candidateLabel }}</text>
          </wd-form-item>
          <yd-form-picker
            v-model="formData.eliminate"
            label="淘汰原因"
            label-width="180rpx"
            prop="eliminate"
            :columns="reasonOptions"
            label-key="label"
            value-key="value"
            placeholder="请选择或输入淘汰原因"
            filterable
          />
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
        <wd-button class="flex-1" type="danger" :loading="formLoading" @click="handleSubmit">
          确认淘汰
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { eliminateRecruitCandidate } from '@/api/hrm/recruit/candidate'
import { getRecruitEliminateReasonList } from '@/api/hrm/recruit/config'
import { createFormSchema } from '@/utils/wot'
import { executeBatch } from '@/pages-hrm/utils/batch'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const batchMode = ref(false) // 是否批量淘汰
const candidateIds = ref<number[]>([]) // 候选人编号数组
const candidateName = ref('') // 单个候选人姓名
const reasonOptions = ref<{ label: string, value: string }[]>([]) // 淘汰原因选项
const formData = ref({
  eliminate: undefined as string | undefined,
  remark: '',
})
const formSchema = createFormSchema({
  eliminate: [{ required: true, message: '淘汰原因不能为空' }],
})
const formRef = ref<FormInstance>() // 表单引用
const title = computed(() => batchMode.value ? '批量淘汰候选人' : '淘汰候选人')
const candidateLabel = computed(() =>
  batchMode.value ? `已选择 ${candidateIds.value.length} 人` : (candidateName.value || '-'),
)

/** 打开弹窗 */
async function open(ids: number | number[], name = '') {
  const isBatch = Array.isArray(ids)
  batchMode.value = isBatch
  candidateIds.value = isBatch ? [...ids] : [ids]
  candidateName.value = name
  formData.value = { eliminate: undefined, remark: '' }
  visible.value = true
  const reasons = await getRecruitEliminateReasonList()
  reasonOptions.value = reasons.map(item => ({ label: item, value: item }))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !formData.value.eliminate) {
    return
  }
  formLoading.value = true
  try {
    if (!batchMode.value) {
      await eliminateRecruitCandidate({
        id: candidateIds.value[0],
        eliminate: formData.value.eliminate,
        remark: formData.value.remark,
      })
      toast.success('淘汰成功')
    } else {
      const hasSuccess = await executeBatch(
        candidateIds.value.map(id => eliminateRecruitCandidate({
          id,
          eliminate: formData.value.eliminate!,
          remark: formData.value.remark,
        })),
      )
      if (!hasSuccess) {
        return
      }
    }
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
