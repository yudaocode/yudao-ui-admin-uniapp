<template>
  <view class="w-full">
    <view v-for="(item, index) in items" :key="index" class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">退货明细 {{ index + 1 }}</text>
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
      <view class="grid grid-cols-2 mb-20rpx gap-16rpx">
        <view class="col-span-2 rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">产品</text>
          <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
            {{ item.productName || '-' }}
          </text>
        </view>
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
        <view v-if="item.outCount != null" class="rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">已出库</text>
          <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
            {{ formatCount(item.outCount) }}
          </text>
        </view>
        <view v-if="item.returnCount != null" class="rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">已退货</text>
          <text class="mt-8rpx block break-all text-28rpx text-[#333] font-semibold">
            {{ formatCount(item.returnCount) }}
          </text>
        </view>
      </view>
      <wd-form-item title="数量" title-width="180rpx" center>
        <wd-input-number v-model="item.count" :min="0.001" :precision="3" :disabled="disabled" />
      </wd-form-item>
      <wd-form-item title="产品单价" title-width="180rpx" center>
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
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import { loadErpItemStockCount, refreshErpItemAmount } from '@/pages-erp/utils/erp'
import { formatCount } from '@/pages-erp/utils/format'
import { formatMoney } from '@/utils/format'

const props = defineProps<{
  disabled?: boolean
  modelValue?: Record<string, any>[]
  warehouseOptions: Warehouse[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const toast = useToast()
const items = ref<Record<string, any>[]>([]) // 明细数据

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
}

/** 校验明细 */
function validate() {
  if (items.value.length === 0) {
    toast.warning('请选择可退货订单生成退货明细')
    return false
  }
  const invalidIndex = items.value.findIndex(item => !item.orderItemId || !item.warehouseId || !item.productId || !item.count)
  if (invalidIndex >= 0) {
    toast.warning(`请完善退货明细 ${invalidIndex + 1}`)
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
  value.forEach(item => refreshErpItemAmount(item))
  emit('update:modelValue', value)
}, { deep: true })

defineExpose({ validate })
</script>
