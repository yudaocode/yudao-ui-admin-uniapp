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
          检验单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入检验单编号" clearable />
      </view>
      <VendorSearchPicker ref="vendorSearchPickerRef" v-model="formData.vendorId" label="供应商" placeholder="请选择供应商" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商批次
        </view>
        <wd-input v-model="formData.vendorBatch" placeholder="请输入供应商批次号" clearable />
      </view>
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="产品物料" placeholder="请选择产品物料" title="选择产品物料" />
      <yd-search-picker v-model="formData.checkResult" label="检测结果" :dict-type="DICT_TYPE.MES_QC_CHECK_RESULT" all-option />
      <yd-search-date-range v-model="receiveDateRange" label="来料日期" />
      <yd-search-date-range v-model="inspectDateRange" label="检测日期" />
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
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'
import VendorSearchPicker from '@/pages-mes/md/vendor/components/vendor-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const receiveDateRange = ref<[number | undefined, number | undefined]>() // 来料日期范围
const inspectDateRange = ref<[number | undefined, number | undefined]>() // 检测日期范围
const vendorSearchPickerRef = ref<InstanceType<typeof VendorSearchPicker>>() // 供应商搜索选择器
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 物料搜索选择器
const formData = reactive({
  code: '',
  vendorId: undefined,
  vendorBatch: '',
  itemId: undefined,
  checkResult: undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.vendorId != null) {
    conditions.push(`供应商:${vendorSearchPickerRef.value?.format(formData.vendorId) || formData.vendorId}`)
  }
  if (formData.vendorBatch) {
    conditions.push(`批次:${formData.vendorBatch}`)
  }
  if (formData.itemId != null) {
    conditions.push(`物料:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  if (formData.checkResult != null) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.MES_QC_CHECK_RESULT, formData.checkResult) || formData.checkResult}`)
  }
  if (receiveDateRange.value?.length === 2) {
    conditions.push('来料日期')
  }
  if (inspectDateRange.value?.length === 2) {
    conditions.push('检测日期')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索来料检验单（IQC）'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    vendorId: formData.vendorId,
    vendorBatch: formData.vendorBatch || undefined,
    itemId: formData.itemId,
    checkResult: formData.checkResult,
    receiveDate: formatDateRange(receiveDateRange.value),
    inspectDate: formatDateRange(inspectDateRange.value),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.vendorId = undefined
  formData.vendorBatch = ''
  formData.itemId = undefined
  formData.checkResult = undefined
  receiveDateRange.value = undefined
  inspectDateRange.value = undefined
  visible.value = false
  emit('reset')
}
</script>
