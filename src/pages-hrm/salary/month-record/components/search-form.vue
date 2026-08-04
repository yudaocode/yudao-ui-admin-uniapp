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
          员工姓名
        </view>
        <wd-input v-model="formData.employeeName" placeholder="请输入员工姓名" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工号
        </view>
        <wd-input v-model="formData.jobNumber" placeholder="请输入工号" clearable />
      </view>
      <DeptSearchPicker v-model="formData.deptId" label="部门" />
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
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  employeeName: undefined as string | undefined,
  jobNumber: undefined as string | undefined,
  deptId: undefined as number | undefined,
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.employeeName) {
    conditions.push(`姓名:${formData.employeeName}`)
  }
  if (formData.jobNumber) {
    conditions.push(`工号:${formData.jobNumber}`)
  }
  if (formData.deptId !== undefined) {
    conditions.push('部门已选')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索计薪员工'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    employeeName: formData.employeeName || undefined,
    jobNumber: formData.jobNumber || undefined,
    deptId: formData.deptId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.employeeName = undefined
  formData.jobNumber = undefined
  formData.deptId = undefined
  visible.value = false
  emit('reset')
}
</script>
