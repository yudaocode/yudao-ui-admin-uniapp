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
import type { AlertConfig } from '@/api/iot/alert/config'
import { onMounted, ref } from 'vue'
import { getSimpleAlertConfigList } from '@/api/iot/alert/config'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '告警配置',
  placeholder: '请选择告警配置',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: AlertConfig | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<AlertConfig[]>([]) // 告警配置选项

/** 更新告警配置 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化告警配置 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleAlertConfigList()
})
</script>
