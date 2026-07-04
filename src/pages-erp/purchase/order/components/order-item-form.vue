<template>
  <view class="w-full">
    <view v-for="(item, index) in items" :key="index" class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">采购明细 {{ index + 1 }}</text>
        <wd-button v-if="!disabled && items.length > 1" size="small" type="danger" variant="plain" @click="handleRemove(index)">
          删除
        </wd-button>
      </view>

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
          <text class="block text-24rpx text-[#999]">库存</text>
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

      <wd-form-item title="数量" title-width="180rpx" center>
        <wd-input-number v-model="item.count" :min="0.001" :precision="3" :disabled="disabled" />
      </wd-form-item>
      <wd-form-item title="采购单价" title-width="180rpx" center>
        <wd-input-number v-model="item.productPrice" :min="0.01" :precision="2" :disabled="disabled" />
      </wd-form-item>
      <wd-form-item title="税率(%)" title-width="180rpx" center>
        <wd-input-number v-model="item.taxPercent" :min="0" :precision="2" :disabled="disabled" />
      </wd-form-item>
      <view class="grid grid-cols-2 mb-20rpx gap-16rpx">
        <view class="rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">金额</text>
          <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
            {{ formatMoney(item.totalProductPrice) }}
          </text>
        </view>
        <view class="rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">税额</text>
          <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
            {{ formatMoney(item.taxPrice) }}
          </text>
        </view>
        <view class="col-span-2 rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">含税金额</text>
          <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
            {{ formatMoney(item.totalPrice) }}
          </text>
        </view>
      </view>
      <wd-form-item title="备注" title-width="180rpx">
        <wd-input v-model="item.remark" placeholder="请输入备注" clearable :disabled="disabled" />
      </wd-form-item>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/erp/product/product'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import { getStockCount } from '@/api/erp/stock/stock'
import { formatCount, roundPrice } from '@/pages-erp/utils/format'
import { formatMoney, toNumber } from '@/utils/format'

const props = defineProps<{
  disabled?: boolean
  modelValue?: Record<string, any>[]
  productOptions: Product[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const toast = useToast()
const items = ref<Record<string, any>[]>([])

/** 创建默认采购明细 */
function createDefaultItem() {
  return {
    id: undefined,
    productId: undefined,
    productName: undefined,
    productUnitName: undefined,
    productBarCode: undefined,
    productPrice: undefined,
    stockCount: undefined,
    count: 1,
    totalProductPrice: undefined,
    taxPercent: 0,
    taxPrice: undefined,
    totalPrice: undefined,
    remark: undefined,
  }
}

/** 新增明细 */
function handleAdd() {
  items.value.push(createDefaultItem())
}

/** 删除明细 */
function handleRemove(index: number) {
  items.value.splice(index, 1)
}

/** 选择产品后回填产品基础信息与库存 */
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
    item.productPrice = product.purchasePrice
  }
  if (productId) {
    item.stockCount = await getStockCount(Number(productId))
  }
}

/** 刷新单条明细金额 */
function refreshItemAmount(item: Record<string, any>) {
  const count = toNumber(item.count)
  const price = toNumber(item.productPrice)
  if (item.count !== undefined && item.productPrice !== undefined) {
    item.totalProductPrice = roundPrice(count * price)
    item.taxPrice = roundPrice(item.totalProductPrice * toNumber(item.taxPercent) / 100)
    item.totalPrice = roundPrice(item.totalProductPrice + item.taxPrice)
  }
}

/** 校验明细 */
function validate() {
  if (items.value.length === 0) {
    toast.warning('请至少添加一个采购产品')
    return false
  }
  const invalidIndex = items.value.findIndex(item => !item.productId || !item.count || !item.productPrice)
  if (invalidIndex >= 0) {
    toast.warning(`请完善采购明细 ${invalidIndex + 1}`)
    return false
  }
  return true
}

/** 同步外部明细 */
watch(() => props.modelValue, (value) => {
  items.value = Array.isArray(value) ? value : []
}, { immediate: true })

/** 明细变更后刷新金额并回写表单 */
watch(items, (value) => {
  value.forEach(item => refreshItemAmount(item))
  emit('update:modelValue', value)
}, { deep: true })

/** 初始化默认明细 */
onMounted(() => {
  if (items.value.length === 0 && !props.disabled) {
    handleAdd()
  }
})

defineExpose({ handleAdd, validate })
</script>
