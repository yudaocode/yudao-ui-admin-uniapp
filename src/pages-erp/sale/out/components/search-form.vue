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
          出库单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入出库单号" clearable />
      </view>
      <ProductSearchPicker ref="productPickerRef" v-model="formData.productId" />
      <yd-search-date-range v-model="formData.outTime" label="出库时间" />
      <CustomerSearchPicker ref="customerPickerRef" v-model="formData.customerId" />
      <WarehouseSearchPicker ref="warehousePickerRef" v-model="formData.warehouseId" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          关联订单
        </view>
        <wd-input v-model="formData.orderNo" placeholder="请输入关联订单" clearable />
      </view>
      <AccountSearchPicker ref="accountPickerRef" v-model="formData.accountId" />
      <UserSearchPicker ref="creatorPickerRef" v-model="formData.creator" label="创建人" />
      <yd-search-picker ref="statusPickerRef" v-model="formData.status" label="审核状态" :dict-type="DICT_TYPE.ERP_AUDIT_STATUS" all-option />
      <yd-search-picker ref="receiptStatusPickerRef" v-model="formData.receiptStatus" label="收款状态" :columns="receiptStatusColumns" all-option />
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
import AccountSearchPicker from '@/pages-erp/finance/account/components/account-search-picker.vue'
import ProductSearchPicker from '@/pages-erp/product/product/components/product-search-picker.vue'
import CustomerSearchPicker from '@/pages-erp/sale/customer/components/customer-search-picker.vue'
import WarehouseSearchPicker from '@/pages-erp/stock/warehouse/components/warehouse-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false) // 搜索弹窗显示状态
const productPickerRef = ref<InstanceType<typeof ProductSearchPicker>>() // 产品选择器
const customerPickerRef = ref<InstanceType<typeof CustomerSearchPicker>>() // 客户选择器
const warehousePickerRef = ref<InstanceType<typeof WarehouseSearchPicker>>() // 仓库选择器
const accountPickerRef = ref<InstanceType<typeof AccountSearchPicker>>() // 结算账户选择器
const creatorPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 创建人选择器
const statusPickerRef = ref<YdSearchPickerExpose>() // 审核状态选择器
const receiptStatusPickerRef = ref<YdSearchPickerExpose>() // 收款状态选择器
const formData = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  outTime: [undefined, undefined] as [any, any],
  customerId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  orderNo: undefined as string | undefined,
  accountId: undefined as number | undefined,
  creator: undefined as number | undefined,
  status: undefined as number | undefined,
  receiptStatus: undefined as number | undefined,
  remark: undefined as string | undefined,
}) // 搜索表单数据
const receiptStatusColumns = [
  { label: '未收款', value: 0 },
  { label: '部分收款', value: 1 },
  { label: '全部收款', value: 2 },
] // 收款状态选项

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${productPickerRef.value?.format(formData.productId) || formData.productId}`)
  }
  if (formData.outTime[0] && formData.outTime[1]) {
    conditions.push(`出库时间:${formatDate(formData.outTime[0])}~${formatDate(formData.outTime[1])}`)
  }
  if (formData.customerId) {
    conditions.push(`客户:${customerPickerRef.value?.format(formData.customerId) || formData.customerId}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${warehousePickerRef.value?.format(formData.warehouseId) || formData.warehouseId}`)
  }
  if (formData.orderNo) {
    conditions.push(`关联订单:${formData.orderNo}`)
  }
  if (formData.accountId) {
    conditions.push(`账户:${accountPickerRef.value?.format(formData.accountId) || formData.accountId}`)
  }
  if (formData.creator) {
    conditions.push(`创建人:${creatorPickerRef.value?.format(formData.creator) || formData.creator}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${statusPickerRef.value?.format(formData.status) || formData.status}`)
  }
  if (formData.receiptStatus !== undefined) {
    conditions.push(`收款:${receiptStatusPickerRef.value?.format(formData.receiptStatus) || formData.receiptStatus}`)
  }
  if (formData.remark) {
    conditions.push(`备注:${formData.remark}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索销售出库'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    productId: formData.productId,
    outTime: formatDateRange(formData.outTime),
    customerId: formData.customerId,
    warehouseId: formData.warehouseId,
    orderNo: formData.orderNo || undefined,
    accountId: formData.accountId,
    creator: formData.creator != null ? String(formData.creator) : undefined,
    status: formData.status,
    receiptStatus: formData.receiptStatus,
    remark: formData.remark || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.productId = undefined
  formData.outTime = [undefined, undefined]
  formData.customerId = undefined
  formData.warehouseId = undefined
  formData.orderNo = undefined
  formData.accountId = undefined
  formData.creator = undefined
  formData.status = undefined
  formData.receiptStatus = undefined
  formData.remark = undefined
  visible.value = false
  emit('reset')
}
</script>
