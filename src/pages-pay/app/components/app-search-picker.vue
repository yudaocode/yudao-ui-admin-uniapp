<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    label="支付应用"
    :columns="options"
    label-key="name"
    value-key="id"
    all-option
    placeholder="请选择支付应用"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { PayApp } from '@/api/pay/app'
import { onMounted, ref } from 'vue'
import { getPayAppList } from '@/api/pay/app'

const props = defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value?: number]
  'change': [name: string]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<PayApp[]>([]) // 支付应用选项

/** 更新支付应用编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', value !== undefined ? options.value.find(item => item.id === value)?.name || '' : '')
}

/** 格式化支付应用编号 */
function format(value?: number) {
  const appId = arguments.length > 0 ? value : props.modelValue
  if (appId === undefined) {
    return ''
  }
  return pickerRef.value?.format(appId) || String(appId)
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getPayAppList().catch(() => [])
})
</script>
