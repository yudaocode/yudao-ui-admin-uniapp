<template>
  <yd-tree-select
    :model-value="modelValue"
    :data="options"
    :props="treeProps"
    :label="label"
    :label-width="labelWidth"
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
  disabled?: boolean
}>(), {
  label: '商品分类',
  labelWidth: '180rpx',
  placeholder: '请选择商品分类',
  disabled: false,
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
const options = computed(() => handleTree<ItemCategoryTreeItem>(list.value)) // 商品分类树形选项

/** 更新商品分类编号 */
function handleUpdate(value?: number | string) {
  emit('update:modelValue', value == null ? undefined : Number(value))
}

/** 格式化商品分类编号 */
function format(value?: number) {
  return value == null ? '' : list.value.find(item => item.id === value)?.name || String(value)
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  list.value = await getSimpleItemCategoryList()
})
</script>
