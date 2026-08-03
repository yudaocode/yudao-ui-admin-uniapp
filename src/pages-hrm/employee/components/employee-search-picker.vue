<template>
  <view class="yd-search-form-item" @click="open">
    <view class="yd-search-form-label">
      {{ label }}
    </view>
    <view class="flex items-center justify-between">
      <text :class="displayValue ? 'text-[#333]' : 'text-[#bfbfbf]'">
        {{ displayValue || placeholder }}
      </text>
      <view class="flex items-center gap-8rpx">
        <wd-icon
          v-if="displayValue"
          name="close-circle-filled"
          size="32rpx"
          color="#c8c9cc"
          @click.stop="handleClear"
        />
        <wd-icon name="arrow-right" size="32rpx" color="#c8c9cc" />
      </view>
    </view>
  </view>

  <EmployeePicker
    ref="pickerRef"
    :model-value="modelValue"
    type="radio"
    :title="label"
    :entry-status="entryStatus"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Employee } from '@/api/hrm/employee'
import { computed, ref } from 'vue'
import EmployeePicker from './employee-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  entryStatus?: number
}>(), {
  label: '员工',
  placeholder: '请选择员工',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Employee | undefined]
}>()

const pickerRef = ref<InstanceType<typeof EmployeePicker>>() // 员工选择器
const selectedName = ref('') // 已选展示名

const displayValue = computed(() => selectedName.value || pickerRef.value?.format(props.modelValue) || '')

/** 打开选择器 */
function open() {
  pickerRef.value?.open()
}

/** 更新员工编号 */
function handleUpdate(value: number | number[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value
  emit('update:modelValue', next)
}

/** 确认员工选择 */
function handleConfirm(employees: Employee[]) {
  selectedName.value = employees[0]?.name || ''
  emit('change', employees[0])
}

/** 清空员工 */
function handleClear() {
  selectedName.value = ''
  emit('update:modelValue', undefined)
  emit('change', undefined)
}

/** 格式化员工 */
function format(value?: number | null) {
  return pickerRef.value?.format(value ?? undefined) || (value == null ? '' : String(value))
}

defineExpose({ format })
</script>
