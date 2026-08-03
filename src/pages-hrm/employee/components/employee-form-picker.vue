<template>
  <EmployeePicker
    ref="pickerRef"
    :model-value="modelValue"
    :type="type"
    :title="label || placeholder"
    :disabled="disabled"
    :entry-status="entryStatus"
    :disabled-ids="disabledIds"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
  >
    <template #default="{ value }">
      <wd-form-item
        :title="label"
        :title-width="labelWidth"
        :prop="prop || undefined"
        :is-link="!disabled"
        :value="value"
        :placeholder="placeholder"
      />
    </template>
  </EmployeePicker>
</template>

<script lang="ts" setup>
import type { Employee } from '@/api/hrm/employee'
import { ref } from 'vue'
import EmployeePicker from './employee-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number | number[]
  type?: 'radio' | 'checkbox'
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  entryStatus?: number
  disabledIds?: number[]
}>(), {
  type: 'radio',
  label: '员工',
  labelWidth: '180rpx',
  placeholder: '请选择员工',
  prop: '',
  disabled: false,
  disabledIds: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  'confirm': [employees: Employee[]]
}>()

const pickerRef = ref<InstanceType<typeof EmployeePicker>>() // 员工选择器

/** 更新员工编号 */
function handleUpdate(value: number | number[] | undefined) {
  emit('update:modelValue', value)
}

/** 确认员工选择 */
function handleConfirm(employees: Employee[]) {
  emit('confirm', employees)
}

/** 格式化员工编号 */
function format(value?: number | number[]) {
  return arguments.length > 0 ? pickerRef.value?.format(value) || '' : pickerRef.value?.format() || ''
}

defineExpose({ format, open: () => pickerRef.value?.open() })
</script>
