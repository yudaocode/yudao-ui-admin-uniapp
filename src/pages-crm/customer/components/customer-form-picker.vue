<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { Customer } from '@/api/crm/customer'
import { onMounted, ref } from 'vue'
import { getCustomerSimpleList } from '@/api/crm/customer'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '客户名称',
  labelWidth: '200rpx',
  placeholder: '请选择客户名称',
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
  options.value = (await getCustomerSimpleList()).filter(item => item.id != null)
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

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
