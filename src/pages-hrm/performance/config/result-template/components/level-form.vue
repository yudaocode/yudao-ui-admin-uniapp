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
          <wd-form-item title="等级" prop="name" title-width="180rpx">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入等级"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="最低分数" prop="minScore" title-width="180rpx">
            <wd-input-number
              v-model="formData.minScore"
              allow-null
              :min="0"
              :max="100"
              :precision="2"
            />
          </wd-form-item>
          <wd-form-item title="最高分数" prop="maxScore" title-width="180rpx">
            <wd-input-number
              v-model="formData.maxScore"
              allow-null
              :min="0"
              :max="100"
              :precision="2"
            />
          </wd-form-item>
          <wd-form-item title="绩效系数" prop="coefficient" title-width="180rpx">
            <wd-input-number
              v-model="formData.coefficient"
              allow-null
              :min="0"
              :precision="2"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-16rpx text-24rpx text-[#999]">
        分数区间须从 0 到 100 连续且不重叠；绩效系数不小于 0，分数和系数最多保留两位小数。
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
import type { ResultLevel } from '@/api/hrm/performance/config/result-template'
import { computed, ref } from 'vue'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{
  confirm: [level: ResultLevel]
}>()

const visible = ref(false) // 弹窗显示
const editing = ref(false) // 是否编辑
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<ResultLevel>(createDefaultLevel()) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '等级名称不能为空' }],
  minScore: [{ required: true, message: '最低分数不能为空' }],
  maxScore: [{ required: true, message: '最高分数不能为空' }],
  coefficient: [{ required: true, message: '绩效系数不能为空' }],
})
const title = computed(() => editing.value ? '编辑结果等级' : '新增结果等级')

/** 打开弹窗 */
function open(level?: ResultLevel) {
  editing.value = !!level
  formData.value = level
    ? { ...level }
    : createDefaultLevel()
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
    name: formData.value.name.trim(),
    minScore: Number(formData.value.minScore),
    maxScore: Number(formData.value.maxScore),
    coefficient: Number(formData.value.coefficient),
  })
  visible.value = false
}

/** 创建默认等级 */
function createDefaultLevel(): ResultLevel {
  return {
    name: '',
    minScore: 0,
    maxScore: 0,
    coefficient: 1,
  }
}
</script>
