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
      <yd-search-picker v-model="formData.productId" label="产品" :columns="productOptions" label-key="name" value-key="id" placeholder="请选择产品" />
      <yd-search-picker v-model="formData.warehouseId" label="仓库" :columns="warehouseOptions" label-key="name" value-key="id" placeholder="请选择仓库" />
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
import { getErpOptionLabel } from '@/pages-erp/utils/erp'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getWarehouseSimpleList } from '@/api/erp/stock/warehouse'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false) // 搜索弹窗显示状态
const productOptions = ref<Record<string, any>[]>([]) // 产品选项
const warehouseOptions = ref<Record<string, any>[]>([]) // 仓库选项
const formData = reactive({
  productId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.productId) {
    conditions.push(`产品:${getErpOptionLabel(productOptions.value, formData.productId)}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${getErpOptionLabel(warehouseOptions.value, formData.warehouseId)}`)
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

/** 加载搜索下拉选项 */
onMounted(async () => {
  const [products, warehouses] = await Promise.all([
    getProductSimpleList(),
    getWarehouseSimpleList(),
  ])

  productOptions.value = products
  warehouseOptions.value = warehouses
})
</script>
