<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :type="type"
    :filterable="filterable"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { Knowledge } from '@/api/ai/knowledge/knowledge'
import { onMounted, ref } from 'vue'
import { getSimpleKnowledgeList } from '@/api/ai/knowledge/knowledge'

const props = withDefaults(defineProps<{
  modelValue?: number | number[]
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
  type?: 'radio' | 'checkbox'
  filterable?: boolean
}>(), {
  label: '知识库',
  labelWidth: '220rpx',
  placeholder: '请选择知识库',
  prop: '',
  disabled: false,
  clearable: false,
  type: 'radio',
  filterable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  'change': [items: Knowledge[]]
}>()

const options = ref<Knowledge[]>([]) // 知识库选项

/** 更新知识库 */
function handleUpdate(value?: number | number[]) {
  emit('update:modelValue', value)
  const ids = Array.isArray(value) ? value : value == null ? [] : [value]
  emit('change', options.value.filter(item => item.id != null && ids.includes(item.id)))
}

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleKnowledgeList()
})
</script>
