<template>
  <wd-col-picker
    v-model="selectedValue"
    label="上级菜单"
    label-width="180rpx"
    :columns="menuColumns"
    :column-change="handleColumnChange"
    :display-format="displayFormat"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Menu } from '@/api/system/menu'
import { onMounted, ref, watch } from 'vue'
import { getSimpleMenuList } from '@/api/system/menu'
import { SystemMenuTypeEnum } from '@/utils/constants'

const props = defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const menuList = ref<Menu[]>([])
const menuColumns = ref<any[]>([])
const selectedValue = ref<number[]>([])

/** 监听外部值变化，回显选中值 */
watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined && val !== 0 && menuList.value.length > 0) {
      const path = findMenuPath(val)
      selectedValue.value = path
      buildColumnsForPath(path)
    } else {
      selectedValue.value = [0]
    }
  },
)

/** 加载菜单列表 */
async function loadMenuList() {
  const list = await getSimpleMenuList()
  // 只保留目录和菜单
  menuList.value = list.filter(item => item.type !== SystemMenuTypeEnum.BUTTON)
  // 构建第一列数据（主类目 + 顶级菜单）
  const topMenus = menuList.value.filter(item => item.parentId === 0)
  menuColumns.value = [[
    { value: 0, label: '主类目' },
    ...topMenus.map(item => ({ value: item.id, label: item.name })),
  ]]
  // 如果有初始值，回显
  if (props.modelValue !== undefined && props.modelValue !== 0) {
    const path = findMenuPath(props.modelValue)
    selectedValue.value = path
    buildColumnsForPath(path)
  } else {
    selectedValue.value = [0]
  }
}

/** 查找菜单路径 */
function findMenuPath(targetId: number): number[] {
  if (targetId === 0) {
    return [0]
  }
  const path: number[] = []
  const findPath = (parentId: number, id: number): boolean => {
    const items = menuList.value.filter(m => m.parentId === parentId)
    for (const item of items) {
      if (item.id === id) {
        path.push(item.id!)
        return true
      }
      if (findPath(item.id!, id)) {
        path.unshift(item.id!)
        return true
      }
    }
    return false
  }
  findPath(0, targetId)
  return path.length > 0 ? path : [0]
}

/** 根据路径构建列数据 */
function buildColumnsForPath(path: number[]) {
  if (path.length === 0 || (path.length === 1 && path[0] === 0)) {
    return
  }
  // 第一列已经有了，从第二列开始构建
  const columns = [menuColumns.value[0]]
  for (let i = 0; i < path.length; i++) {
    const parentId = path[i]
    if (parentId === 0) {
      continue
    }
    const children = menuList.value.filter(item => item.parentId === parentId)
    if (children.length > 0) {
      columns.push(children.map(item => ({ value: item.id, label: item.name })))
    }
  }
  menuColumns.value = columns
}

/** 列变化 */
function handleColumnChange({ selectedItem, resolve, finish }: any) {
  if (selectedItem.value === 0) {
    // 选择主类目，结束
    finish()
    return
  }
  const children = menuList.value.filter(item => item.parentId === selectedItem.value)
  if (children.length > 0) {
    resolve(children.map(item => ({ value: item.id, label: item.name })))
  } else {
    finish()
  }
}

/** 格式化显示 */
function displayFormat(selectedItems: any[]) {
  return selectedItems.map(item => item.label).join(' / ')
}

/** 确认选择 */
function handleConfirm({ value }: { value: number[] }) {
  if (value && value.length > 0) {
    emit('update:modelValue', value[value.length - 1])
  } else {
    emit('update:modelValue', 0)
  }
}

/** 初始化 */
onMounted(() => {
  loadMenuList()
})
</script>
