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
          退货单编号
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入退货单编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退货单名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入退货单名称"
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
      <VendorSearchPicker ref="vendorSearchPickerRef" v-model="formData.vendorId" label="供应商" placeholder="请选择供应商" />
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
import VendorSearchPicker from '@/pages-mes/md/vendor/components/vendor-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const vendorSearchPickerRef = ref<InstanceType<typeof VendorSearchPicker>>() // 供应商搜索选择器
const formData = reactive<Record<string, any>>({
  code: undefined,
  name: undefined,
  purchaseOrderCode: undefined,
  vendorId: undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.purchaseOrderCode) {
    conditions.push(`采购订单:${formData.purchaseOrderCode}`)
  }
  if (formData.vendorId != null) {
    conditions.push(`供应商:${vendorSearchPickerRef.value?.format(formData.vendorId) || formData.vendorId}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索采购退货'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    purchaseOrderCode: formData.purchaseOrderCode || undefined,
    vendorId: formData.vendorId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.purchaseOrderCode = undefined
  formData.vendorId = undefined
  visible.value = false
  emit('reset')
}
</script>
