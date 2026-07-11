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

  <WorkOrderPicker
    ref="pickerRef"
    :model-value="modelValue"
    :disabled="disabled"
    :clearable="clearable"
    :confirmed-only="confirmedOnly"
    :type="type"
    :title="title"
    :empty-tip="emptyTip"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import { computed, ref, watch } from 'vue'
import { getWorkOrder } from '@/api/mes/pro/workorder'
import WorkOrderPicker from './workorder-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
  confirmedOnly?: boolean
  type?: number
  title?: string
  emptyTip?: string
}>(), {
  label: '生产工单',
  labelWidth: '220rpx',
  placeholder: '请选择生产工单',
  prop: '',
  disabled: false,
  clearable: false,
  confirmedOnly: true,
  title: '选择生产工单',
  emptyTip: '暂无已确认工单',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProWorkOrder | undefined]
}>()

const pickerRef = ref<InstanceType<typeof WorkOrderPicker>>() // 工单选择器
const selectedItem = ref<ProWorkOrder>() // 当前工单
const displayValue = computed(() => {
  if (selectedItem.value) {
    return `${selectedItem.value.code || '-'} / ${selectedItem.value.name || '-'}`
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

/** 更新工单编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择工单 */
function handleChange(item?: ProWorkOrder) {
  selectedItem.value = item
  emit('change', item)
}

/** 加载工单回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    const item = await getWorkOrder(id)
    if (props.modelValue === id) {
      selectedItem.value = item
    }
  } catch {
    if (props.modelValue === id) {
      selectedItem.value = undefined
    }
  }
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  value => resolveItem(value),
  { immediate: true },
)
</script>
