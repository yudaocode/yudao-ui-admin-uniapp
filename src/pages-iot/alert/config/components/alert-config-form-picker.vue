<template>
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    is-link
    :value="selectedLabel"
    :placeholder="placeholder"
    @click="handleOpen"
  />

  <wd-select-picker
    ref="pickerRef"
    v-model="selectedValue"
    :title="label"
    :columns="resolvedColumns"
    value-key="id"
    label-key="name"
    :type="type"
    filterable
    root-portal
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { AlertConfig } from '@/api/iot/alert/config'
import { computed, ref, watch } from 'vue'
import { getSimpleAlertConfigList } from '@/api/iot/alert/config'

type PickerValue = number | string | number[]

const props = withDefaults(defineProps<{
  modelValue?: number | number[] | string
  columns?: Record<string, any>[]
  label?: string
  placeholder?: string
  prop?: string
  labelWidth?: string
  type?: 'checkbox' | 'radio'
  disabled?: boolean
}>(), {
  label: '告警配置',
  placeholder: '请选择告警配置',
  prop: '',
  labelWidth: '200rpx',
  type: 'radio',
  disabled: false,
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: number | number[] | string | undefined): void
}>()

const configOptions = ref<AlertConfig[]>([]) // 告警配置选项
const selectedValue = ref<PickerValue | ''>(props.type === 'checkbox' ? [] : '') // 当前选中值
const pickerRef = ref<SelectPickerInstance>() // 告警配置选择器
const resolvedColumns = computed<Record<string, any>[]>(() => props.columns ?? configOptions.value)
const selectedLabel = computed(() => { // 当前选中展示文本
  if (Array.isArray(selectedValue.value)) {
    return selectedValue.value.map(value => findLabel(value)).filter(Boolean).join('、')
  }
  return findLabel(selectedValue.value)
})

watch(
  () => [props.modelValue, props.type] as const,
  ([value]) => {
    selectedValue.value = props.type === 'checkbox'
      ? (Array.isArray(value) ? value : [])
      : (value ?? '')
  },
  { immediate: true },
)

/** 加载告警配置选项 */
async function loadOptions() {
  if (props.columns !== undefined) {
    return
  }
  configOptions.value = await getSimpleAlertConfigList()
}

/** 查找选项文本 */
function findLabel(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  return resolvedColumns.value.find(item => String(item.id) === String(value))?.name || String(value)
}

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open()
}

/** 选择确认 */
function handleConfirm({ value }: { value: PickerValue }) {
  emit('update:modelValue', value === '' ? undefined : value)
}

watch(() => props.columns, loadOptions, { immediate: true })
</script>
