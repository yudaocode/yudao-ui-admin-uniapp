<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    label="支付应用"
    :columns="options"
    label-key="name"
    value-key="id"
    all-option
    :all-value="0"
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
  modelValue?: number | string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | string]
  'change': [name: string]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<PayApp[]>([]) // 支付应用选项

/** 更新支付应用编号 */
function handleUpdate(value: number | string) {
  const appId = Number(value) === 0 ? 0 : value
  emit('update:modelValue', appId)
  emit('change', Number(appId) > 0 ? options.value.find(item => item.id === Number(appId))?.name || '' : '')
}

/** 格式化支付应用编号 */
function format(value?: number | string) {
  const appId = arguments.length > 0 ? value : props.modelValue
  if (appId == null || appId === '' || Number(appId) === 0) {
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
