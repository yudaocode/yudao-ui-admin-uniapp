<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-if="visible"
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          员工信息
        </view>
        <wd-input v-model="formData.search" placeholder="姓名、工号或手机号" clearable />
      </view>
      <DeptSearchPicker
        v-model="formData.deptId"
        label="部门"
        placeholder="请选择部门"
      />
      <yd-search-picker
        v-model="formData.employeeType"
        label="聘用形式"
        :dict-type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
        all-option
      />
      <yd-search-picker
        v-model="formData.employeeStatus"
        label="员工状态"
        :dict-type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
        all-option
      />
      <yd-search-picker
        v-model="formData.stageType"
        label="当前阶段"
        :dict-type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
        all-option
      />
      <yd-search-picker
        v-model="formData.resultLevel"
        label="结果等级"
        :columns="resultLevelColumns"
        all-option
      />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { DeptSearchPicker } from '@/components/system-select'

const props = defineProps<{
  levelList?: string[]
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const RESULT_LEVEL_EMPTY_VALUE = '__RESULT_LEVEL_EMPTY__' // 未定级哨兵值

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  search: undefined as string | undefined,
  deptId: undefined as number | undefined,
  employeeType: undefined as number | undefined,
  employeeStatus: undefined as number | undefined,
  stageType: undefined as number | undefined,
  resultLevel: undefined as string | undefined,
}) // 搜索表单数据

const resultLevelColumns = computed(() => [ // 结果等级选项
  ...(props.levelList || []).map(level => ({ label: level, value: level })),
  { label: '未定级', value: RESULT_LEVEL_EMPTY_VALUE },
])

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.search) {
    conditions.push(`员工:${formData.search}`)
  }
  if (formData.deptId != null) {
    conditions.push('部门已选')
  }
  if (formData.employeeType != null) {
    conditions.push(`聘用:${getDictLabel(DICT_TYPE.HRM_EMPLOYEE_TYPE, formData.employeeType)}`)
  }
  if (formData.employeeStatus != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, formData.employeeStatus)}`)
  }
  if (formData.stageType != null) {
    conditions.push(`阶段:${getDictLabel(DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS, formData.stageType)}`)
  }
  if (formData.resultLevel) {
    conditions.push(
      formData.resultLevel === RESULT_LEVEL_EMPTY_VALUE
        ? '等级:未定级'
        : `等级:${formData.resultLevel}`,
    )
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索参评员工'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  const isEmptyLevel = formData.resultLevel === RESULT_LEVEL_EMPTY_VALUE
  emit('search', {
    search: formData.search || undefined,
    deptId: formData.deptId,
    employeeType: formData.employeeType,
    employeeStatus: formData.employeeStatus,
    stageType: formData.stageType,
    resultLevel: isEmptyLevel ? undefined : (formData.resultLevel || undefined),
    resultLevelEmpty: isEmptyLevel ? true : undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.search = undefined
  formData.deptId = undefined
  formData.employeeType = undefined
  formData.employeeStatus = undefined
  formData.stageType = undefined
  formData.resultLevel = undefined
  visible.value = false
  emit('reset')
}

watch(() => props.levelList, () => {
  if (
    formData.resultLevel
    && formData.resultLevel !== RESULT_LEVEL_EMPTY_VALUE
    && !(props.levelList || []).includes(formData.resultLevel)
  ) {
    formData.resultLevel = undefined
  }
})
</script>
