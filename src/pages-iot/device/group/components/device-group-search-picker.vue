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
import type { DeviceGroup } from '@/api/iot/device/group'
import { onMounted, ref } from 'vue'
import { getSimpleDeviceGroupList } from '@/api/iot/device/group'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '设备分组',
  placeholder: '请选择设备分组',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: DeviceGroup | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<DeviceGroup[]>([]) // 设备分组选项

/** 更新设备分组 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化设备分组 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleDeviceGroupList()
})
</script>
