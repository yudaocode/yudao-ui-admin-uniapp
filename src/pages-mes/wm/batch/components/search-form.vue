<template>
  <!-- 搜索框入口 -->
  <view class="bg-white px-24rpx py-16rpx" @click="openSearch">
    <view class="flex items-center rounded-36rpx bg-[#f5f5f5] px-24rpx py-14rpx text-28rpx text-[#999]">
      <wd-icon name="search" size="32rpx" />
      <text class="ml-12rpx min-w-0 flex-1 truncate">
        {{ placeholder }}
      </text>
    </view>
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
          批次编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入批次编号" clearable />
      </view>
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="物料" placeholder="请选择物料" />
      <VendorSearchPicker ref="vendorSearchPickerRef" v-model="formData.vendorId" label="供应商" placeholder="请选择供应商" />
      <ClientSearchPicker ref="clientSearchPickerRef" v-model="formData.clientId" label="客户" placeholder="请选择客户" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          生产批号
        </view>
        <wd-input v-model="formData.lotNumber" placeholder="请输入生产批号" clearable />
      </view>
      <yd-search-picker
        ref="qualityStatusSearchPickerRef"
        v-model="formData.qualityStatus"
        label="质量状态"
        :dict-type="DICT_TYPE.MES_WM_QUALITY_STATUS"
        all-option
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          采购订单编号
        </view>
        <wd-input v-model="formData.purchaseOrderCode" placeholder="请输入采购订单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          销售订单编号
        </view>
        <wd-input v-model="formData.salesOrderCode" placeholder="请输入销售订单编号" clearable />
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
import ClientSearchPicker from '@/pages-mes/md/client/components/client-search-picker.vue'
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'
import VendorSearchPicker from '@/pages-mes/md/vendor/components/vendor-search-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

interface BatchSearchFormData {
  code?: string
  itemId?: number
  vendorId?: number
  clientId?: number
  lotNumber?: string
  qualityStatus?: number
  purchaseOrderCode?: string
  salesOrderCode?: string
}

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 物料搜索选择器
const vendorSearchPickerRef = ref<InstanceType<typeof VendorSearchPicker>>() // 供应商搜索选择器
const clientSearchPickerRef = ref<InstanceType<typeof ClientSearchPicker>>() // 客户搜索选择器
const qualityStatusSearchPickerRef = ref<YdSearchPickerExpose>() // 质量状态搜索选择器
const formData = reactive<BatchSearchFormData>({}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`批次:${formData.code}`)
  }
  if (formData.itemId) {
    conditions.push(`物料:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  if (formData.vendorId) {
    conditions.push(`供应商:${vendorSearchPickerRef.value?.format(formData.vendorId) || formData.vendorId}`)
  }
  if (formData.clientId) {
    conditions.push(`客户:${clientSearchPickerRef.value?.format(formData.clientId) || formData.clientId}`)
  }
  if (formData.lotNumber) {
    conditions.push(`生产批号:${formData.lotNumber}`)
  }
  if (formData.qualityStatus !== undefined && formData.qualityStatus !== -1) {
    conditions.push(`质量:${qualityStatusSearchPickerRef.value?.format(formData.qualityStatus) || formData.qualityStatus}`)
  }
  if (formData.purchaseOrderCode) {
    conditions.push(`采购订单:${formData.purchaseOrderCode}`)
  }
  if (formData.salesOrderCode) {
    conditions.push(`销售订单:${formData.salesOrderCode}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索批次管理'
})

/** 打开搜索弹层 */
function openSearch() {
  visible.value = true
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    qualityStatus: formData.qualityStatus === -1 ? undefined : formData.qualityStatus,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.itemId = undefined
  formData.vendorId = undefined
  formData.clientId = undefined
  formData.lotNumber = undefined
  formData.qualityStatus = undefined
  formData.purchaseOrderCode = undefined
  formData.salesOrderCode = undefined
  visible.value = false
  emit('reset')
}
</script>
