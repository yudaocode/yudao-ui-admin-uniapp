<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    all-option
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { DeliveryExpress } from '@/api/mall/trade/delivery/express'
import { onMounted, ref } from 'vue'
import { getSimpleDeliveryExpressList } from '@/api/mall/trade/delivery/express'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '快递公司',
  placeholder: '请选择快递公司',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [item: DeliveryExpress | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<DeliveryExpress[]>([]) // 快递公司选项

/** 更新快递公司 */
function handleUpdate(value: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化快递公司 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null || value === -1 ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleDeliveryExpressList()
})
</script>
