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
import type { Knowledge } from '@/api/ai/knowledge/knowledge'
import { onMounted, ref } from 'vue'
import { getSimpleKnowledgeList } from '@/api/ai/knowledge/knowledge'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '知识库',
  placeholder: '请选择知识库',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Knowledge | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<Knowledge[]>([]) // 知识库选项

/** 更新知识库 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化知识库 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleKnowledgeList()
})
</script>
