<template>
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :disabled="disabled"
    is-link
    :value="selectedLabel"
    :placeholder="placeholder"
    @click="handleOpen"
  />

  <wd-select-picker
    v-model="selectedId"
    v-model:visible="visible"
    :title="label"
    :columns="warehouseList"
    value-key="id"
    label-key="name"
    type="radio"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Warehouse } from '@/api/wms/md/warehouse'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleWarehouseList } from '@/api/wms/md/warehouse'

const props = withDefaults(defineProps<{
  disabled?: boolean
  label?: string
  labelWidth?: string
  modelValue?: number
  placeholder?: string
  prop?: string
}>(), {
  disabled: false,
  label: '仓库',
  labelWidth: '180rpx',
  placeholder: '请选择仓库',
  prop: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'confirm', warehouse?: Warehouse): void
  (e: 'change', warehouse?: Warehouse): void
}>()

const warehouseList = ref<Warehouse[]>([]) // 仓库列表
const selectedId = ref<number | string>('') // 当前选中仓库编号
const visible = ref(false) // 选择器显示状态

const selectedLabel = computed(() => {
  if (!selectedId.value) {
    return ''
  }
  return warehouseList.value.find(item => item.id === Number(selectedId.value))?.name || ''
})

watch(
  () => props.modelValue,
  (value) => {
    selectedId.value = value ?? ''
  },
  { immediate: true },
)

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  visible.value = true
}

/** 加载仓库列表 */
async function loadWarehouseList() {
  warehouseList.value = await getSimpleWarehouseList()
}

/** 选择确认 */
function handleConfirm({ value }: { value: any }) {
  const warehouseId = value ? Number(value) : undefined
  const warehouse = warehouseList.value.find(item => item.id === warehouseId)
  emit('update:modelValue', warehouseId)
  emit('confirm', warehouse)
  emit('change', warehouse)
}

/** 初始化 */
onMounted(() => {
  loadWarehouseList()
})
</script>
