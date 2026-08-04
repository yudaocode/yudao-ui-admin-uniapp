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
        <wd-input v-model="formData.search" placeholder="请输入姓名或工号" clearable />
      </view>
      <DeptSearchPicker v-model="formData.deptId" label="部门" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          岗位
        </view>
        <wd-input v-model="formData.postName" placeholder="请输入岗位名称" clearable />
      </view>
      <yd-search-picker
        v-model="formData.changeType"
        label="档案状态"
        :dict-type="DICT_TYPE.HRM_SALARY_CHANGE_TYPE"
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
  postName: undefined as string | undefined,
  changeType: undefined as number | undefined,
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.search) {
    conditions.push(`员工:${formData.search}`)
  }
  if (formData.deptId != null) {
    conditions.push('部门已选')
  }
  if (formData.postName) {
    conditions.push(`岗位:${formData.postName}`)
  }
  if (formData.changeType != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.HRM_SALARY_CHANGE_TYPE, formData.changeType) || formData.changeType}`)
  }
  return conditions.length ? conditions.join(' | ') : '搜索员工、岗位、档案状态'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    search: formData.search || undefined,
    deptId: formData.deptId,
    postName: formData.postName || undefined,
    changeType: formData.changeType,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.search = undefined
  formData.deptId = undefined
  formData.postName = undefined
  formData.changeType = undefined
  visible.value = false
  emit('reset')
}
</script>
