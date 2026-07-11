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
      <ProductSearchPicker ref="productPickerRef" v-model="formData.productId" />
      <WarehouseSearchPicker ref="warehousePickerRef" v-model="formData.warehouseId" />
      <yd-search-picker v-model="formData.bizType" label="业务类型" :dict-type="DICT_TYPE.ERP_STOCK_RECORD_BIZ_TYPE" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          业务单号
        </view>
        <wd-input v-model="formData.bizNo" placeholder="请输入业务单号" clearable />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="出入库日期" />
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
import { formatDate, formatDateRange } from '@/utils/date'
import ProductSearchPicker from '@/pages-erp/product/product/components/product-search-picker.vue'
import WarehouseSearchPicker from '@/pages-erp/stock/warehouse/components/warehouse-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false) // 搜索弹窗显示状态
const productPickerRef = ref<InstanceType<typeof ProductSearchPicker>>() // 产品选择器
const warehousePickerRef = ref<InstanceType<typeof WarehouseSearchPicker>>() // 仓库选择器
const formData = reactive({
  productId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  bizType: undefined as number | undefined,
  bizNo: undefined as string | undefined,
  createTime: [undefined, undefined] as [any, any],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.productId) {
    conditions.push(`产品:${productPickerRef.value?.format(formData.productId) || formData.productId}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${warehousePickerRef.value?.format(formData.warehouseId) || formData.warehouseId}`)
  }
  if (formData.bizType !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.ERP_STOCK_RECORD_BIZ_TYPE, formData.bizType)}`)
  }
  if (formData.bizNo) {
    conditions.push(`单号:${formData.bizNo}`)
  }
  if (formData.createTime[0] && formData.createTime[1]) {
    conditions.push(`日期:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库存明细'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    productId: formData.productId,
    warehouseId: formData.warehouseId,
    bizType: formData.bizType,
    bizNo: formData.bizNo || undefined,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.productId = undefined
  formData.warehouseId = undefined
  formData.bizType = undefined
  formData.bizNo = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
