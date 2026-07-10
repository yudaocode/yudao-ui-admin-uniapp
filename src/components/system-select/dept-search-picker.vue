<template>
  <yd-tree-select
    :model-value="modelValue"
    :data="deptOptions"
    :props="treeProps"
    :placeholder="placeholder"
    :disabled="disabled"
    :use-default-slot="true"
    check-strictly
    @update:model-value="handleUpdate"
    @change="handleChange"
  >
    <template #default="{ label: displayValue }">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          {{ label }}
        </view>
        <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx">
          <text class="min-w-0 flex-1 truncate" :class="displayValue ? 'text-[#333]' : 'text-[#999]'">
            {{ displayValue || placeholder }}
          </text>
          <wd-icon
            v-if="clearable && displayValue"
            name="close-circle"
            size="30rpx"
            custom-style="color: #c0c4cc;"
            @click.stop="handleClear"
          />
        </view>
      </view>
    </template>
  </yd-tree-select>
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
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  showRoot?: boolean
}>(), {
  label: '归属部门',
  placeholder: '请选择部门',
  disabled: false,
  clearable: true,
  showRoot: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [value: number | undefined]
  'clear': []
}>()

const deptList = ref<Dept[]>([]) // 部门选项
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

/** 更新部门编号 */
function handleUpdate(value: number | undefined) {
  emit('update:modelValue', value == null ? undefined : Number(value))
}

/** 部门变更 */
function handleChange(value: number | undefined) {
  emit('change', value == null ? undefined : Number(value))
}

/** 清空部门 */
function handleClear() {
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}

/** 格式化部门编号 */
function format(value?: number) {
  const deptId = arguments.length > 0 ? value : props.modelValue
  if (deptId == null) {
    return ''
  }
  return findDeptName(deptOptions.value, Number(deptId))
}

/** 查询部门名称 */
function findDeptName(departments: DeptOption[], deptId: number): string {
  for (const department of departments) {
    if (department.id === deptId) {
      return department.name
    }
    const name = findDeptName(department.children || [], deptId)
    if (name) {
      return name
    }
  }
  return ''
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

defineExpose({ format, getFirstDeptId })

/** 初始化 */
onMounted(() => {
  loadDeptList()
})
</script>
