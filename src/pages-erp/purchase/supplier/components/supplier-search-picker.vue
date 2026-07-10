<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { Supplier } from '@/api/erp/purchase/supplier'
import { onMounted, ref } from 'vue'
import { getSupplierSimpleList } from '@/api/erp/purchase/supplier'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '供应商',
  placeholder: '请选择供应商',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Supplier | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<Supplier[]>([]) // 供应商选项

/** 更新供应商编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化供应商编号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSupplierSimpleList()
})
</script>
