<template>
  <yd-search-picker
    :model-value="pickerValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    all-option
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { WmWarehouse } from '@/api/mes/wm/warehouse'
import { computed, onMounted, ref, watch } from 'vue'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'

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
  'change': [item: WmWarehouse | undefined]
}>()

const options = ref<WmWarehouse[]>([]) // 仓库选项
const pickerValue = computed(() => props.modelValue)

/** 加载仓库选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getWarehouseSimpleList() || []
}

/** 更新仓库编号 */
function handleUpdate(value?: number) {
  const warehouseId = value
  emit('update:modelValue', warehouseId)
  emit('change', options.value.find(item => item.id === warehouseId))
}

/** 格式化仓库编号 */
function format(id?: number | string) {
  if (id == null || id === '') {
    return ''
  }
  return options.value.find(item => item.id === Number(id))?.name || String(id)
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  (value) => {
    if (value != null) {
      loadOptions()
    }
  },
  { immediate: true },
)

/** 初始化 */
onMounted(() => {
  loadOptions()
})

defineExpose({ format })
</script>
