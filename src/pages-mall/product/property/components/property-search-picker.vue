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
import type { ProductProperty } from '@/api/mall/product/property'
import { onMounted, ref } from 'vue'
import { getSimpleProductPropertyList } from '@/api/mall/product/property'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '所属属性',
  placeholder: '请选择所属属性',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProductProperty | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<ProductProperty[]>([]) // 属性选项

/** 更新属性 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化属性 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleProductPropertyList()
})
</script>
