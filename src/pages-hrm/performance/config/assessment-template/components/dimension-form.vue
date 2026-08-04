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
          <wd-form-item title="维度名称" prop="name" title-width="180rpx">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入维度名称"
              :maxlength="50"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.quotaType"
            label="指标类型"
            label-width="180rpx"
            prop="quotaType"
            :columns="quotaTypeColumns"
            placeholder="请选择指标类型"
          />
          <wd-form-item title="维度权重" prop="weight" title-width="180rpx">
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
          <wd-form-item title="备注" prop="remark" title-width="180rpx" vertical>
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item title="允许员工填写" prop="allowEdit" title-width="220rpx">
            <wd-switch v-model="formData.allowEdit" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-16rpx text-24rpx text-[#999]">
        勾选后，员工在制定指标时可以为当前考核维度添加指标
      </view>
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
import type { AssessmentDimension } from '@/api/hrm/performance/assessment'
import { computed, ref } from 'vue'
import { HrmPerformanceQuotaType } from '@/pages-hrm/utils/constants'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{
  confirm: [dimension: AssessmentDimension]
}>()

const visible = ref(false) // 弹窗显示
const editing = ref(false) // 是否编辑
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<AssessmentDimension>(createDefaultDimension()) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '维度名称不能为空' }],
  quotaType: [{ required: true, message: '指标类型不能为空' }],
  weight: [{ required: true, message: '维度权重不能为空' }],
})
const title = computed(() => editing.value ? '编辑考核维度' : '新增考核维度')
const quotaTypeColumns = [ // 指标类型选项
  { label: '业绩指标', value: HrmPerformanceQuotaType.PERFORMANCE },
  { label: '行为态度指标', value: HrmPerformanceQuotaType.BEHAVIOR },
]

/** 打开弹窗 */
function open(dimension?: AssessmentDimension) {
  editing.value = !!dimension
  formData.value = dimension
    ? {
        ...dimension,
        allowEdit: dimension.allowEdit ?? false,
        quotas: (dimension.quotas || []).map(quota => ({ ...quota })),
      }
    : createDefaultDimension()
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
    remark: formData.value.remark?.trim(),
  })
  visible.value = false
}

/** 创建默认考核维度 */
function createDefaultDimension(): AssessmentDimension {
  return {
    name: '',
    quotaType: HrmPerformanceQuotaType.PERFORMANCE,
    weight: undefined,
    remark: '',
    allowEdit: false,
    quotas: [],
  }
}
</script>
