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
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { ProductSpu } from '@/api/mall/product/spu'
import { onMounted, ref } from 'vue'
import { getSimpleProductSpuList } from '@/api/mall/product/spu'

withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '商品',
  labelWidth: '220rpx',
  placeholder: '请选择商品',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProductSpu | undefined]
}>()

const options = ref<ProductSpu[]>([]) // 商品选项

/** 加载商品选项 */
async function loadOptions() {
  try {
    options.value = await getSimpleProductSpuList()
  } catch {
    options.value = []
  }
}

/** 打开前确保商品选项 */
function ensureOptions() {
  if (options.value.length === 0) {
    loadOptions()
  }
}

/** 更新商品编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择商品 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
