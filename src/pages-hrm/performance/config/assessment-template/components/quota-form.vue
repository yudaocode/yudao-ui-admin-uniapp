<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    closable
    safe-area-inset-bottom
    @close="visible = false"
  >
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="指标名称" prop="name" title-width="180rpx">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入指标名称"
              :maxlength="50"
            />
          </wd-form-item>
          <wd-form-item title="指标说明" prop="illustrate" title-width="180rpx" vertical>
            <wd-textarea
              v-model="formData.illustrate"
              clearable
              placeholder="请输入指标说明"
              :maxlength="200"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item title="考核标准" prop="standard" title-width="180rpx" vertical>
            <wd-textarea
              v-model="formData.standard"
              clearable
              placeholder="请输入考核标准"
              :maxlength="200"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item title="指标权重" prop="weight" title-width="180rpx">
            <view class="flex items-center justify-end gap-8rpx">
              <wd-input-number
                v-model="formData.weight"
                allow-null
                :min="0"
                :max="100"
                :precision="2"
              />
              <text class="text-28rpx text-[#999]">%</text>
            </view>
          </wd-form-item>
          <yd-form-picker
            v-model="formData.scoreType"
            label="评分方式"
            label-width="180rpx"
            prop="scoreType"
            :columns="scoreTypeColumns"
            placeholder="请选择评分方式"
          />
          <wd-form-item title="默认目标值" prop="targetValue" title-width="180rpx">
            <text v-if="props.targetValueReadonly" class="text-28rpx text-[#333]">
              {{ formData.targetValue || '-' }}
            </text>
            <wd-input
              v-else
              v-model="formData.targetValue"
              clearable
              :placeholder="isCompletionRateQuota(formData.scoreType) ? '大于 0 的数字' : '选填'"
              :maxlength="200"
            />
          </wd-form-item>
        </wd-cell-group>
        <view v-if="isCompletionRateQuota(formData.scoreType)" class="mt-16rpx text-24rpx text-[#999] leading-36rpx">
          完成率得分 = min(实际值 ÷ 目标值, 1) × 评分上限，由系统计算；系统制定指标或不可编辑维度的完成率指标必须配置默认目标值。
        </view>
        <view v-if="props.targetValueReadonly" class="mt-8rpx text-24rpx text-[#999] leading-36rpx">
          计划中的默认目标值仅供查看，如需修改请调整考核模板。
        </view>
      </wd-form>
      <view class="mt-32rpx">
        <wd-button type="primary" block @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AssessmentQuota } from '@/api/hrm/performance/assessment'
import { computed, ref } from 'vue'
import { HrmPerformanceQuotaScoreType } from '@/pages-hrm/utils/constants'
import { isCompletionRateQuota, isValidTargetValue } from '@/pages-hrm/utils/performance'
import { createFormSchema } from '@/utils/wot'

const props = withDefaults(defineProps<{
  targetValueReadonly?: boolean // 默认目标值是否只读：计划中以考核模板为准
}>(), {
  targetValueReadonly: false,
})
const emit = defineEmits<{
  confirm: [quota: AssessmentQuota]
}>()

const visible = ref(false) // 弹窗显示
const editing = ref(false) // 是否编辑
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<AssessmentQuota>(createDefaultQuota()) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '指标名称不能为空' }],
  standard: [{ required: true, message: '考核标准不能为空' }],
  weight: [{ required: true, message: '指标权重不能为空' }],
  scoreType: [{ required: true, message: '评分方式不能为空' }],
  targetValue: [{
    validator: (value, model) => !isCompletionRateQuota(model.scoreType) || !String(value ?? '').trim()
      || isValidTargetValue(String(value)) || '完成率指标的默认目标值必须是大于 0 的数字',
  }],
})
const title = computed(() => editing.value ? '编辑考核指标' : '新增考核指标')
const scoreTypeColumns = [ // 评分方式选项
  { label: '直接输入', value: HrmPerformanceQuotaScoreType.DIRECT_INPUT },
  { label: '完成率', value: HrmPerformanceQuotaScoreType.COMPLETION_RATE },
]

/** 打开弹窗 */
function open(quota?: AssessmentQuota) {
  editing.value = !!quota
  formData.value = quota ? { ...quota } : createDefaultQuota()
  visible.value = true
}
defineExpose({ open })

/** 确认 */
async function handleConfirm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  emit('confirm', {
    ...formData.value,
    name: formData.value.name?.trim(),
    illustrate: formData.value.illustrate?.trim(),
    standard: formData.value.standard?.trim(),
    targetValue: formData.value.targetValue?.trim(),
  })
  visible.value = false
}

/** 创建默认考核指标 */
function createDefaultQuota(): AssessmentQuota {
  return {
    name: '',
    illustrate: '',
    standard: '',
    weight: undefined,
    scoreType: HrmPerformanceQuotaScoreType.DIRECT_INPUT,
    targetValue: '',
  }
}
</script>
