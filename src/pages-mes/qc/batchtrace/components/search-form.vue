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
          批次号
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入批次号"
          clearable
        />
      </view>
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="产品物料" placeholder="请选择产品物料" title="选择产品物料" />
      <VendorSearchPicker ref="vendorSearchPickerRef" v-model="formData.vendorId" label="供应商" placeholder="请选择供应商" />
      <ClientSearchPicker ref="clientSearchPickerRef" v-model="formData.clientId" label="客户" placeholder="请选择客户" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          销售订单编号
        </view>
        <wd-input
          v-model="formData.salesOrderCode"
          placeholder="请输入销售订单编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          采购订单编号
        </view>
        <wd-input
          v-model="formData.purchaseOrderCode"
          placeholder="请输入采购订单编号"
          clearable
        />
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
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import ClientSearchPicker from '@/pages-mes/md/client/components/client-search-picker.vue'
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'
import VendorSearchPicker from '@/pages-mes/md/vendor/components/vendor-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  code: undefined,
  itemId: undefined,
  vendorId: undefined,
  clientId: undefined,
  salesOrderCode: undefined,
  purchaseOrderCode: undefined,
}) // 搜索表单数据
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 物料搜索选择器
const vendorSearchPickerRef = ref<InstanceType<typeof VendorSearchPicker>>() // 供应商搜索选择器
const clientSearchPickerRef = ref<InstanceType<typeof ClientSearchPicker>>() // 客户搜索选择器

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code !== undefined && formData.code !== '') {
    conditions.push(`批次号:${formData.code}`)
  }
  if (formData.itemId !== undefined) {
    conditions.push(`产品物料:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  if (formData.vendorId !== undefined) {
    conditions.push(`供应商:${vendorSearchPickerRef.value?.format(formData.vendorId) || formData.vendorId}`)
  }
  if (formData.clientId !== undefined) {
    conditions.push(`客户:${clientSearchPickerRef.value?.format(formData.clientId) || formData.clientId}`)
  }
  if (formData.salesOrderCode !== undefined && formData.salesOrderCode !== '') {
    conditions.push(`销售订单编号:${formData.salesOrderCode}`)
  }
  if (formData.purchaseOrderCode !== undefined && formData.purchaseOrderCode !== '') {
    conditions.push(`采购订单编号:${formData.purchaseOrderCode}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索批次追溯'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    itemId: formData.itemId,
    vendorId: formData.vendorId,
    clientId: formData.clientId,
    salesOrderCode: formData.salesOrderCode || undefined,
    purchaseOrderCode: formData.purchaseOrderCode || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.itemId = undefined
  formData.vendorId = undefined
  formData.clientId = undefined
  formData.salesOrderCode = undefined
  formData.purchaseOrderCode = undefined
  visible.value = false
  emit('reset')
}
</script>
