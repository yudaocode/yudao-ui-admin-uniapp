<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { ItemBrand } from '@/api/wms/md/item/brand'
import { onMounted, ref } from 'vue'
import { getSimpleItemBrandList } from '@/api/wms/md/item/brand'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '商品品牌',
  placeholder: '请选择商品品牌',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ItemBrand | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<ItemBrand[]>([]) // 商品品牌选项

/** 更新商品品牌编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(option => option.id === value))
}

/** 格式化商品品牌编号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleItemBrandList()
})
</script>
