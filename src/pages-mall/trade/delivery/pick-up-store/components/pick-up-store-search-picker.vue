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
import type { DeliveryPickUpStore } from '@/api/mall/trade/delivery/pick-up-store'
import { onMounted, ref } from 'vue'
import { getSimpleDeliveryPickUpStoreList } from '@/api/mall/trade/delivery/pick-up-store'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '自提门店',
  placeholder: '请选择自提门店',
})

const emit = defineEmits<{
  'update:modelValue': [value?: number]
  'change': [item: DeliveryPickUpStore | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<DeliveryPickUpStore[]>([]) // 自提门店选项

/** 更新自提门店 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化自提门店 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value === undefined ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleDeliveryPickUpStoreList()
})
</script>
