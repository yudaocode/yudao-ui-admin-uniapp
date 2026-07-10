<template>
  <yd-tree-select
    :model-value="selectedValue"
    :data="deptOptions"
    :props="treeProps"
    :label="label"
    :label-width="labelWidth"
    :prop="prop || undefined"
    :placeholder="placeholder"
    :disabled="disabled"
    check-strictly
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import { computed, onMounted, ref } from 'vue'
import { getSimpleDeptList } from '@/api/system/dept'
import { handleTree } from '@/utils/tree'

interface DeptOption {
  id?: number
  name: string
  children?: DeptOption[]
}

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  showRoot?: boolean
}>(), {
  label: '上级部门',
  labelWidth: '180rpx',
  placeholder: '请选择部门',
  prop: '',
  disabled: false,
  showRoot: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [value: number | undefined]
}>()

const deptList = ref<Dept[]>([]) // 部门选项
const selectedValue = computed(() => props.modelValue ?? (props.showRoot ? 0 : undefined)) // 当前选择值
const treeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
} // 树字段映射
const deptOptions = computed<DeptOption[]>(() => { // 部门树形选项
  const departments = handleTree<DeptOption>(deptList.value)
  return props.showRoot ? [{ id: 0, name: '顶级部门' }, ...departments] : departments
})
let loadingPromise: Promise<void> | undefined // 部门列表加载请求

/** 同步部门编号 */
function handleUpdate(value: number | string | undefined) {
  emit('update:modelValue', normalizeDeptId(value))
}

/** 部门变更 */
function handleChange(value: number | string | undefined) {
  emit('change', normalizeDeptId(value))
}

/** 标准化部门编号 */
function normalizeDeptId(value: number | string | undefined) {
  return value == null ? (props.showRoot ? 0 : undefined) : Number(value)
}

/** 加载部门选项 */
async function loadDeptList() {
  if (!loadingPromise) {
    loadingPromise = getSimpleDeptList()
      .then((list) => {
        deptList.value = list
      })
      .finally(() => {
        loadingPromise = undefined
      })
  }
  await loadingPromise
}

/** 获取首个部门编号 */
async function getFirstDeptId() {
  await loadDeptList()
  return findFirstDeptId(deptOptions.value)
}

/** 查找首个部门编号 */
function findFirstDeptId(departments: DeptOption[]): number | undefined {
  for (const department of departments) {
    if (department.id != null) {
      return department.id
    }
    const deptId = findFirstDeptId(department.children || [])
    if (deptId != null) {
      return deptId
    }
  }
  return undefined
}

defineExpose({ getFirstDeptId })

/** 初始化 */
onMounted(() => {
  loadDeptList()
})
</script>
