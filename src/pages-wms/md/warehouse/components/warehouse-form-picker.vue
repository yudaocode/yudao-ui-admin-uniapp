<template>
  <yd-form-picker
    :model-value="modelValue"
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
import type { Warehouse } from '@/api/wms/md/warehouse'
import { onMounted, ref } from 'vue'
import { getSimpleWarehouseList } from '@/api/wms/md/warehouse'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '仓库',
  labelWidth: '180rpx',
  placeholder: '请选择仓库',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'confirm': [item: Warehouse | undefined]
  'change': [item: Warehouse | undefined]
}>()

const options = ref<Warehouse[]>([]) // 仓库选项

/** 加载仓库选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getSimpleWarehouseList()
}

/** 更新仓库编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择仓库 */
function handleConfirm(value?: number) {
  const item = options.value.find(option => option.id === value)
  emit('confirm', item)
  emit('change', item)
}

/** 清空仓库 */
function handleClear() {
  emit('confirm', undefined)
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
