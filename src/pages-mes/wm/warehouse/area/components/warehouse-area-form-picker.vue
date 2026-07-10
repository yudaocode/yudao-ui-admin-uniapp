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
  modelValue?: number | null
  locationId?: number | null
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
const loading = ref(false) // 库位选项加载状态

/** 加载库位选项 */
async function loadOptions() {
  const locationId = props.locationId
  if (!locationId) {
    options.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    const list = await getWarehouseAreaSimpleList(locationId) || []
    if (locationId === props.locationId) {
      options.value = list
    }
  } finally {
    if (locationId === props.locationId) {
      loading.value = false
    }
  }
}

/** 打开前校验库区 */
function beforeOpenPicker() {
  if (!props.locationId) {
    toast.warning('请先选择库区')
    return false
  }
  if (loading.value) {
    toast.show('库位加载中')
    return false
  }
  return true
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
