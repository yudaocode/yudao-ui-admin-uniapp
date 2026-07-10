<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="key"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { ProcessDefinition } from '@/api/bpm/definition'
import { onMounted, ref } from 'vue'
import { getProcessDefinitionList } from '@/api/bpm/definition'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
}>(), {
  label: '所属流程',
  placeholder: '请选择所属流程',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [item: ProcessDefinition | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<ProcessDefinition[]>([]) // 流程定义选项

/** 更新流程定义标识 */
function handleUpdate(value?: string) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.key === value))
}

/** 格式化流程定义标识 */
function format(value?: string) {
  return pickerRef.value?.format(value) || (value || '')
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getProcessDefinitionList({ suspensionState: 1 })
})
</script>
