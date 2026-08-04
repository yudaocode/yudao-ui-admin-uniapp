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
          月份
        </view>
        <view
          class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx"
          @click="monthVisible = true"
        >
          <text class="min-w-0 flex-1 truncate text-[#333]">
            {{ monthText }}
          </text>
          <wd-icon name="arrow-right" size="32rpx" color="#666" />
        </view>
        <wd-datetime-picker
          v-model="formData.month"
          v-model:visible="monthVisible"
          title="请选择月份"
          type="year-month"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          员工
        </view>
        <wd-input v-model="formData.employeeKeyword" placeholder="请输入员工姓名或工号" clearable />
      </view>
      <DeptSearchPicker v-model="formData.deptId" label="部门" />
      <yd-search-picker
        v-model="formData.types"
        type="checkbox"
        label="请假类型"
        :dict-type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE"
        dict-kind="str"
      />
      <yd-search-picker
        v-model="formData.approvalStatus"
        label="审批状态"
        :dict-type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
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
import { getAttendanceMonthRange } from '@/pages-hrm/utils/format'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const monthVisible = ref(false) // 月份选择器显隐
const formData = reactive({ // 搜索表单数据
  month: Date.now(),
  employeeKeyword: undefined as string | undefined,
  deptId: undefined as number | undefined,
  types: [] as string[],
  approvalStatus: undefined as number | undefined,
})

const monthText = computed(() => formatDate(formData.month, 'YYYY-MM') || '-')
const placeholder = computed(() => {
  const conditions: string[] = [`月份:${monthText.value}`]
  if (formData.employeeKeyword) {
    conditions.push(`员工:${formData.employeeKeyword}`)
  }
  if (formData.types.length > 0) {
    const labels = formData.types
      .map(value => getDictLabel(DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE, value))
      .filter(Boolean)
    if (labels.length > 0) {
      conditions.push(`类型:${labels.join(',')}`)
    }
  }
  if (formData.approvalStatus !== undefined) {
    conditions.push(`审批:${getDictLabel(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, formData.approvalStatus)}`)
  }
  return conditions.join(' | ')
})

/** 组装搜索参数 */
function buildSearchData() {
  return {
    startTime: getAttendanceMonthRange(formData.month),
    employeeKeyword: formData.employeeKeyword || undefined,
    deptIds: formData.deptId != null ? [formData.deptId] : undefined,
    types: formData.types.length > 0 ? formData.types : undefined,
    approvalStatus: formData.approvalStatus,
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildSearchData())
}

/** 重置按钮操作 */
function handleReset() {
  formData.month = Date.now()
  formData.employeeKeyword = undefined
  formData.deptId = undefined
  formData.types = []
  formData.approvalStatus = undefined
  visible.value = false
  emit('reset')
}
</script>
