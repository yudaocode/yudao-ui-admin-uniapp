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
          汇报编号
        </view>
        <wd-input
          v-model="formData.no"
          placeholder="请输入汇报编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          汇报类型
        </view>
        <yd-search-picker
          v-model="formData.type"
          :columns="getIntDictOptions(DICT_TYPE.OA_WORK_REPORT_TYPE)"
          all-option
          all-label="全部类型"
          placeholder="请选择汇报类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          汇报状态
        </view>
        <yd-search-picker
          v-model="formData.status"
          :columns="getIntDictOptions(DICT_TYPE.OA_WORK_REPORT_STATUS)"
          all-option
          all-label="全部状态"
          placeholder="请选择汇报状态"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          申请部门
        </view>
        <DeptSearchPicker v-model="formData.deptId" placeholder="请选择申请部门" />
      </view>
      <yd-search-date-range v-model="formData.periodTime" label="汇报周期" />
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
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
import { DeptSearchPicker } from '@/components/system-select'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  no: undefined as string | undefined,
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  deptId: undefined as number | undefined,
  periodTime: [undefined, undefined] as [number | undefined, number | undefined],
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`编号:${formData.no}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.OA_WORK_REPORT_TYPE, formData.type)}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.OA_WORK_REPORT_STATUS, formData.status)}`)
  }
  if (formData.periodTime?.[0] && formData.periodTime?.[1]) {
    conditions.push(`周期:${formatDate(formData.periodTime[0])}~${formatDate(formData.periodTime[1])}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`创建:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索汇报'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    type: formData.type,
    status: formData.status,
    deptId: formData.deptId,
    periodTime: formatDateRange(formData.periodTime),
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.type = undefined
  formData.status = undefined
  formData.deptId = undefined
  formData.periodTime = [undefined, undefined]
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
