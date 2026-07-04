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
      <yd-search-picker v-model="formData.productId" label="产品" :columns="productOptions" label-key="name" value-key="id" placeholder="请选择产品" />
      <yd-search-date-range v-model="formData.orderTime" label="订单时间" />
      <yd-search-picker v-model="formData.customerId" label="客户" :columns="customerOptions" label-key="name" value-key="id" placeholder="请选择客户" />
      <yd-search-picker v-model="formData.creator" label="创建人" :columns="userOptions" label-key="nickname" value-key="id" placeholder="请选择创建人" />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.ERP_AUDIT_STATUS" all-option />
      <yd-search-picker v-model="formData.outStatus" label="出库数量" :columns="getProgressStatusColumns('出库')" all-option />
      <yd-search-picker v-model="formData.returnStatus" label="退货数量" :columns="getProgressStatusColumns('退货')" all-option />
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
import { getCustomerSimpleList } from '@/api/erp/sale/customer'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getSimpleUserList } from '@/api/system/user'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false) // 搜索弹窗显示状态
const productOptions = ref<Record<string, any>[]>([]) // 产品选项
const customerOptions = ref<Record<string, any>[]>([]) // 客户选项
const userOptions = ref<Record<string, any>[]>([]) // 创建人选项
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
    conditions.push(`产品:${getErpOptionLabel(productOptions.value, formData.productId)}`)
  }
  if (formData.orderTime[0] && formData.orderTime[1]) {
    conditions.push(`订单时间:${formatDate(formData.orderTime[0])}~${formatDate(formData.orderTime[1])}`)
  }
  if (formData.customerId) {
    conditions.push(`客户:${getErpOptionLabel(customerOptions.value, formData.customerId)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  if (formData.outStatus !== -1) {
    conditions.push(`出库:${getProgressStatusLabel(formData.outStatus, '出库')}`)
  }
  if (formData.returnStatus !== -1) {
    conditions.push(`退货:${getProgressStatusLabel(formData.returnStatus, '退货')}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索销售订单'
})

/** 获取进度状态文本 */
function getProgressStatusLabel(status: number, label: string) {
  if (status === 0) {
    return `未${label}`
  }
  if (status === 1) {
    return `部分${label}`
  }
  if (status === 2) {
    return `全部${label}`
  }
  return '全部'
}

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

/** 加载搜索下拉选项 */
onMounted(async () => {
  const [products, customers, users] = await Promise.all([
    getProductSimpleList(),
    getCustomerSimpleList(),
    getSimpleUserList(),
  ])

  productOptions.value = products
  customerOptions.value = customers
  userOptions.value = users
})
</script>
