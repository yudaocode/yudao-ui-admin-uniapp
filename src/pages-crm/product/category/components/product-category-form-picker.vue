<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="displayName"
    value-key="id"
    :placeholder="placeholder"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { ProductCategory } from '@/api/crm/product/category'
import { ref, watch } from 'vue'
import { getProductCategoryList } from '@/api/crm/product/category'

interface CategoryOption extends ProductCategory {
  displayName: string
}

const props = withDefaults(defineProps<{
  modelValue?: number | null
  includeRoot?: boolean
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  includeRoot: false,
  label: '产品分类',
  labelWidth: '200rpx',
  placeholder: '请选择产品分类',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProductCategory | undefined]
}>()

const options = ref<CategoryOption[]>([]) // 产品分类选项
let requestId = 0

/** 加载产品分类选项 */
async function loadOptions(includeRoot: boolean) {
  const currentRequestId = ++requestId
  const list = await getProductCategoryList(includeRoot ? { parentId: 0 } : undefined)
  if (currentRequestId !== requestId) {
    return
  }
  const categoryOptions = flattenOptions(list)
  options.value = includeRoot
    ? [{ id: 0, name: '顶级分类', displayName: '顶级分类' }, ...categoryOptions]
    : categoryOptions
}

/** 展平产品分类 */
function flattenOptions(list: ProductCategory[], level = 0): CategoryOption[] {
  const options: CategoryOption[] = []
  list.forEach((item) => {
    if (item.id != null) {
      options.push({ ...item, displayName: `${'  '.repeat(level)}${item.name}` })
    }
    if (item.children?.length) {
      options.push(...flattenOptions(item.children, level + 1))
    }
  })
  return options
}

/** 更新产品分类编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择产品分类 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空产品分类 */
function handleClear() {
  emit('change', undefined)
}

/** 同步是否包含顶级分类 */
watch(
  () => props.includeRoot,
  value => loadOptions(value),
  { immediate: true },
)
</script>
