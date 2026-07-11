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
          入库单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入入库单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          入库单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入入库单名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          外协工单号
        </view>
        <wd-input v-model="formData.workOrderCode" placeholder="请输入外协工单号" clearable />
      </view>
      <VendorSearchPicker ref="vendorSearchPickerRef" v-model="formData.vendorId" label="供应商" placeholder="请选择供应商" />
      <yd-search-picker v-model="formData.status" label="单据状态" :dict-type="DICT_TYPE.MES_WM_OUTSOURCE_RECEIPT_STATUS" all-option />
      <yd-search-date-range v-model="formData.receiptDate" label="入库日期" />
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
import VendorSearchPicker from '@/pages-mes/md/vendor/components/vendor-search-picker.vue'

interface SearchFormData {
  code?: string
  name?: string
  workOrderCode?: string
  vendorId?: number
  status?: number
  receiptDate?: [number | undefined, number | undefined]
}

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const vendorSearchPickerRef = ref<InstanceType<typeof VendorSearchPicker>>() // 供应商搜索选择器
const formData = reactive<SearchFormData>({
  code: undefined,
  name: undefined,
  workOrderCode: undefined,
  vendorId: undefined,
  status: undefined,
  receiptDate: undefined,
}) // 搜索表单数据
const placeholder = computed(() => { // 搜索条件摘要
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.workOrderCode) {
    conditions.push(`工单:${formData.workOrderCode}`)
  }
  if (formData.vendorId != null) {
    conditions.push(`供应商:${vendorSearchPickerRef.value?.format(formData.vendorId) || formData.vendorId}`)
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_WM_OUTSOURCE_RECEIPT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索外协入库'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    workOrderCode: formData.workOrderCode || undefined,
    vendorId: formData.vendorId,
    status: formData.status,
    receiptDate: formatDateRange(formData.receiptDate),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.workOrderCode = undefined
  formData.vendorId = undefined
  formData.status = undefined
  formData.receiptDate = undefined
  visible.value = false
  emit('reset')
}
</script>
