<template>
  <wd-form-item
    v-if="!clearable"
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :is-link="!disabled"
    :value="displayValue"
    :placeholder="placeholder"
    @click="handleOpen"
  />
  <wd-form-item
    v-else
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    center
  >
    <view class="min-w-0 flex flex-1 items-center justify-end gap-12rpx">
      <view class="min-w-0 flex-1 truncate text-right text-28rpx" :class="displayValue ? 'text-[#333]' : 'text-[#999]'" @click="handleOpen">
        {{ displayValue || placeholder }}
      </view>
      <wd-button v-if="modelValue != null" size="small" variant="plain" :disabled="disabled" @click.stop="handleClear">
        清空
      </wd-button>
    </view>
  </wd-form-item>

  <PlanPicker ref="pickerRef" @confirm="handleConfirm" />
</template>

<script lang="ts" setup>
import type { StockTakingPlan } from '@/api/mes/wm/stocktaking/plan'
import { computed, ref, watch } from 'vue'
import { getStockTakingPlan } from '@/api/mes/wm/stocktaking/plan'
import PlanPicker from './plan-picker.vue'

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
  'confirm': [value: number | undefined]
  'clear': []
}>()

const pickerRef = ref<InstanceType<typeof PlanPicker>>() // 盘点方案选择器
const selectedPlan = ref<StockTakingPlan>() // 当前盘点方案
const displayValue = computed(() => {
  if (selectedPlan.value) {
    return selectedPlan.value.name || selectedPlan.value.code || '-'
  }
  return props.modelValue ? String(props.modelValue) : ''
})

/** 打开选择器 */
async function handleOpen() {
  if (props.disabled) {
    return
  }
  if (props.modelValue != null && selectedPlan.value?.id !== props.modelValue) {
    await resolvePlan(props.modelValue)
  }
  pickerRef.value?.open(selectedPlan.value)
}

/** 选择盘点方案 */
function handleConfirm(item: StockTakingPlan) {
  if (item.id == null) {
    return
  }
  selectedPlan.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
  emit('confirm', item.id)
}

/** 清空盘点方案 */
function handleClear() {
  if (props.disabled) {
    return
  }
  selectedPlan.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}

/** 加载盘点方案回显 */
async function resolvePlan(id?: number) {
  if (id == null) {
    selectedPlan.value = undefined
    return
  }
  if (selectedPlan.value?.id === id) {
    return
  }
  try {
    const item = await getStockTakingPlan(id)
    if (props.modelValue === id) {
      selectedPlan.value = item
    }
  } catch {
    if (props.modelValue === id) {
      selectedPlan.value = undefined
    }
  }
}

/** 格式化盘点方案 */
function format(value?: number) {
  if (selectedPlan.value?.id === value) {
    return selectedPlan.value.name || selectedPlan.value.code || String(value)
  }
  return value == null ? '' : String(value)
}

defineExpose({ format })

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  value => resolvePlan(value),
  { immediate: true },
)
</script>
