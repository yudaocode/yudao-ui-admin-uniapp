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
import type { WmWarehouseArea } from '@/api/mes/wm/warehouse/area'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import { getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'

const props = withDefaults(defineProps<{
  modelValue?: number
  locationId?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '库位',
  labelWidth: '220rpx',
  placeholder: '请选择库位',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: WmWarehouseArea | undefined]
}>()

const toast = useToast()
const options = ref<WmWarehouseArea[]>([]) // 库位选项

/** 加载库位选项 */
async function loadOptions() {
  if (!props.locationId) {
    options.value = []
    return
  }
  options.value = await getWarehouseAreaSimpleList(props.locationId) || []
}

/** 打开前校验库区 */
async function beforeOpenPicker() {
  if (!props.locationId) {
    toast.warning('请先选择库区')
    return false
  }
  await loadOptions()
}

/** 更新库位编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择库位 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空库位 */
function handleClear() {
  emit('change', undefined)
}

/** 同步库区变化 */
watch(
  () => props.locationId,
  () => loadOptions(),
  { immediate: true },
)
</script>
