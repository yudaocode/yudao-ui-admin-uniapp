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
          调拨单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入调拨单号" clearable />
      </view>
      <ProductSearchPicker ref="productPickerRef" v-model="formData.productId" />
      <yd-search-date-range v-model="formData.moveTime" label="调拨时间" />
      <WarehouseSearchPicker ref="warehousePickerRef" v-model="formData.fromWarehouseId" />
      <UserSearchPicker v-model="formData.creator" label="创建人" />
      <yd-search-picker v-model="formData.status" label="审核状态" :dict-type="DICT_TYPE.ERP_AUDIT_STATUS" all-option />
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
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { UserSearchPicker } from '@/components/system-select'
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
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  moveTime: [undefined, undefined] as [any, any],
  fromWarehouseId: undefined as number | undefined,
  creator: undefined as number | undefined,
  status: undefined as number | undefined,
  remark: undefined as string | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${productPickerRef.value?.format(formData.productId) || formData.productId}`)
  }
  if (formData.moveTime[0] && formData.moveTime[1]) {
    conditions.push(`调拨时间:${formatDate(formData.moveTime[0])}~${formatDate(formData.moveTime[1])}`)
  }
  if (formData.fromWarehouseId) {
    conditions.push(`仓库:${warehousePickerRef.value?.format(formData.fromWarehouseId) || formData.fromWarehouseId}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库存调拨'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    productId: formData.productId,
    moveTime: formatDateRange(formData.moveTime),
    fromWarehouseId: formData.fromWarehouseId,
    creator: formData.creator != null ? String(formData.creator) : undefined,
    status: formData.status,
    remark: formData.remark || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.productId = undefined
  formData.moveTime = [undefined, undefined]
  formData.fromWarehouseId = undefined
  formData.creator = undefined
  formData.status = undefined
  formData.remark = undefined
  visible.value = false
  emit('reset')
}
</script>
