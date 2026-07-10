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
import type { Product } from '@/api/iot/product/product'
import { ref, watch } from 'vue'
import { getSimpleProductList } from '@/api/iot/product/product'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  deviceType?: number
}>(), {
  label: '产品',
  placeholder: '请选择产品',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Product | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<Product[]>([]) // 产品选项

/** 加载产品选项 */
async function loadOptions() {
  options.value = await getSimpleProductList(props.deviceType)
}

/** 更新产品编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化产品编号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

watch(() => props.deviceType, loadOptions, { immediate: true })

defineExpose({ format })
</script>
