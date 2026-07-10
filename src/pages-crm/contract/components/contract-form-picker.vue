<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="pickerOptions"
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
import type { Contract } from '@/api/crm/contract'
import { computed, ref, watch } from 'vue'
import { getContractSimpleList } from '@/api/crm/contract'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  customerId?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
  optionFilter?: (item: Contract) => boolean
}>(), {
  label: '合同名称',
  labelWidth: '200rpx',
  placeholder: '请选择合同名称',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Contract | undefined]
}>()

const options = ref<Contract[]>([]) // 合同选项
const pickerOptions = computed(() => { // 过滤后的合同选项
  return props.optionFilter ? options.value.filter(props.optionFilter) : options.value
})
let requestId = 0

/** 加载客户下的合同选项 */
async function loadOptions(customerId?: number | null) {
  const currentRequestId = ++requestId
  options.value = []
  if (!customerId) {
    return
  }
  const list = await getContractSimpleList(customerId)
  if (currentRequestId === requestId) {
    options.value = list.filter(item => item.id != null)
  }
}

/** 更新合同编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择合同 */
function handleConfirm(value?: number) {
  emit('change', pickerOptions.value.find(item => item.id === value))
}

/** 清空合同 */
function handleClear() {
  emit('change', undefined)
}

/** 同步客户变化 */
watch(
  () => props.customerId,
  value => loadOptions(value),
  { immediate: true },
)
</script>
