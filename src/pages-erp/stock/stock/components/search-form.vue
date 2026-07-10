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
  return conditions.length > 0 ? conditions.join(' | ') : '搜索产品库存'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    productId: formData.productId,
    warehouseId: formData.warehouseId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.productId = undefined
  formData.warehouseId = undefined
  visible.value = false
  emit('reset')
}
</script>
