<template>
  <yd-tree-select
    v-model="selectedValue"
    :data="menuOptions"
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
import type { Menu } from '@/api/system/menu'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleMenuList } from '@/api/system/menu'
import { SystemMenuTypeEnum } from '@/utils/constants'
import { handleTree } from '@/utils/tree'

const props = withDefaults(defineProps<{
  disabled?: boolean
  label?: string
  labelWidth?: string
  modelValue?: number
  placeholder?: string
  prop?: string
}>(), {
  disabled: false,
  label: '上级菜单',
  labelWidth: '180rpx',
  placeholder: '请选择菜单',
  prop: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const menuList = ref<Menu[]>([]) // 菜单列表
const selectedValue = ref<number | undefined>(0) // 当前选中菜单编号
const treeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
} // 树字段映射

const menuOptions = computed(() => { // 菜单树形选项
  return [
    { id: 0, name: '主类目' },
    ...handleTree(menuList.value),
  ]
})

/** 监听外部值变化，回显选中值 */
watch(
  () => props.modelValue,
  (val) => {
    selectedValue.value = val ?? 0
  },
  { immediate: true },
)

/** 监听选中值变化，更新外部值 */
watch(selectedValue, (value) => {
  emit('update:modelValue', value === undefined ? 0 : Number(value))
})

/** 加载菜单列表 */
async function loadMenuList() {
  const list = await getSimpleMenuList()
  // 只保留目录和菜单
  menuList.value = list.filter(item => item.type !== SystemMenuTypeEnum.BUTTON)
}

/** 初始化 */
onMounted(() => {
  loadMenuList()
})
</script>
