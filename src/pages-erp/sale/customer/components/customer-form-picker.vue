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
import type { Customer } from '@/api/erp/sale/customer'
import { onMounted, ref } from 'vue'
import { getCustomerSimpleList } from '@/api/erp/sale/customer'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '客户',
  labelWidth: '220rpx',
  placeholder: '请选择客户',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Customer | undefined]
}>()

const options = ref<Customer[]>([]) // 客户选项

/** 加载客户选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getCustomerSimpleList()
}

/** 更新客户编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择客户 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空客户 */
function handleClear() {
  emit('change', undefined)
}

/** 同步外部绑定值 */
/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
