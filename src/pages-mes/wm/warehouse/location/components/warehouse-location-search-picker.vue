<template>
  <yd-search-picker
    :model-value="pickerValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="warehouseId ? placeholder : disabledPlaceholder"
    all-option
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { WmWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { computed, ref, watch } from 'vue'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'

const props = withDefaults(defineProps<{
  modelValue?: number
  warehouseId?: number | null
  label?: string
  placeholder?: string
  disabledPlaceholder?: string
}>(), {
  label: '库区',
  placeholder: '请选择库区',
  disabledPlaceholder: '请先选择仓库',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: WmWarehouseLocation | undefined]
}>()

const options = ref<WmWarehouseLocation[]>([]) // 库区选项
const pickerValue = computed(() => props.modelValue ?? -1)

/** 加载库区选项 */
async function loadOptions() {
  if (!props.warehouseId) {
    options.value = []
    return
  }
  options.value = await getWarehouseLocationSimpleList(props.warehouseId) || []
}

/** 更新库区编号 */
function handleUpdate(value: number) {
  const locationId = value === -1 ? undefined : value
  emit('update:modelValue', locationId)
  emit('change', options.value.find(item => item.id === locationId))
}

/** 格式化库区编号 */
function format(id?: number | string) {
  if (id == null || id === '') {
    return ''
  }
  return options.value.find(item => item.id === Number(id))?.name || String(id)
}

/** 同步仓库变化 */
watch(
  () => props.warehouseId,
  () => loadOptions(),
  { immediate: true },
)

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  (value) => {
    if (value != null) {
      loadOptions()
    }
  },
)

defineExpose({ format })
</script>
