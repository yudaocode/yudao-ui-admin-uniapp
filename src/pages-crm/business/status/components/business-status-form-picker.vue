<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
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
import type { BusinessStatus } from '@/api/crm/business/status'
import { ref, watch } from 'vue'
import { getBusinessStatusSimpleList } from '@/api/crm/business/status'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  statusTypeId?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '商机阶段',
  labelWidth: '200rpx',
  placeholder: '请选择商机阶段',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: BusinessStatus | undefined]
}>()

const options = ref<BusinessStatus[]>([]) // 商机阶段选项
let requestId = 0

/** 加载商机阶段选项 */
async function loadOptions(statusTypeId?: number | null) {
  const currentRequestId = ++requestId
  options.value = []
  if (!statusTypeId) {
    return
  }
  const list = await getBusinessStatusSimpleList(statusTypeId)
  if (currentRequestId === requestId) {
    options.value = list.filter(item => item.id != null)
  }
}

/** 更新商机阶段编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择商机阶段 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空商机阶段 */
function handleClear() {
  emit('change', undefined)
}

/** 同步商机状态组变化 */
watch(
  () => props.statusTypeId,
  value => loadOptions(value),
  { immediate: true },
)
</script>
