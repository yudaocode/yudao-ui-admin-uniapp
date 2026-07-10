<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
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
          订单单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入订单单号" clearable />
      </view>
      <ProductSearchPicker ref="productPickerRef" v-model="formData.productId" />
      <yd-search-date-range v-model="formData.orderTime" label="订单时间" />
      <SupplierSearchPicker ref="supplierPickerRef" v-model="formData.supplierId" />
      <UserSearchPicker ref="creatorPickerRef" v-model="formData.creator" label="创建人" />
      <yd-search-picker ref="statusPickerRef" v-model="formData.status" label="状态" :dict-type="DICT_TYPE.ERP_AUDIT_STATUS" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          备注
        </view>
        <wd-input v-model="formData.remark" placeholder="请输入备注" clearable />
      </view>
      <yd-search-picker ref="inStatusPickerRef" v-model="formData.inStatus" label="入库数量" :columns="getProgressStatusColumns('入库')" all-option />
      <yd-search-picker ref="returnStatusPickerRef" v-model="formData.returnStatus" label="退货数量" :columns="getProgressStatusColumns('退货')" all-option />
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
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { UserSearchPicker } from '@/components/system-select'
import ProductSearchPicker from '@/pages-erp/product/product/components/product-search-picker.vue'
import SupplierSearchPicker from '@/pages-erp/purchase/supplier/components/supplier-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false)
const productPickerRef = ref<InstanceType<typeof ProductSearchPicker>>() // 产品选择器
const supplierPickerRef = ref<InstanceType<typeof SupplierSearchPicker>>() // 供应商选择器
const creatorPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 创建人选择器
const statusPickerRef = ref<YdSearchPickerExpose>() // 审核状态选择器
const inStatusPickerRef = ref<YdSearchPickerExpose>() // 入库状态选择器
const returnStatusPickerRef = ref<YdSearchPickerExpose>() // 退货状态选择器
const formData = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  orderTime: [undefined, undefined] as [any, any],
  supplierId: undefined as number | undefined,
  creator: undefined as number | undefined,
  status: -1,
  remark: undefined as string | undefined,
  inStatus: -1,
  returnStatus: -1,
})

/** 获取进度状态选项 */
function getProgressStatusColumns(label: string) {
  return [
    { label: `未${label}`, value: 0 },
    { label: `部分${label}`, value: 1 },
    { label: `全部${label}`, value: 2 },
  ]
}

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${productPickerRef.value?.format(formData.productId) || formData.productId}`)
  }
  if (formData.orderTime[0] && formData.orderTime[1]) {
    conditions.push(`订单时间:${formatDate(formData.orderTime[0])}~${formatDate(formData.orderTime[1])}`)
  }
  if (formData.supplierId) {
    conditions.push(`供应商:${supplierPickerRef.value?.format(formData.supplierId) || formData.supplierId}`)
  }
  if (formData.creator) {
    conditions.push(`创建人:${creatorPickerRef.value?.format(formData.creator) || formData.creator}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${statusPickerRef.value?.format(formData.status) || formData.status}`)
  }
  if (formData.remark) {
    conditions.push(`备注:${formData.remark}`)
  }
  if (formData.inStatus !== -1) {
    conditions.push(`入库:${inStatusPickerRef.value?.format(formData.inStatus) || formData.inStatus}`)
  }
  if (formData.returnStatus !== -1) {
    conditions.push(`退货:${returnStatusPickerRef.value?.format(formData.returnStatus) || formData.returnStatus}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索采购订单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    productId: formData.productId,
    orderTime: formatDateRange(formData.orderTime),
    supplierId: formData.supplierId,
    creator: formData.creator != null ? String(formData.creator) : undefined,
    status: formData.status === -1 ? undefined : formData.status,
    remark: formData.remark || undefined,
    inStatus: formData.inStatus === -1 ? undefined : formData.inStatus,
    returnStatus: formData.returnStatus === -1 ? undefined : formData.returnStatus,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.productId = undefined
  formData.orderTime = [undefined, undefined]
  formData.supplierId = undefined
  formData.creator = undefined
  formData.status = -1
  formData.remark = undefined
  formData.inStatus = -1
  formData.returnStatus = -1
  visible.value = false
  emit('reset')
}
</script>
