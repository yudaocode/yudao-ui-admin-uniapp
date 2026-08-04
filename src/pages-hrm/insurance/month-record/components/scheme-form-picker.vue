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
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { InsuranceScheme } from '@/api/hrm/insurance/scheme'
import { onMounted, ref, watch } from 'vue'
import { getInsuranceScheme, getInsuranceSchemeSimpleList } from '@/api/hrm/insurance/scheme'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '参保方案',
  labelWidth: '180rpx',
  placeholder: '请选择参保方案',
  prop: '',
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: InsuranceScheme | undefined]
}>()

const schemeList = ref<InsuranceScheme[]>([]) // 可选项
const selectedScheme = ref<InsuranceScheme>() // 当前值回显

const options = ref<InsuranceScheme[]>([]) // 选择器选项

/** 刷新选项 */
function refreshOptions() {
  const list = schemeList.value.filter(item => item.id != null)
  const current = selectedScheme.value
  if (
    current?.id == null
    || list.some(item => item.id === current.id)
  ) {
    options.value = list
    return
  }
  options.value = [current, ...list]
}

/** 加载社保方案选项 */
async function loadOptions() {
  schemeList.value = await getInsuranceSchemeSimpleList()
  await ensureSelectedScheme()
  refreshOptions()
}

/** 补充当前选中方案，支持回显 */
async function ensureSelectedScheme() {
  const schemeId = props.modelValue
  selectedScheme.value = undefined
  if (schemeId == null || schemeList.value.some(item => item.id === schemeId)) {
    selectedScheme.value = schemeList.value.find(item => item.id === schemeId)
    return
  }
  const scheme = await getInsuranceScheme(schemeId)
  if (props.modelValue === schemeId && scheme?.id === schemeId) {
    selectedScheme.value = scheme
  }
}

/** 更新方案编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择方案 */
function handleConfirm(value?: number) {
  const scheme = options.value.find(item => item.id === value)
  selectedScheme.value = scheme
  emit('change', scheme)
}

/** 清空方案 */
function handleClear() {
  selectedScheme.value = undefined
  emit('change', undefined)
}

watch(() => props.modelValue, async () => {
  await ensureSelectedScheme()
  refreshOptions()
})

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
