<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="deviceName"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { Device } from '@/api/iot/device/device'
import { ref, watch } from 'vue'
import { getSimpleDeviceList } from '@/api/iot/device/device'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
  deviceType?: number
  productId?: number
}>(), {
  label: '设备',
  placeholder: '请选择设备',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Device | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<Device[]>([]) // 设备选项

/** 加载设备选项 */
async function loadOptions() {
  options.value = await getSimpleDeviceList(props.deviceType, props.productId)
}

/** 更新设备编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化设备编号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

watch(() => [props.deviceType, props.productId], loadOptions, { immediate: true })

defineExpose({ format })
</script>
