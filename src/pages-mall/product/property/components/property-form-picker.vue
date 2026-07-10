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
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { ProductProperty } from '@/api/mall/product/property'
import { onMounted, ref } from 'vue'
import { getSimpleProductPropertyList } from '@/api/mall/product/property'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '所属属性',
  labelWidth: '220rpx',
  placeholder: '请选择所属属性',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProductProperty | undefined]
}>()

const options = ref<ProductProperty[]>([]) // 属性选项

/** 加载属性选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getSimpleProductPropertyList()
}

/** 更新属性 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择属性 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空属性 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
