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
    all-option
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { InsuranceScheme } from '@/api/hrm/insurance/scheme'
import { onMounted, ref } from 'vue'
import { getInsuranceSchemeSimpleList } from '@/api/hrm/insurance/scheme'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '参保方案',
  placeholder: '请选择参保方案',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: InsuranceScheme | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<InsuranceScheme[]>([]) // 方案选项

/** 加载社保方案选项 */
async function loadOptions() {
  options.value = (await getInsuranceSchemeSimpleList()).filter(item => item.id != null)
}

/** 更新方案编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化方案 */
function format(value?: number | null) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
