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
import type { Product } from '@/api/crm/product'
import { onMounted, ref } from 'vue'
import { getProductSimpleList } from '@/api/crm/product'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '产品名称',
  labelWidth: '200rpx',
  placeholder: '请选择产品',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Product | undefined]
}>()

const options = ref<Product[]>([]) // 产品选项

/** 加载产品选项 */
async function loadOptions() {
  options.value = (await getProductSimpleList()).filter(item => item.id != null)
}

/** 更新产品编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择产品 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空产品 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
