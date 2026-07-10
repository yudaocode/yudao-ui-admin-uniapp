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
import type { Merchant } from '@/api/wms/md/merchant'
import { onMounted, ref } from 'vue'
import { getSimpleMerchantList } from '@/api/wms/md/merchant'
import { WmsCustomerMerchantTypeList, WmsSupplierMerchantTypeList } from '@/utils/constants'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  customer?: boolean
  supplier?: boolean
}>(), {
  label: '往来企业',
  placeholder: '请选择往来企业',
  customer: false,
  supplier: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Merchant | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<Merchant[]>([]) // 往来企业选项

/** 更新往来企业编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(option => option.id === value))
}

/** 格式化往来企业编号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  const types = props.supplier
    ? WmsSupplierMerchantTypeList
    : props.customer
      ? WmsCustomerMerchantTypeList
      : undefined
  options.value = await getSimpleMerchantList(types ? { types } : undefined)
})
</script>
