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
import type { ToolVO } from '@/api/ai/model/tool'
import { onMounted, ref } from 'vue'
import { getToolSimpleList } from '@/api/ai/model/tool'

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
  label: '工具',
  labelWidth: '220rpx',
  placeholder: '请选择工具',
  prop: '',
  disabled: false,
  clearable: false,
  type: 'radio',
  filterable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  'change': [items: ToolVO[]]
}>()

const options = ref<ToolVO[]>([]) // 工具选项

/** 更新工具 */
function handleUpdate(value?: number | number[]) {
  emit('update:modelValue', value)
  const ids = Array.isArray(value) ? value : value == null ? [] : [value]
  emit('change', options.value.filter(item => item.id != null && ids.includes(item.id)))
}

/** 初始化 */
onMounted(async () => {
  options.value = await getToolSimpleList()
})
</script>
