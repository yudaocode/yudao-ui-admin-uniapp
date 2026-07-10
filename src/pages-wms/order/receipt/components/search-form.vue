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
          入库单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入入库单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          业务单号
        </view>
        <wd-input v-model="formData.bizOrderNo" placeholder="请输入业务单号" clearable />
      </view>
      <yd-search-picker v-model="formData.status" label="单据状态" :dict-type="DICT_TYPE.WMS_ORDER_STATUS" all-option />
      <WarehouseSearchPicker ref="warehousePickerRef" v-model="formData.warehouseId" label="仓库" placeholder="请选择仓库" />
      <MerchantSearchPicker
        ref="merchantPickerRef"
        v-model="formData.merchantId"
        label="供应商"
        placeholder="请选择供应商"
        supplier
      />
      <yd-search-date-range v-model="formData.orderTime" label="单据日期" />
      <yd-search-picker v-model="formData.type" label="入库类型" :dict-type="DICT_TYPE.WMS_RECEIPT_ORDER_TYPE" all-option />
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
import MerchantSearchPicker from '@/pages-wms/md/merchant/components/merchant-search-picker.vue'
import WarehouseSearchPicker from '@/pages-wms/md/warehouse/components/warehouse-search-picker.vue'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const warehousePickerRef = ref<InstanceType<typeof WarehouseSearchPicker>>()
const merchantPickerRef = ref<InstanceType<typeof MerchantSearchPicker>>()
const formData = reactive({
  no: undefined as string | undefined,
  bizOrderNo: undefined as string | undefined,
  status: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  merchantId: undefined as number | undefined,
  orderTime: [undefined, undefined] as [number | undefined, number | undefined],
  type: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.bizOrderNo) {
    conditions.push(`业务:${formData.bizOrderNo}`)
  }
  if (formData.status !== undefined && formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, formData.status)}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${warehousePickerRef.value?.format(formData.warehouseId) || formData.warehouseId}`)
  }
  if (formData.merchantId) {
    conditions.push(`供应商:${merchantPickerRef.value?.format(formData.merchantId) || formData.merchantId}`)
  }
  if (formData.orderTime?.[0] && formData.orderTime?.[1]) {
    conditions.push(`日期:${formatDate(formData.orderTime[0])}~${formatDate(formData.orderTime[1])}`)
  }
  if (formData.type !== undefined && formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.WMS_RECEIPT_ORDER_TYPE, formData.type)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索入库单'
})

/** 清理全部选项值 */
function cleanPickerValue(value?: number) {
  return value === -1 ? undefined : value
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    status: cleanPickerValue(formData.status),
    type: cleanPickerValue(formData.type),
    orderTime: formatDateRange(formData.orderTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.bizOrderNo = undefined
  formData.status = undefined
  formData.warehouseId = undefined
  formData.merchantId = undefined
  formData.orderTime = [undefined, undefined]
  formData.type = undefined
  visible.value = false
  emit('reset')
}
</script>
