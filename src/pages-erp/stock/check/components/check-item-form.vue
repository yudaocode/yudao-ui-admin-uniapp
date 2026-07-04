<template>
  <view class="w-full">
    <view v-for="(item, index) in items" :key="index" class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">盘点明细 {{ index + 1 }}</text>
        <wd-button v-if="!disabled && items.length > 1" size="small" type="danger" variant="plain" @click="handleRemove(index)">
          删除
        </wd-button>
      </view>

      <yd-form-picker
        v-model="item.warehouseId"
        label="仓库"
        label-width="180rpx"
        :columns="warehouseOptions" label-key="name" value-key="id"
        placeholder="请选择仓库"
        :disabled="disabled"
        @confirm="value => handleWarehouseConfirm(index, value)"
      />

      <yd-form-picker
        v-model="item.productId"
        label="产品"
        label-width="180rpx"
        :columns="productOptions" label-key="name" value-key="id"
        placeholder="请选择产品"
        :disabled="disabled"
        @confirm="value => handleProductConfirm(index, value)"
      />

      <view class="grid grid-cols-2 mb-20rpx gap-16rpx">
        <view class="rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">账面库存</text>
          <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
            {{ formatCount(item.stockCount) }}
          </text>
        </view>
        <view class="rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">单位</text>
          <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
            {{ item.productUnitName || '-' }}
          </text>
        </view>
        <view class="col-span-2 rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">条码</text>
          <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
            {{ item.productBarCode || '-' }}
          </text>
        </view>
      </view>

      <wd-form-item title="实际库存" title-width="180rpx" center>
        <wd-input-number v-model="item.actualCount" :precision="3" :disabled="disabled" />
      </wd-form-item>
      <view class="mb-20rpx rounded-8rpx bg-[#f8f8f8] p-16rpx">
        <text class="block text-24rpx text-[#999]">盈亏数量</text>
        <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
          {{ formatCount(item.count) }}
        </text>
      </view>
      <wd-form-item title="产品单价" title-width="180rpx" center>
        <wd-input-number v-model="item.productPrice" :min="0.01" :precision="2" :disabled="disabled" />
      </wd-form-item>
      <view class="mb-20rpx rounded-8rpx bg-[#f8f8f8] p-16rpx">
        <text class="block text-24rpx text-[#999]">合计金额</text>
        <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
          {{ formatMoney(item.totalPrice) }}
        </text>
      </view>
      <wd-form-item title="备注" title-width="180rpx">
        <wd-input v-model="item.remark" placeholder="请输入备注" clearable :disabled="disabled" />
      </wd-form-item>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/erp/product/product'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import { loadErpItemStockCount } from '@/pages-erp/utils/erp'
import { formatCount, roundCount, roundPrice } from '@/pages-erp/utils/format'
import { formatMoney, isFiniteNumberValue, toNumber } from '@/utils/format'

const props = defineProps<{
  disabled?: boolean
  modelValue?: Record<string, any>[]
  productOptions: Product[]
  warehouseOptions: Warehouse[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const toast = useToast()
const items = ref<Record<string, any>[]>([]) // 明细数据

/** 创建默认明细 */
function createDefaultItem() {
  const defaultWarehouse = props.warehouseOptions.find(item => item.defaultStatus)
  return {
    id: undefined,
    warehouseId: defaultWarehouse?.id,
    productId: undefined,
    productName: undefined,
    productUnitName: undefined,
    productBarCode: undefined,
    productPrice: undefined,
    stockCount: undefined,
    actualCount: undefined,
    count: undefined,
    totalPrice: undefined,
    remark: undefined,
  }
}

/** 补充默认仓库 */
function applyDefaultWarehouse() {
  const defaultWarehouse = props.warehouseOptions.find(item => item.defaultStatus)
  if (!defaultWarehouse?.id) {
    return
  }
  items.value.forEach((item) => {
    if (!item.warehouseId) {
      item.warehouseId = defaultWarehouse.id
    }
  })
}

/** 新增明细 */
function handleAdd() {
  items.value.push(createDefaultItem())
}

/** 删除明细 */
function handleRemove(index: number) {
  items.value.splice(index, 1)
}

/** 选择仓库 */
async function handleWarehouseConfirm(index: number, warehouseId?: number | string) {
  const item = items.value[index]
  if (!item) {
    return
  }
  item.warehouseId = warehouseId
  await loadErpItemStockCount(item)
  if (isFiniteNumberValue(item.stockCount)) {
    item.actualCount = item.stockCount
  }
  refreshItemAmount(item)
}

/** 选择产品 */
async function handleProductConfirm(index: number, productId?: number | string) {
  const item = items.value[index]
  if (!item) {
    return
  }
  item.productId = productId
  const product = props.productOptions.find(option => String(option.id) === String(productId))
  if (product) {
    item.productName = product.name
    item.productUnitName = product.unitName
    item.productBarCode = product.barCode
    item.productPrice = product.minPrice
  }
  await loadErpItemStockCount(item)
  if (isFiniteNumberValue(item.stockCount)) {
    item.actualCount = item.stockCount
  }
  refreshItemAmount(item)
}

/** 刷新单条明细金额 */
function refreshItemAmount(item: Record<string, any>) {
  if (isFiniteNumberValue(item.stockCount) && isFiniteNumberValue(item.actualCount)) {
    item.count = roundCount(toNumber(item.actualCount) - toNumber(item.stockCount))
  } else {
    item.count = undefined
  }
  if (isFiniteNumberValue(item.count) && isFiniteNumberValue(item.productPrice)) {
    item.totalPrice = roundPrice(toNumber(item.count) * toNumber(item.productPrice))
  }
}

/** 校验明细 */
function validate() {
  if (items.value.length === 0) {
    toast.warning('请至少添加一个盘点产品')
    return false
  }
  const invalidIndex = items.value.findIndex(item => !item.warehouseId || !item.productId || !isFiniteNumberValue(item.actualCount))
  if (invalidIndex >= 0) {
    toast.warning(`请完善盘点明细 ${invalidIndex + 1}`)
    return false
  }
  return true
}

/** 同步外部明细 */
watch(() => props.modelValue, (value) => {
  items.value = Array.isArray(value) ? value : []
  applyDefaultWarehouse()
}, { immediate: true })

/** 仓库选项变化后回填默认仓库 */
watch(() => props.warehouseOptions, applyDefaultWarehouse, { deep: true })

/** 明细变更后回写表单 */
watch(items, (value) => {
  value.forEach(item => refreshItemAmount(item))
  emit('update:modelValue', value)
}, { deep: true })

/** 初始化 */
onMounted(() => {
  if (items.value.length === 0 && !props.disabled) {
    handleAdd()
  }
})

defineExpose({ handleAdd, validate })
</script>
