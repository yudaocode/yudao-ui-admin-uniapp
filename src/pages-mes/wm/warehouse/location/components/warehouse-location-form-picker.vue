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
    :before-open="beforeOpenPicker"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { WmWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'

const props = withDefaults(defineProps<{
  modelValue?: number
  warehouseId?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '库区',
  labelWidth: '220rpx',
  placeholder: '请选择库区',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: WmWarehouseLocation | undefined]
}>()

const toast = useToast()
const options = ref<WmWarehouseLocation[]>([]) // 库区选项

/** 加载库区选项 */
async function loadOptions() {
  if (!props.warehouseId) {
    options.value = []
    return
  }
  options.value = await getWarehouseLocationSimpleList(props.warehouseId) || []
}

/** 打开前校验仓库 */
async function beforeOpenPicker() {
  if (!props.warehouseId) {
    toast.warning('请先选择仓库')
    return false
  }
  await loadOptions()
}

/** 更新库区编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择库区 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空库区 */
function handleClear() {
  emit('change', undefined)
}

/** 同步仓库变化 */
watch(
  () => props.warehouseId,
  () => loadOptions(),
  { immediate: true },
)
</script>
