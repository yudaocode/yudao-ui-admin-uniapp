<template>
  <view class="fc-transfer">
    <wd-form-item
      :title="rule.title"
      :title-width="titleWidth"
      :prop="rule.field"
      :value="displayValue"
      :placeholder="placeholder"
      :is-link="!disabled"
      @click="open"
    />

    <wd-select-picker
      ref="pickerRef"
      v-model="pickerValue"
      :title="rule.title || '请选择'"
      :columns="columns"
      :filter-placeholder="rule.props?.filterPlaceholder || '搜索选项'"
      custom-content-class="fc-transfer__content"
      filterable
      label-key="label"
      type="checkbox"
      value-key="value"
      @open="emit('open')"
      @close="emit('close')"
      @cancel="emit('cancel')"
      @confirm="handleConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { NormalizedFormCreateRule } from '../../../../types/typing'
import { computed, nextTick, ref, watch } from 'vue'
import { getPlaceholder } from '../core/utils'

type TransferValue = string | number

interface TransferOption {
  disabled?: boolean
  label: string
  value: TransferValue
}

defineOptions({
  name: 'FcTransfer',
})

const props = defineProps<{
  disabled?: boolean
  modelValue?: any
  rule: NormalizedFormCreateRule
  titleWidth?: string | number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TransferValue[]]
  'cancel': []
  'change': [value: TransferValue[]]
  'close': []
  'confirm': [value: TransferValue[]]
  'open': []
}>()

const pickerValue = ref<TransferValue[]>([])
const pickerRef = ref<SelectPickerInstance>() // 穿梭框选择器

const placeholder = computed(() => getPlaceholder(props.rule, '请选择'))
const columns = computed(() => normalizeOptions(props.rule.props?.data || props.rule.options || []))
const displayValue = computed(() => {
  const values = normalizeValue(props.modelValue)
  if (values.length === 0) {
    return ''
  }
  const labels = values.map(value => getOptionLabel(value)).filter(Boolean)
  const visibleLabels = labels.slice(0, 2).join('、')
  return values.length > 2 ? `${visibleLabels} 等 ${values.length}项` : visibleLabels
})

watch(
  () => props.modelValue,
  () => {
    pickerValue.value = normalizeValue(props.modelValue)
  },
  { deep: true, immediate: true },
)

async function open() {
  if (props.disabled) {
    return
  }
  pickerValue.value = normalizeValue(props.modelValue)
  await nextTick()
  pickerRef.value?.open()
}

function handleConfirm({ value }: { value: any }) {
  const nextValue = Array.isArray(value) ? value : []
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
  emit('confirm', nextValue)
}

function normalizeOptions(list: unknown): TransferOption[] {
  if (!Array.isArray(list)) {
    return []
  }
  return list
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return undefined
      }
      const option = item as Record<string, any>
      const value = option.value ?? option.key ?? option.id
      if (value === undefined || value === null || value === '') {
        return undefined
      }
      return {
        disabled: option.disabled,
        label: String(option.label ?? option.text ?? option.name ?? option.title ?? value),
        value,
      }
    })
    .filter(Boolean) as TransferOption[]
}

function normalizeValue(value: any): TransferValue[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(item => item !== undefined && item !== null && item !== '')
}

function getOptionLabel(value: TransferValue) {
  const option = columns.value.find(item => String(item.value) === String(value))
  return option?.label || String(value)
}
</script>
