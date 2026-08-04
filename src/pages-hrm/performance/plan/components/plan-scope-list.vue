<template>
  <view>
    <view
      v-for="(scope, index) in model"
      :key="index"
      class="border-b border-[#f0f0f0] px-24rpx py-20rpx"
    >
      <view class="mb-12rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">
          考核范围 {{ index + 1 }}
        </text>
        <wd-button
          v-if="!disabled && model.length > 1"
          size="small"
          type="danger"
          variant="text"
          @click="removeScope(index)"
        >
          删除
        </wd-button>
      </view>
      <yd-form-picker
        v-model="scope.type"
        label="范围类型"
        label-width="160rpx"
        :columns="scopeTypeColumns(scope)"
        placeholder="请选择范围类型"
        :disabled="disabled"
        @confirm="() => handleScopeTypeChange(scope)"
      />
      <template v-if="scope.type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT">
        <EmployeeFormPicker
          v-model="scope.employeeIds"
          type="checkbox"
          label="参评员工"
          label-width="160rpx"
          placeholder="请选择参评员工"
          :disabled="disabled"
        />
        <yd-tree-select
          v-model="scope.deptIds"
          label="参评部门"
          label-width="160rpx"
          placeholder="请选择参评部门"
          :data="deptOptions"
          :props="treeProps"
          multiple
          check-strictly
          :disabled="disabled"
        />
      </template>
      <template v-else>
        <yd-form-picker
          v-model="scope.employeeType"
          label="聘用形式"
          label-width="160rpx"
          :dict-type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
          placeholder="请选择聘用形式"
          :disabled="disabled"
          @confirm="() => handleEmployTypeChange(scope)"
        />
        <yd-form-picker
          v-model="scope.employeeStatuses"
          label="员工状态"
          label-width="160rpx"
          type="checkbox"
          :columns="employeeStatusColumns(scope.employeeType)"
          placeholder="请选择员工状态"
          :disabled="disabled"
        />
      </template>
    </view>

    <view v-if="!disabled && model.length < 3" class="px-24rpx py-16rpx">
      <wd-button size="small" type="primary" variant="plain" @click="addScope">
        新增考核范围
      </wd-button>
    </view>
    <view v-if="!model.length" class="px-24rpx py-24rpx text-28rpx text-[#999]">
      暂无考核范围，请新增
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PerformanceScope } from '@/api/hrm/performance/plan'
import type { Dept } from '@/api/system/dept'
import { computed, onMounted, ref } from 'vue'
import { getSimpleDeptList } from '@/api/system/dept'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'
import {
  HRM_EMPLOYEE_NON_FORMAL_STATUSES,
  HrmEmployeeStatus,
  HrmEmployeeType,
  HrmPerformancePlanScopeType,
} from '@/pages-hrm/utils/constants'
import { handleTree } from '@/utils/tree'
import { DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  modelValue?: PerformanceScope[]
  disabled?: boolean
}>(), {
  modelValue: () => [],
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: PerformanceScope[]]
}>()

const deptList = ref<Dept[]>([]) // 部门列表
const treeProps = { label: 'name', value: 'id', children: 'children' } // 部门树字段
const deptOptions = computed(() => handleTree(deptList.value)) // 部门树形选项
const model = computed({
  get: () => props.modelValue || [],
  set: (value: PerformanceScope[]) => emit('update:modelValue', value),
})
const hasEmployeeDeptScope = computed(() => // 是否已有员工部门范围
  model.value.some(scope => scope.type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT))

/** 范围类型选项 */
function scopeTypeColumns(scope: PerformanceScope) {
  return [
    {
      label: '员工部门',
      value: HrmPerformancePlanScopeType.EMPLOYEE_DEPT,
      disabled: hasEmployeeDeptScope.value
        && scope.type !== HrmPerformancePlanScopeType.EMPLOYEE_DEPT,
    },
    {
      label: '聘用形式',
      value: HrmPerformancePlanScopeType.EMPLOYMENT,
    },
  ]
}

/** 员工状态选项 */
function employeeStatusColumns(employeeType?: number) {
  if (employeeType === HrmEmployeeType.INFORMAL) {
    return HRM_EMPLOYEE_NON_FORMAL_STATUSES.map(value => ({
      label: ({
        [HrmEmployeeStatus.INTERN]: '实习',
        [HrmEmployeeStatus.PART_TIME]: '兼职',
        [HrmEmployeeStatus.LABOR]: '劳务',
        [HrmEmployeeStatus.CONSULTANT]: '顾问',
        [HrmEmployeeStatus.REHIRE]: '返聘',
        [HrmEmployeeStatus.OUTSOURCE]: '外包',
      } as Record<number, string>)[value] || String(value),
      value,
    }))
  }
  return [
    { label: '正式', value: HrmEmployeeStatus.REGULAR },
    { label: '试用', value: HrmEmployeeStatus.PROBATION },
  ]
}

/** 创建考评范围 */
function createScope(type: number = HrmPerformancePlanScopeType.EMPLOYEE_DEPT): PerformanceScope {
  return type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT
    ? { type, employeeIds: [], deptIds: [] }
    : {
        type,
        employeeType: HrmEmployeeType.FORMAL,
        employeeStatuses: [HrmEmployeeStatus.REGULAR, HrmEmployeeStatus.PROBATION],
      }
}

/** 新增考评范围 */
function addScope() {
  const type = hasEmployeeDeptScope.value
    ? HrmPerformancePlanScopeType.EMPLOYMENT
    : HrmPerformancePlanScopeType.EMPLOYEE_DEPT
  model.value = [...model.value, createScope(type)]
}

/** 删除考评范围 */
function removeScope(index: number) {
  model.value = model.value.filter((_, scopeIndex) => scopeIndex !== index)
}

/** 切换考评范围类型（只重置当前组） */
function handleScopeTypeChange(scope: PerformanceScope) {
  const replacement = createScope(scope.type)
  Object.keys(scope).forEach((key) => {
    delete (scope as any)[key]
  })
  Object.assign(scope, replacement)
}

/** 切换聘用形式 */
function handleEmployTypeChange(scope: PerformanceScope) {
  scope.employeeStatuses = []
}

/** 初始化 */
onMounted(async () => {
  deptList.value = await getSimpleDeptList()
})
</script>
