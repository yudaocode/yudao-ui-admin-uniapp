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
          订单单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入订单单号" clearable />
      </view>
      <ProductSearchPicker ref="productPickerRef" v-model="formData.productId" />
      <yd-search-date-range v-model="formData.orderTime" label="订单时间" />
      <CustomerSearchPicker ref="customerPickerRef" v-model="formData.customerId" />
      <UserSearchPicker ref="creatorPickerRef" v-model="formData.creator" label="创建人" />
      <yd-search-picker ref="statusPickerRef" v-model="formData.status" label="状态" :dict-type="DICT_TYPE.ERP_AUDIT_STATUS" all-option />
      <yd-search-picker ref="outStatusPickerRef" v-model="formData.outStatus" label="出库数量" :columns="getProgressStatusColumns('出库')" all-option />
      <yd-search-picker ref="returnStatusPickerRef" v-model="formData.returnStatus" label="退货数量" :columns="getProgressStatusColumns('退货')" all-option />
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
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { UserSearchPicker } from '@/components/system-select'
import ProductSearchPicker from '@/pages-erp/product/product/components/product-search-picker.vue'
import CustomerSearchPicker from '@/pages-erp/sale/customer/components/customer-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false) // 搜索弹窗显示状态
const productPickerRef = ref<InstanceType<typeof ProductSearchPicker>>() // 产品选择器
const customerPickerRef = ref<InstanceType<typeof CustomerSearchPicker>>() // 客户选择器
const creatorPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 创建人选择器
const statusPickerRef = ref<YdSearchPickerExpose>() // 审核状态选择器
const outStatusPickerRef = ref<YdSearchPickerExpose>() // 出库状态选择器
const returnStatusPickerRef = ref<YdSearchPickerExpose>() // 退货状态选择器
const formData = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  orderTime: [undefined, undefined] as [any, any],
  customerId: undefined as number | undefined,
  creator: undefined as number | undefined,
  status: -1,
  outStatus: -1,
  returnStatus: -1,
  remark: undefined as string | undefined,
}) // 搜索表单数据

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
  if (formData.customerId) {
    conditions.push(`客户:${customerPickerRef.value?.format(formData.customerId) || formData.customerId}`)
  }
  if (formData.creator) {
    conditions.push(`创建人:${creatorPickerRef.value?.format(formData.creator) || formData.creator}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${statusPickerRef.value?.format(formData.status) || formData.status}`)
  }
  if (formData.outStatus !== -1) {
    conditions.push(`出库:${outStatusPickerRef.value?.format(formData.outStatus) || formData.outStatus}`)
  }
  if (formData.returnStatus !== -1) {
    conditions.push(`退货:${returnStatusPickerRef.value?.format(formData.returnStatus) || formData.returnStatus}`)
  }
  if (formData.remark) {
    conditions.push(`备注:${formData.remark}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索销售订单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    productId: formData.productId,
    orderTime: formatDateRange(formData.orderTime),
    customerId: formData.customerId,
    creator: formData.creator != null ? String(formData.creator) : undefined,
    status: formData.status === -1 ? undefined : formData.status,
    outStatus: formData.outStatus === -1 ? undefined : formData.outStatus,
    returnStatus: formData.returnStatus === -1 ? undefined : formData.returnStatus,
    remark: formData.remark || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.productId = undefined
  formData.orderTime = [undefined, undefined]
  formData.customerId = undefined
  formData.creator = undefined
  formData.status = -1
  formData.outStatus = -1
  formData.returnStatus = -1
  formData.remark = undefined
  visible.value = false
  emit('reset')
}
</script>
