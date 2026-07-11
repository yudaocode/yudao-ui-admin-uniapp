<template>
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :is-link="!disabled"
    :value="displayValue"
    :placeholder="placeholder"
    @click="handleOpen"
  />

  <FirmwarePicker
    ref="pickerRef"
    :clearable="clearable"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { OtaFirmware } from '@/api/iot/ota/firmware'
import { computed, ref, watch } from 'vue'
import { getOtaFirmware } from '@/api/iot/ota/firmware'
import FirmwarePicker from './firmware-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '升级固件',
  labelWidth: '220rpx',
  placeholder: '请选择升级固件',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: OtaFirmware | undefined]
  'confirm': [item: OtaFirmware]
  'clear': []
}>()

const pickerRef = ref<InstanceType<typeof FirmwarePicker>>() // 固件选择器
const selectedFirmware = ref<OtaFirmware>() // 当前固件
const displayValue = computed(() => {
  if (selectedFirmware.value) {
    return [selectedFirmware.value.version, selectedFirmware.value.name].filter(Boolean).join(' / ')
  }
  return props.modelValue ? String(props.modelValue) : ''
})

/** 打开选择器 */
async function handleOpen() {
  if (props.disabled) {
    return
  }
  if (props.modelValue != null && selectedFirmware.value?.id !== props.modelValue) {
    await resolveFirmware(props.modelValue)
  }
  pickerRef.value?.open(selectedFirmware.value, props.modelValue)
}

/** 选择固件 */
function handleConfirm(item: OtaFirmware) {
  if (item.id == null) {
    return
  }
  selectedFirmware.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
  emit('confirm', item)
}

/** 清空固件 */
function handleClear() {
  if (props.disabled) {
    return
  }
  selectedFirmware.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}

/** 加载固件回显 */
async function resolveFirmware(id?: number) {
  if (id == null) {
    selectedFirmware.value = undefined
    return
  }
  if (selectedFirmware.value?.id === id) {
    return
  }
  try {
    const item = await getOtaFirmware(id)
    if (props.modelValue === id) {
      selectedFirmware.value = item
    }
  } catch {
    if (props.modelValue === id) {
      selectedFirmware.value = undefined
    }
  }
}

/** 格式化固件编号 */
function format(value?: number) {
  if (selectedFirmware.value?.id === value) {
    return [selectedFirmware.value.version, selectedFirmware.value.name].filter(Boolean).join(' / ')
  }
  return value == null ? '' : String(value)
}

defineExpose({ format })

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  value => resolveFirmware(value),
  { immediate: true },
)
</script>
