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
    :visible="visible"
    :title="label"
    :columns="resolvedColumns"
    value-key="id"
    label-key="deviceName"
    :type="type"
    filterable
    root-portal
    @update:visible="handleVisibleChange"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Device } from '@/api/iot/device/device'
import { computed, ref, watch } from 'vue'
import { getSimpleDeviceList } from '@/api/iot/device/device'
import { useWotSelectPicker } from '@/hooks/useWotSelectPicker'

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
  deviceType?: number
  productId?: number
}>(), {
  label: '设备',
  placeholder: '请选择设备',
  prop: '',
  labelWidth: '200rpx',
  type: 'radio',
  disabled: false,
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: number | number[] | string | undefined): void
}>()

const deviceOptions = ref<Device[]>([]) // 设备选项
const selectedValue = ref<PickerValue | ''>(props.type === 'checkbox' ? [] : '') // 当前选中值
const { pickerRef, visible, openPicker, handleVisibleChange } = useWotSelectPicker()
const resolvedColumns = computed<Record<string, any>[]>(() => props.columns ?? deviceOptions.value)
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

/** 加载设备选项 */
async function loadOptions() {
  if (props.columns !== undefined) {
    return
  }
  deviceOptions.value = await getSimpleDeviceList(props.deviceType, props.productId)
}

/** 查找选项文本 */
function findLabel(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  return resolvedColumns.value.find(item => String(item.id) === String(value))?.deviceName || String(value)
}

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  openPicker()
}

/** 选择确认 */
function handleConfirm({ value }: { value: PickerValue }) {
  emit('update:modelValue', value === '' ? undefined : value)
}

watch(() => [props.deviceType, props.productId], loadOptions, { immediate: true })
</script>
