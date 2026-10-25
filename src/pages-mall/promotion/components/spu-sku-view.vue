<!-- 活动商品展示：促销活动详情复用，按 SPU 分组渲染商品图/名与每个 SKU 的规格、原价、库存及活动配置（只读，对标 spu-sku-editor 的展示部分） -->
<template>
  <view>
    <view v-if="loading" class="py-32rpx text-center text-26rpx text-[#999]">
      加载商品中...
    </view>
    <template v-else>
      <view
        v-for="group in groups"
        :key="group.spuId"
        class="mb-16rpx overflow-hidden rounded-8rpx bg-[#f7f8fa]"
      >
        <!-- SPU 头部 -->
        <view class="flex items-center gap-16rpx p-16rpx">
          <view v-if="group.picUrl" class="shrink-0">
            <wd-img :src="group.picUrl" width="96rpx" height="96rpx" radius="8rpx" mode="aspectFill" />
          </view>
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-medium">
              {{ group.spuName || `商品 #${group.spuId}` }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              商品编号：{{ group.spuId }}
            </view>
          </view>
        </view>

        <!-- SKU 行：规格 + 原价/库存 + 活动配置字段 -->
        <view
          v-for="(row, index) in group.rows"
          :key="row.skuId ?? index"
          class="border-t border-[#eee] p-16rpx"
        >
          <view class="mb-12rpx flex items-center gap-12rpx">
            <view v-if="row.picUrl" class="shrink-0">
              <wd-img :src="row.picUrl" width="72rpx" height="72rpx" radius="8rpx" mode="aspectFill" />
            </view>
            <view class="min-w-0 flex-1">
              <view class="truncate text-26rpx text-[#333]">
                {{ row.skuName || `SKU #${row.skuId}` }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                原价 {{ formatDisplayMoney(row.marketPrice ?? row.price) }} / 库存 {{ row.stock ?? '-' }}
              </view>
            </view>
          </view>
          <!-- 活动配置：由父级声明式 fields 渲染 -->
          <view v-if="fields.length" class="flex flex-wrap gap-x-24rpx gap-y-8rpx text-26rpx">
            <template v-for="field in fields" :key="field.label">
              <view v-if="!field.show || field.show(row.product)" class="flex items-center gap-6rpx">
                <text class="text-[#999]">{{ field.label }}：</text>
                <text class="text-[#333]">{{ formatField(field, row.product) }}</text>
              </view>
            </template>
          </view>
        </view>
      </view>

      <view v-if="!groups.length" class="py-32rpx text-center text-26rpx text-[#999]">
        暂无商品
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { ProductSpu } from '@/api/mall/product/spu'
import { computed, ref, watch } from 'vue'
import { getProductSpuDetailList } from '@/api/mall/product/spu'
import { formatDisplayMoney } from '@/utils/format'

/** 活动配置字段：声明式渲染每个 SKU 的活动值 */
export interface SpuSkuViewField {
  label: string
  prop?: string // 取值字段名（product[prop]）
  type?: 'money' | 'percent' | 'percentScaled' // money：分转元加￥；percent：值直接加 %；percentScaled：后端按 ×100 存储的百分比，÷100 后加 %
  formatter?: (product: Record<string, any>) => string // 完全自定义取值（如字典）
  show?: (product: Record<string, any>) => boolean // 条件展示（如折扣金额/百分比二选一）
}

interface SkuRow {
  skuId?: number
  skuName?: string
  picUrl?: string
  price?: number
  marketPrice?: number
  stock?: number
  product: Record<string, any> // 原始活动商品对象，字段取值用
}

interface SpuGroup {
  spuId?: number
  spuName?: string
  picUrl?: string
  rows: SkuRow[]
}

const props = withDefaults(defineProps<{
  products?: Record<string, any>[] // 活动商品（含 spuId/skuId 与活动配置，金额单位为分）
  fields?: SpuSkuViewField[] // 每个 SKU 展示的活动配置字段
}>(), {
  products: () => [],
  fields: () => [],
})

const loading = ref(false) // 商品详情加载状态
const spuMap = ref<Record<number, ProductSpu>>({}) // spuId -> SPU 详情（含 skus）

const groups = computed<SpuGroup[]>(() => {
  const order: number[] = []
  const grouped: Record<number, Record<string, any>[]> = {}
  for (const product of props.products) {
    const spuId = parseId(product.spuId) || 0
    if (!grouped[spuId]) {
      grouped[spuId] = []
      order.push(spuId)
    }
    grouped[spuId].push(product)
  }
  return order.map((spuId) => {
    const spu = spuMap.value[spuId]
    const skus = spu?.skus || []
    const rows: SkuRow[] = grouped[spuId].map((product) => {
      const sku = skus.find(item => item.id === parseId(product.skuId))
      return {
        skuId: product.skuId,
        skuName: sku?.name || (sku?.properties || []).map(p => p.valueName).filter(Boolean).join(' ') || (product.skuId != null ? `SKU #${product.skuId}` : ''),
        picUrl: sku?.picUrl || spu?.picUrl,
        // 缺 SKU 或缺价格时保留 undefined，让 formatDisplayMoney 显示「-」而非误报 ￥0.00
        price: sku?.price != null ? Number(sku.price) : undefined,
        marketPrice: sku?.marketPrice != null ? Number(sku.marketPrice) : undefined,
        stock: sku?.stock,
        product,
      }
    })
    return { spuId, spuName: spu?.name, picUrl: spu?.picUrl, rows }
  })
})

/** 渲染单个字段值 */
function formatField(field: SpuSkuViewField, product: Record<string, any>) {
  if (field.formatter) {
    return field.formatter(product)
  }
  const value = field.prop ? product[field.prop] : undefined
  if (field.type === 'money') {
    return formatDisplayMoney(value)
  }
  if (field.type === 'percent') {
    return value != null ? `${value}%` : '-'
  }
  if (field.type === 'percentScaled') {
    return value != null ? `${value / 100}%` : '-'
  }
  return value != null && value !== '' ? String(value) : '-'
}

/** 加载所有涉及的 SPU 详情（仅拉取未缓存的，按 ids 批量一次取） */
async function loadSpus(list: Record<string, any>[]) {
  const ids = Array.from(new Set(list.map(item => parseId(item.spuId) as number).filter(Boolean)))
  const missing = ids.filter(id => !spuMap.value[id])
  if (!missing.length) {
    return
  }
  loading.value = true
  try {
    const details = await getProductSpuDetailList(missing)
    const next = { ...spuMap.value }
    details.forEach((detail) => {
      if (detail.id != null) {
        next[detail.id] = detail
      }
    })
    spuMap.value = next
  } finally {
    loading.value = false
  }
}

watch(() => props.products, (list) => {
  if (list?.length) {
    loadSpus(list)
  }
}, { immediate: true })
</script>
