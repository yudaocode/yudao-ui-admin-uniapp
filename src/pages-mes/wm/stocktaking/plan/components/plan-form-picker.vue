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
import type { StockTakingPlan } from '@/api/mes/wm/stocktaking/plan'
import { ref, watch } from 'vue'
import { getStockTakingPlan, getStockTakingPlanPage } from '@/api/mes/wm/stocktaking/plan'
import { CommonStatusEnum } from '@/utils/constants'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '盘点方案',
  labelWidth: '220rpx',
  placeholder: '请选择盘点方案',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: StockTakingPlan | undefined]
}>()

const options = ref<StockTakingPlan[]>([]) // 盘点方案选项
const optionsLoaded = ref(false) // 启用方案是否已加载

/** 合并盘点方案选项 */
function mergeOptions(rows: StockTakingPlan[]) {
  const map = new Map<number, StockTakingPlan>()
  rows.forEach((item) => {
    if (item.id != null) {
      map.set(item.id, item)
    }
  })
  options.value = Array.from(map.values())
}

/** 加载启用的盘点方案 */
async function loadOptions() {
  if (optionsLoaded.value) {
    return
  }
  const data = await getStockTakingPlanPage({
    pageNo: 1,
    pageSize: 100,
    status: CommonStatusEnum.ENABLE,
  })
  mergeOptions([...options.value, ...data.list])
  optionsLoaded.value = true
}

/** 加载当前盘点方案 */
async function loadSelectedOption(value?: number) {
  if (value == null || options.value.some(item => item.id === value)) {
    return
  }
  mergeOptions([await getStockTakingPlan(value), ...options.value])
}

/** 打开前加载选项 */
async function beforeOpenPicker() {
  await Promise.all([
    loadSelectedOption(props.modelValue),
    loadOptions(),
  ])
}

/** 更新盘点方案编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择盘点方案 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空盘点方案 */
function handleClear() {
  emit('change', undefined)
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  (value) => {
    if (value != null) {
      loadSelectedOption(value)
    }
  },
  { immediate: true },
)
</script>
