<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    :before-open="ensureOptions"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { ProductUnit } from '@/api/erp/product/unit'
import { onMounted, ref } from 'vue'
import { getProductUnitSimpleList } from '@/api/erp/product/unit'

withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '单位',
  labelWidth: '220rpx',
  placeholder: '请选择单位',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const options = ref<ProductUnit[]>([]) // 产品单位选项

/** 加载产品单位选项 */
async function loadOptions() {
  try {
    options.value = await getProductUnitSimpleList()
  } catch {
    options.value = []
  }
}

/** 打开前确保单位选项 */
function ensureOptions() {
  if (options.value.length === 0) {
    loadOptions()
  }
}

/** 更新产品单位编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
