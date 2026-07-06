<template>
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :is-link="!disabled"
    :value="displayValue"
    :placeholder="placeholder"
    @click="handleOpen"
  />

  <TaskPicker
    ref="pickerRef"
    :model-value="modelValue"
    :work-order-id="workOrderId"
    :workstation-id="workstationId"
    :statuses="statuses"
    :disabled="disabled"
    :clearable="clearable"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import type { ProTask } from '@/api/mes/pro/task'
import { computed, ref, watch } from 'vue'
import { getTask } from '@/api/mes/pro/task'
import { MesProTaskStatusEnum } from '@/utils/constants'
import TaskPicker from './task-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  workOrderId?: number
  workstationId?: number
  statuses?: number[]
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  workOrderId: undefined,
  workstationId: undefined,
  statuses: () => [MesProTaskStatusEnum.PREPARE],
  label: '生产任务',
  labelWidth: '220rpx',
  placeholder: '请选择生产任务',
  prop: '',
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProTask | undefined]
}>()

const pickerRef = ref<InstanceType<typeof TaskPicker>>() // 任务选择器
const selectedItem = ref<ProTask>() // 当前任务
const displayValue = computed(() => {
  if (selectedItem.value) {
    return `${selectedItem.value.code || '-'} / ${selectedItem.value.processName || '-'}`
  }
  return props.modelValue ? String(props.modelValue) : ''
})

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open(props.modelValue)
}

/** 更新任务编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择任务 */
function handleChange(item?: ProTask) {
  selectedItem.value = item
  emit('change', item)
}

/** 加载任务回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getTask(id)
  } catch {
    selectedItem.value = undefined
  }
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  value => resolveItem(value),
  { immediate: true },
)
</script>
