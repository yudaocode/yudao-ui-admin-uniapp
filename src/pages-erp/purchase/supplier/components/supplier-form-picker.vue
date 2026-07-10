<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { Supplier } from '@/api/erp/purchase/supplier'
import { onMounted, ref } from 'vue'
import { getSupplierSimpleList } from '@/api/erp/purchase/supplier'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '供应商',
  labelWidth: '220rpx',
  placeholder: '请选择供应商',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Supplier | undefined]
}>()

const options = ref<Supplier[]>([]) // 供应商选项

/** 加载供应商选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getSupplierSimpleList()
}

/** 更新供应商编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择供应商 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空供应商 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
