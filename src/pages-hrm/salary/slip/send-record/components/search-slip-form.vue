<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          员工
        </view>
        <wd-input v-model="formData.search" placeholder="请输入员工姓名或工号" clearable />
      </view>
      <DeptSearchPicker v-model="formData.deptId" label="部门" />
      <yd-search-picker
        v-model="formData.readStatus"
        label="查看状态"
        :dict-type="DICT_TYPE.HRM_SALARY_SLIP_READ_STATUS"
        all-option
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          备注
        </view>
        <wd-input v-model="formData.remark" placeholder="请输入备注" clearable />
      </view>
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
import { computed, reactive, ref } from 'vue'
import DeptSearchPicker from '@/components/system-select/dept-search-picker.vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  search: undefined as string | undefined,
  deptId: undefined as number | undefined,
  readStatus: undefined as number | undefined,
  remark: undefined as string | undefined,
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.search) {
    conditions.push(`员工:${formData.search}`)
  }
  if (formData.deptId !== undefined) {
    conditions.push('部门已选')
  }
  if (formData.readStatus !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.HRM_SALARY_SLIP_READ_STATUS, formData.readStatus)}`)
  }
  if (formData.remark) {
    conditions.push(`备注:${formData.remark}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索工资条'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    search: formData.search || undefined,
    deptId: formData.deptId,
    readStatus: formData.readStatus,
    remark: formData.remark || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.search = undefined
  formData.deptId = undefined
  formData.readStatus = undefined
  formData.remark = undefined
  visible.value = false
  emit('reset')
}
</script>
