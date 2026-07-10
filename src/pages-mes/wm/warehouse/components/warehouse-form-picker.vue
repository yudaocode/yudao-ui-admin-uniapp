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
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { WmWarehouse } from '@/api/mes/wm/warehouse'
import { onMounted, ref } from 'vue'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '仓库',
  labelWidth: '220rpx',
  placeholder: '请选择仓库',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: WmWarehouse | undefined]
}>()

const options = ref<WmWarehouse[]>([]) // 仓库选项

/** 加载仓库选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getWarehouseSimpleList() || []
}

/** 更新仓库编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择仓库 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空仓库 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
