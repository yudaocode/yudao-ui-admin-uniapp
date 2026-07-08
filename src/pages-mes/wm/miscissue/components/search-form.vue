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
          出库单编号
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入出库单编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          出库单名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入出库单名称"
          clearable
        />
      </view>
      <yd-search-picker v-model="formData.type" label="业务类型" :dict-type="DICT_TYPE.MES_WM_MISC_ISSUE_TYPE" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          来源单据类型
        </view>
        <wd-input
          v-model="formData.sourceDocType"
          placeholder="请输入来源单据类型"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          来源单据编号
        </view>
        <wd-input
          v-model="formData.sourceDocCode"
          placeholder="请输入来源单据编号"
          clearable
        />
      </view>
      <yd-search-date-range v-model="formData.issueDate" label="出库日期" />
      <yd-search-picker v-model="formData.status" label="单据状态" :dict-type="DICT_TYPE.MES_WM_MISC_ISSUE_STATUS" all-option />
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
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'

interface SearchFormData {
  code?: string
  name?: string
  type?: number
  sourceDocType?: string
  sourceDocCode?: string
  issueDate?: [number | undefined, number | undefined]
  status?: number
}

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<SearchFormData>({
  code: undefined,
  name: undefined,
  type: undefined,
  sourceDocType: undefined,
  sourceDocCode: undefined,
  issueDate: undefined,
  status: undefined,
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索条件摘要
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.type != null && formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_WM_MISC_ISSUE_TYPE, formData.type)}`)
  }
  if (formData.sourceDocType) {
    conditions.push(`来源单据类型:${formData.sourceDocType}`)
  }
  if (formData.sourceDocCode) {
    conditions.push(`来源单据编号:${formData.sourceDocCode}`)
  }
  if (formData.status != null && formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_WM_MISC_ISSUE_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索其他出库'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    type: formData.type === -1 ? undefined : formData.type,
    sourceDocType: formData.sourceDocType || undefined,
    sourceDocCode: formData.sourceDocCode || undefined,
    issueDate: formatDateRange(formData.issueDate),
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.type = undefined
  formData.sourceDocType = undefined
  formData.sourceDocCode = undefined
  formData.issueDate = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
