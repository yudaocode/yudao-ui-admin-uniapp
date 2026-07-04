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
      <yd-search-picker v-model="formData.productId" label="产品" :columns="productOptions" label-key="name" value-key="id" placeholder="请选择产品" />
      <yd-search-date-range v-model="formData.outTime" label="出库时间" />
      <yd-search-picker v-model="formData.customerId" label="客户" :columns="customerOptions" label-key="name" value-key="id" placeholder="请选择客户" />
      <yd-search-picker v-model="formData.warehouseId" label="仓库" :columns="warehouseOptions" label-key="name" value-key="id" placeholder="请选择仓库" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          关联订单
        </view>
        <wd-input v-model="formData.orderNo" placeholder="请输入关联订单" clearable />
      </view>
      <yd-search-picker v-model="formData.accountId" label="结算账户" :columns="accountOptions" label-key="name" value-key="id" placeholder="请选择结算账户" />
      <yd-search-picker v-model="formData.creator" label="创建人" :columns="userOptions" label-key="nickname" value-key="id" placeholder="请选择创建人" />
      <yd-search-picker v-model="formData.status" label="审核状态" :dict-type="DICT_TYPE.ERP_AUDIT_STATUS" all-option />
      <yd-search-picker v-model="formData.receiptStatus" label="收款状态" :columns="receiptStatusColumns" all-option />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getErpOptionLabel } from '@/pages-erp/utils/erp'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { getAccountSimpleList } from '@/api/erp/finance/account'
import { getCustomerSimpleList } from '@/api/erp/sale/customer'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getSimpleUserList } from '@/api/system/user'
import { getWarehouseSimpleList } from '@/api/erp/stock/warehouse'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false) // 搜索弹窗显示状态
const productOptions = ref<Record<string, any>[]>([]) // 产品选项
const customerOptions = ref<Record<string, any>[]>([]) // 客户选项
const warehouseOptions = ref<Record<string, any>[]>([]) // 仓库选项
const accountOptions = ref<Record<string, any>[]>([]) // 账户选项
const userOptions = ref<Record<string, any>[]>([]) // 创建人选项
const formData = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  outTime: [undefined, undefined] as [any, any],
  customerId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  orderNo: undefined as string | undefined,
  accountId: undefined as number | undefined,
  creator: undefined as number | undefined,
  status: -1,
  receiptStatus: -1,
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
    conditions.push(`产品:${getErpOptionLabel(productOptions.value, formData.productId)}`)
  }
  if (formData.outTime[0] && formData.outTime[1]) {
    conditions.push(`出库时间:${formatDate(formData.outTime[0])}~${formatDate(formData.outTime[1])}`)
  }
  if (formData.customerId) {
    conditions.push(`客户:${getErpOptionLabel(customerOptions.value, formData.customerId)}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${getErpOptionLabel(warehouseOptions.value, formData.warehouseId)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  if (formData.receiptStatus !== -1) {
    conditions.push(`收款:${getReceiptStatusLabel(formData.receiptStatus)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索销售出库'
})

/** 获取收款状态文本 */
function getReceiptStatusLabel(status: number) {
  if (status === 0) {
    return '未收款'
  }
  if (status === 1) {
    return '部分收款'
  }
  if (status === 2) {
    return '全部收款'
  }
  return '全部'
}

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
    status: formData.status === -1 ? undefined : formData.status,
    receiptStatus: formData.receiptStatus === -1 ? undefined : formData.receiptStatus,
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
  formData.status = -1
  formData.receiptStatus = -1
  formData.remark = undefined
  visible.value = false
  emit('reset')
}

/** 加载搜索下拉选项 */
onMounted(async () => {
  const [products, customers, warehouses, accounts, users] = await Promise.all([
    getProductSimpleList(),
    getCustomerSimpleList(),
    getWarehouseSimpleList(),
    getAccountSimpleList(),
    getSimpleUserList(),
  ])

  productOptions.value = products
  customerOptions.value = customers
  warehouseOptions.value = warehouses
  accountOptions.value = accounts
  userOptions.value = users
})
</script>
