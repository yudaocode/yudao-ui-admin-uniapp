<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="type"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { DictType } from '@/api/system/dict/type'
import { onMounted, ref } from 'vue'
import { getSimpleDictTypeList } from '@/api/system/dict/type'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
}>(), {
  label: '字典类型',
  placeholder: '请选择字典类型',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [item: DictType | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<DictType[]>([]) // 字典类型选项

/** 更新字典类型 */
function handleUpdate(value?: string) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.type === value))
}

/** 格式化字典类型 */
function format(value?: string) {
  return pickerRef.value?.format(value) || value || ''
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleDictTypeList()
})
</script>
