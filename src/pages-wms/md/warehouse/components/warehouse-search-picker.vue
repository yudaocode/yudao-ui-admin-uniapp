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
import type { Warehouse } from '@/api/wms/md/warehouse'
import { onMounted, ref } from 'vue'
import { getSimpleWarehouseList } from '@/api/wms/md/warehouse'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '仓库',
  placeholder: '请选择仓库',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Warehouse | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<Warehouse[]>([]) // 仓库选项

/** 更新仓库编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(option => option.id === value))
}

/** 格式化仓库编号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleWarehouseList()
})
</script>
