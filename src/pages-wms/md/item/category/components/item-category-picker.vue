<template>
  <yd-tree-select
    v-model="selectedValue"
    :data="categoryOptions"
    :props="treeProps"
    :label="label"
    :label-width="labelWidth"
    :prop="prop || undefined"
    :placeholder="placeholder"
    :disabled="disabled"
    check-strictly
  />
</template>

<script lang="ts" setup>
import type { ItemCategory } from '@/api/wms/md/item/category'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleItemCategoryList } from '@/api/wms/md/item/category'
import { handleTree } from '@/utils/tree'

type ItemCategoryTreeItem = ItemCategory & { children?: ItemCategoryTreeItem[] }

const props = withDefaults(defineProps<{
  disabled?: boolean
  label?: string
  labelWidth?: string
  modelValue?: number
  placeholder?: string
  prop?: string
  showRoot?: boolean
}>(), {
  disabled: false,
  label: '商品分类',
  labelWidth: '180rpx',
  placeholder: '请选择商品分类',
  prop: '',
  showRoot: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
}>()

const categoryList = ref<ItemCategoryTreeItem[]>([]) // 分类列表
const selectedValue = ref<number | undefined>(props.showRoot ? 0 : undefined) // 当前选中分类编号
const treeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
} // 树字段映射

/** 分类树形选项 */
const categoryOptions = computed<ItemCategoryTreeItem[]>(() => {
  const topCategories = handleTree<ItemCategoryTreeItem>(categoryList.value)
  return props.showRoot
    ? [{ id: 0, name: '顶级分类' }, ...topCategories]
    : topCategories
})

watch(
  () => props.modelValue,
  (value) => {
    selectedValue.value = value ?? (props.showRoot ? 0 : undefined)
  },
  { immediate: true },
)

watch(selectedValue, (value) => {
  emit('update:modelValue', value === undefined ? (props.showRoot ? 0 : undefined) : Number(value))
})

/** 加载分类列表 */
async function loadCategoryList() {
  categoryList.value = await getSimpleItemCategoryList()
}

/** 初始化 */
onMounted(() => {
  loadCategoryList()
})
</script>
