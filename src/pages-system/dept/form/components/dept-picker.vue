<template>
  <wd-col-picker
    v-model="selectedValue"
    :label="label"
    label-width="180rpx"
    :columns="deptColumns"
    :column-change="handleColumnChange"
    :display-format="displayFormat"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import { onMounted, ref, watch } from 'vue'
import { getSimpleDeptList } from '@/api/system/dept'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  showRoot?: boolean // 是否显示顶级部门节点
}>(), {
  label: '上级部门',
  showRoot: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
}>()

const deptList = ref<Dept[]>([])
const deptColumns = ref<any[]>([])
const selectedValue = ref<number[]>([])

/** 监听外部值变化，回显选中值 */
watch(
  () => props.modelValue,
  (val) => {
    // 0 或 undefined 都视为顶级部门（如果允许显示顶级）
    if (val && val !== 0 && deptList.value.length > 0) {
      const path = findDeptPath(val)
      selectedValue.value = path
      // 构建列数据以支持回显
      buildColumnsForPath(path)
    } else {
      if (props.showRoot) {
        // 顶级部门或未选择，重置
        selectedValue.value = [0]
      } else {
        selectedValue.value = []
      }
      // 重新构建第一列，确保正确
      if (deptList.value.length > 0) {
        initFirstColumn()
      }
    }
  },
  { immediate: true },
)

/** 初始化第一列 */
function initFirstColumn() {
  const topDepts = deptList.value.filter(item => item.parentId === 0)
  if (props.showRoot) {
    deptColumns.value = [
      [
        { label: '顶级部门', value: 0 },
        ...topDepts.map(item => ({ value: item.id, label: item.name })),
      ],
    ]
  } else {
    deptColumns.value = [
      topDepts.map(item => ({ value: item.id, label: item.name })),
    ]
  }
}

/** 加载部门列表 */
async function loadDeptList() {
  deptList.value = await getSimpleDeptList()

  // 初始化第一列
  initFirstColumn()

  // 如果有初始值，回显
  if (props.modelValue && props.modelValue !== 0) {
    const path = findDeptPath(props.modelValue)
    selectedValue.value = path
    buildColumnsForPath(path)
  }
}

/** 查找部门路径 */
function findDeptPath(targetId: number): number[] {
  const path: number[] = []
  const findPath = (parentId: number, id: number): boolean => {
    const items = deptList.value.filter(d => d.parentId === parentId)
    for (const item of items) {
      if (item.id === id) {
        path.push(item.id)
        return true
      }
      if (findPath(item.id, id)) {
        path.unshift(item.id)
        return true
      }
    }
    return false
  }
  findPath(0, targetId)
  return path
}

/** 根据路径构建列数据 */
function buildColumnsForPath(path: number[]) {
  if (path.length === 0) {
    return
  }
  // 第一列已经有了，从第二列开始构建
  const columns = [deptColumns.value[0]]
  for (let i = 0; i < path.length - 1; i++) {
    const parentId = path[i]
    const children = deptList.value.filter(item => item.parentId === parentId)
    if (children.length > 0) {
      columns.push(children.map(item => ({ value: item.id, label: item.name })))
    }
  }
  deptColumns.value = columns
}

/** 列变化 */
function handleColumnChange({ selectedItem, resolve, finish }: any) {
  if (selectedItem.value === 0) {
    finish()
    return
  }
  const children = deptList.value.filter(item => item.parentId === selectedItem.value)
  if (children.length > 0) {
    resolve(children.map(item => ({ value: item.id, label: item.name })))
  } else {
    finish()
  }
}

/** 格式化显示 */
function displayFormat(selectedItems: any[]) {
  return selectedItems.map(item => item.label).join('/')
}

/** 确认选择 */
function handleConfirm({ value }: { value: number[] }) {
  if (value && value.length > 0) {
    emit('update:modelValue', value[value.length - 1])
  } else {
    // 如果允许 root，默认顶级 0；否则 undefined
    emit('update:modelValue', props.showRoot ? 0 : undefined)
  }
}

/** 初始化 */
onMounted(() => {
  loadDeptList()
})
</script>
