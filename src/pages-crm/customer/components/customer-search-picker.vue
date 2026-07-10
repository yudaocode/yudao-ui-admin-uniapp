<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { Customer } from '@/api/crm/customer'
import { onMounted, ref } from 'vue'
import { getCustomerSimpleList } from '@/api/crm/customer'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '客户名称',
  placeholder: '请选择客户名称',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Customer | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<Customer[]>([]) // 客户选项

/** 加载客户选项 */
async function loadOptions() {
  options.value = (await getCustomerSimpleList()).filter(item => item.id != null)
}

/** 更新客户编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化客户 */
function format(value?: number | null) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
