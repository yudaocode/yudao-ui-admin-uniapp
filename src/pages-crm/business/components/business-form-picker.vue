<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="pickerOptions"
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
import type { Business } from '@/api/crm/business'
import { computed, onMounted, ref } from 'vue'
import { getSimpleBusinessList } from '@/api/crm/business'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  customerId?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '商机名称',
  labelWidth: '200rpx',
  placeholder: '请选择商机名称',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Business | undefined]
}>()

const options = ref<Business[]>([]) // 商机选项
const pickerOptions = computed(() => { // 当前客户下的可选商机
  return props.customerId
    ? options.value.filter(item => item.customerId === props.customerId)
    : options.value
})

/** 加载商机选项 */
async function loadOptions() {
  options.value = (await getSimpleBusinessList()).filter(item => item.id != null)
}

/** 更新商机编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择商机 */
function handleConfirm(value?: number) {
  emit('change', pickerOptions.value.find(item => item.id === value))
}

/** 清空商机 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
