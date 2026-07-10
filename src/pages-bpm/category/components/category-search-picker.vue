<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="code"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { Category } from '@/api/bpm/category'
import { onMounted, ref } from 'vue'
import { getCategorySimpleList } from '@/api/bpm/category'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
}>(), {
  label: '流程分类',
  placeholder: '请选择流程分类',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [item: Category | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<Category[]>([]) // 流程分类选项

/** 更新流程分类 */
function handleUpdate(value?: string) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.code === value))
}

/** 格式化流程分类 */
function format(value?: string) {
  return pickerRef.value?.format(value) || (value || '')
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getCategorySimpleList()
})
</script>
