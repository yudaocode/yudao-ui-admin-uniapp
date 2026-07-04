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
      <yd-search-picker v-model="formData.productId" label="产品" :columns="productOptions" label-key="name" value-key="id" placeholder="请选择产品" />
      <yd-search-date-range v-model="formData.orderTime" label="订单时间" />
      <yd-search-picker v-model="formData.supplierId" label="供应商" :columns="supplierOptions" label-key="name" value-key="id" placeholder="请选择供应商" />
      <yd-search-picker v-model="formData.creator" label="创建人" :columns="userOptions" label-key="nickname" value-key="id" placeholder="请选择创建人" />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.ERP_AUDIT_STATUS" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          备注
        </view>
        <wd-input v-model="formData.remark" placeholder="请输入备注" clearable />
      </view>
      <yd-search-picker v-model="formData.inStatus" label="入库数量" :columns="getProgressStatusColumns('入库')" all-option />
      <yd-search-picker v-model="formData.returnStatus" label="退货数量" :columns="getProgressStatusColumns('退货')" all-option />
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
import { getProductSimpleList } from '@/api/erp/product/product'
import { getSupplierSimpleList } from '@/api/erp/purchase/supplier'
import { getSimpleUserList } from '@/api/system/user'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false)
const productOptions = ref<Record<string, any>[]>([]) // 产品选项
const supplierOptions = ref<Record<string, any>[]>([]) // 供应商选项
const userOptions = ref<Record<string, any>[]>([]) // 创建人选项
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
    conditions.push(`产品:${getErpOptionLabel(productOptions.value, formData.productId)}`)
  }
  if (formData.orderTime[0] && formData.orderTime[1]) {
    conditions.push(`订单时间:${formatDate(formData.orderTime[0])}~${formatDate(formData.orderTime[1])}`)
  }
  if (formData.supplierId) {
    conditions.push(`供应商:${getErpOptionLabel(supplierOptions.value, formData.supplierId)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
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

/** 加载搜索下拉选项 */
onMounted(async () => {
  const [products, suppliers, users] = await Promise.all([
    getProductSimpleList(),
    getSupplierSimpleList(),
    getSimpleUserList(),
  ])

  productOptions.value = products
  supplierOptions.value = suppliers
  userOptions.value = users
})
</script>
