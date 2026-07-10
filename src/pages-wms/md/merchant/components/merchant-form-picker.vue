<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { Merchant } from '@/api/wms/md/merchant'
import { onMounted, ref } from 'vue'
import { getSimpleMerchantList } from '@/api/wms/md/merchant'
import { WmsCustomerMerchantTypeList, WmsSupplierMerchantTypeList } from '@/utils/constants'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
  customer?: boolean
  supplier?: boolean
}>(), {
  label: '往来企业',
  labelWidth: '180rpx',
  placeholder: '请选择往来企业',
  prop: '',
  disabled: false,
  clearable: false,
  customer: false,
  supplier: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'confirm': [item: Merchant | undefined]
  'change': [item: Merchant | undefined]
}>()

const options = ref<Merchant[]>([]) // 往来企业选项

/** 加载往来企业选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  const types = props.supplier
    ? WmsSupplierMerchantTypeList
    : props.customer
      ? WmsCustomerMerchantTypeList
      : undefined
  options.value = await getSimpleMerchantList(types ? { types } : undefined)
}

/** 更新往来企业编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择往来企业 */
function handleConfirm(value?: number) {
  const item = options.value.find(option => option.id === value)
  emit('confirm', item)
  emit('change', item)
}

/** 清空往来企业 */
function handleClear() {
  emit('confirm', undefined)
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
