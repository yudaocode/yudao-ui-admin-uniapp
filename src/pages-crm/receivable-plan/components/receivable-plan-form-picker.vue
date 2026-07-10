<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="pickerOptions"
    label-key="displayName"
    value-key="id"
    :placeholder="placeholder"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { ReceivablePlan } from '@/api/crm/receivable/plan'
import { computed, ref, watch } from 'vue'
import { getReceivablePlanSimpleList } from '@/api/crm/receivable/plan'

interface ReceivablePlanOption extends ReceivablePlan {
  displayName: string
}

const props = withDefaults(defineProps<{
  modelValue?: number | null
  customerId?: number | null
  contractId?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
  optionFilter?: (item: ReceivablePlan) => boolean
}>(), {
  label: '回款期数',
  labelWidth: '200rpx',
  placeholder: '请选择回款期数',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ReceivablePlan | undefined]
}>()

const options = ref<ReceivablePlan[]>([]) // 回款计划选项
const pickerOptions = computed<ReceivablePlanOption[]>(() => { // 过滤后的回款计划选项
  const plans = props.optionFilter ? options.value.filter(props.optionFilter) : options.value
  return plans.map(item => ({
    ...item,
    displayName: item.period ? `第 ${item.period} 期` : String(item.id),
  }))
})
let requestId = 0

/** 加载合同下的回款计划 */
async function loadOptions([customerId, contractId]: readonly [number | null | undefined, number | null | undefined]) {
  const currentRequestId = ++requestId
  options.value = []
  if (!customerId || !contractId) {
    return
  }
  const list = await getReceivablePlanSimpleList(customerId, contractId)
  if (currentRequestId === requestId) {
    options.value = list.filter(item => item.id != null)
  }
}

/** 更新回款计划编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择回款计划 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空回款计划 */
function handleClear() {
  emit('change', undefined)
}

/** 同步客户和合同变化 */
watch(
  () => [props.customerId, props.contractId] as const,
  value => loadOptions(value),
  { immediate: true },
)
</script>
