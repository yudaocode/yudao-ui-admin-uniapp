<template>
  <yd-tree-select
    :model-value="selectedValue"
    :data="options"
    :props="treeProps"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :placeholder="placeholder"
    :disabled="disabled"
    check-strictly
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { ItemCategory } from '@/api/wms/md/item/category'
import { computed, onMounted, ref } from 'vue'
import { getSimpleItemCategoryList } from '@/api/wms/md/item/category'
import { handleTree } from '@/utils/tree'

type ItemCategoryTreeItem = ItemCategory & { children?: ItemCategoryTreeItem[] }

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  showRoot?: boolean
}>(), {
  label: '商品分类',
  labelWidth: '180rpx',
  placeholder: '请选择商品分类',
  prop: '',
  disabled: false,
  showRoot: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const list = ref<ItemCategoryTreeItem[]>([]) // 商品分类列表
const treeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
} // 树字段映射
const selectedValue = computed(() => props.modelValue ?? (props.showRoot ? 0 : undefined))
const options = computed<ItemCategoryTreeItem[]>(() => { // 商品分类树形选项
  const topCategories = handleTree<ItemCategoryTreeItem>(list.value)
  return props.showRoot
    ? [{ id: 0, name: '顶级分类' }, ...topCategories]
    : topCategories
})

/** 更新商品分类编号 */
function handleUpdate(value?: number | string) {
  emit('update:modelValue', value == null ? (props.showRoot ? 0 : undefined) : Number(value))
}

/** 初始化 */
onMounted(async () => {
  list.value = await getSimpleItemCategoryList()
})
</script>
