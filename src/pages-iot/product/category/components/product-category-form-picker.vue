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
import type { ProductCategory } from '@/api/iot/product/category'
import { onMounted, ref } from 'vue'
import { getSimpleProductCategoryList } from '@/api/iot/product/category'

withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '产品分类',
  labelWidth: '220rpx',
  placeholder: '请选择产品分类',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const options = ref<ProductCategory[]>([]) // 产品分类选项

/** 加载产品分类选项 */
async function loadOptions() {
  try {
    options.value = await getSimpleProductCategoryList()
  } catch {
    options.value = []
  }
}

/** 打开前确保分类选项 */
function ensureOptions() {
  if (options.value.length === 0) {
    loadOptions()
  }
}

/** 更新产品分类编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
