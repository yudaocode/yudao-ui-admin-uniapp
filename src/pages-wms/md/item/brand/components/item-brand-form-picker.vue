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
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { ItemBrand } from '@/api/wms/md/item/brand'
import { onMounted, ref } from 'vue'
import { getSimpleItemBrandList } from '@/api/wms/md/item/brand'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '商品品牌',
  labelWidth: '180rpx',
  placeholder: '请选择商品品牌',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'confirm': [item: ItemBrand | undefined]
  'change': [item: ItemBrand | undefined]
}>()

const options = ref<ItemBrand[]>([]) // 商品品牌选项

/** 加载商品品牌选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getSimpleItemBrandList()
}

/** 更新商品品牌编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择商品品牌 */
function handleConfirm(value?: number) {
  const item = options.value.find(option => option.id === value)
  emit('confirm', item)
  emit('change', item)
}

/** 清空商品品牌 */
function handleClear() {
  emit('confirm', undefined)
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
