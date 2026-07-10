<!-- CRM 产品清单编辑组件：合同/商机表单中维护产品明细（增删行、选产品带出编码/单位/单价、填售价或合同价与数量，自动计算行小计、产品总额与折扣后金额） -->
<template>
  <view class="mt-24rpx bg-white">
    <!-- 产品清单 -->
    <view class="flex items-center justify-between px-24rpx py-20rpx">
      <text class="text-30rpx text-[#333] font-semibold">产品清单</text>
      <wd-button size="small" type="primary" @click="handleAdd">
        添加
      </wd-button>
    </view>
    <view
      v-for="(row, index) in products"
      :key="index"
      class="mx-24rpx mb-20rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
    >
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">产品 {{ index + 1 }}</text>
        <wd-button size="small" type="danger" variant="plain" @click="handleDelete(index)">
          删除
        </wd-button>
      </view>
      <ProductFormPicker
        v-model="row.productId"
        label-width="220rpx"
        :prop="`products.${index}.productId`"
        @change="product => handleProductChange(row, product)"
      />
      <wd-cell title="产品编码" title-width="220rpx" :value="row.productNo || '-'" />
      <wd-cell title="产品单位" title-width="220rpx" :value="getDictLabel(DICT_TYPE.CRM_PRODUCT_UNIT, row.productUnit) || '-'" />
      <wd-cell title="产品单价" title-width="220rpx" :value="formatMoney(row.productPrice)" />
      <wd-form-item :title="priceLabel" title-width="220rpx">
        <wd-input-number
          v-model="row[priceProp]"
          :min="0.001"
          :precision="2"
          input-type="number"
          allow-null
          :placeholder="`请输入${priceLabel}`"
        />
      </wd-form-item>
      <wd-form-item title="数量" title-width="220rpx">
        <wd-input-number
          v-model="row.count"
          :min="0.001"
          :precision="3"
          input-type="number"
          allow-null
          placeholder="请输入数量"
        />
      </wd-form-item>
      <wd-cell title="合计" title-width="220rpx" :value="formatMoney(row.totalPrice)" />
    </view>
    <wd-empty v-if="products.length === 0" icon="content" tip="暂无产品" />
    <view class="border-t border-[#f5f5f5] px-24rpx py-20rpx">
      <view class="mb-12rpx flex items-center justify-between text-28rpx">
        <text class="text-[#999]">产品总金额</text>
        <text class="text-[#333]">{{ formatMoney(totalProductPrice) }}</text>
      </view>
      <view class="flex items-center justify-between text-28rpx">
        <text class="text-[#999]">折扣后金额</text>
        <text class="text-[#333]">{{ formatMoney(totalPrice) }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/crm/product'
import { computed, watch } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import ProductFormPicker from '@/pages-crm/product/components/product-form-picker.vue'
import { DICT_TYPE } from '@/utils/constants'
import { formatMoney } from '@/utils/format'

interface ProductLine {
  [key: string]: any
  count?: number
  productId?: number
  productName?: string
  productNo?: string
  productPrice?: number
  productUnit?: number
  totalPrice?: number
}

const props = withDefaults(defineProps<{
  discountPercent?: number
  priceProp: 'businessPrice' | 'contractPrice'
}>(), {
  discountPercent: 0,
})

const emit = defineEmits<{
  (e: 'totals-change', totalProductPrice: number, totalPrice: number): void
}>()

const products = defineModel<ProductLine[]>({ default: () => [] })
const priceLabel = computed(() => props.priceProp === 'businessPrice' ? '售价' : '合同价')
const totalProductPrice = computed(() => {
  return round2(products.value.reduce((total, row) => total + Number(row.totalPrice || 0), 0))
})
const totalPrice = computed(() => {
  const discountPercent = Number(props.discountPercent || 0)
  return round2(totalProductPrice.value - totalProductPrice.value * discountPercent / 100)
})

/** 金额保留两位小数，避免浮点误差 */
function round2(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100
}

watch(
  products,
  (rows) => {
    rows.forEach((row) => {
      const price = Number(row[props.priceProp] || 0)
      const count = Number(row.count || 0)
      row.totalPrice = price && count ? round2(price * count) : undefined
    })
    emit('totals-change', totalProductPrice.value, totalPrice.value)
  },
  { deep: true, immediate: true },
)

watch(
  () => props.discountPercent,
  () => {
    emit('totals-change', totalProductPrice.value, totalPrice.value)
  },
)

/** 校验产品行：每行需选产品、价格与数量大于 0；requireAtLeastOne 时还要求至少一行。返回错误文案，无误返回 null */
function validate(options?: { requireAtLeastOne?: boolean }): string | null {
  if (products.value.length === 0) {
    return options?.requireAtLeastOne ? '请至少添加一个产品' : null
  }
  for (let i = 0; i < products.value.length; i++) {
    const row = products.value[i]
    if (!row.productId) {
      return `请选择第 ${i + 1} 个产品`
    }
    if (!(Number(row[props.priceProp]) > 0)) {
      return `请填写第 ${i + 1} 个产品的${priceLabel.value}`
    }
    if (!(Number(row.count) > 0)) {
      return `请填写第 ${i + 1} 个产品的数量`
    }
  }
  return null
}

defineExpose({ validate })

/** 添加产品 */
function handleAdd() {
  products.value.push({
    count: 1,
  })
}

/** 删除产品 */
function handleDelete(index: number) {
  products.value.splice(index, 1)
}

/** 产品变更 */
function handleProductChange(row: ProductLine, product?: Product) {
  if (!product?.id) {
    return
  }
  row.productId = product.id
  row.productName = product.name
  row.productNo = product.no
  row.productUnit = product.unit
  row.productPrice = Number(product.price || 0)
  row[props.priceProp] = Number(product.price || 0)
}
</script>
