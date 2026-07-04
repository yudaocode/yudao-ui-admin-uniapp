<template>
  <view class="w-full">
    <view v-if="!items.length" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999] shadow-sm">
      请选择销售出库或销售退货单
    </view>
    <view v-for="(item, index) in items" :key="index" class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-20rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1">
          <text class="text-28rpx text-[#333] font-semibold">收款明细 {{ index + 1 }}</text>
          <text class="mt-8rpx block break-all text-24rpx text-[#666]">
            {{ item.bizNo || '-' }}
          </text>
        </view>
        <wd-button v-if="!disabled" size="small" type="danger" variant="plain" @click="handleRemove(index)">
          删除
        </wd-button>
      </view>
      <view class="mb-20rpx inline-flex rounded-8rpx bg-[#f5f7fa] px-16rpx py-8rpx text-24rpx text-[#666]">
        {{ getBizTypeName(item.bizType) }}
      </view>
      <view class="grid grid-cols-2 mb-20rpx gap-16rpx">
        <view class="rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">应收金额</text>
          <text class="mt-8rpx block text-28rpx text-[#333] font-semibold">{{ formatMoney(item.totalPrice) }}</text>
        </view>
        <view class="rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">已收金额</text>
          <text class="mt-8rpx block text-28rpx text-[#333] font-semibold">{{ formatMoney(item.receiptedPrice) }}</text>
        </view>
      </view>
      <view class="mb-20rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
        <text class="text-26rpx text-[#666]">本次收款</text>
        <wd-input-number v-model="item.receiptPrice" :precision="2" :disabled="disabled" />
      </view>
      <wd-input v-model="item.remark" label="备注" label-width="80rpx" placeholder="请输入备注" clearable :disabled="disabled" />
    </view>

    <SaleOutReceiptPicker ref="saleOutSelectorRef" @success="handleAddSaleOut" />
    <SaleReturnRefundPicker ref="saleReturnSelectorRef" @success="handleAddSaleReturn" />
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import SaleOutReceiptPicker from '@/pages-erp/sale/out/components/sale-out-receipt-picker.vue'
import SaleReturnRefundPicker from '@/pages-erp/sale/return/components/sale-return-refund-picker.vue'
import { formatMoney, toNumber } from '@/utils/format'
import { ErpBizType } from '@/utils/constants'

const props = defineProps<{
  disabled?: boolean
  modelValue?: Record<string, any>[]
  customerId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const toast = useToast()
const items = ref<Record<string, any>[]>([])
const saleOutSelectorRef = ref<InstanceType<typeof SaleOutReceiptPicker>>()
const saleReturnSelectorRef = ref<InstanceType<typeof SaleReturnRefundPicker>>()

/** 获取业务类型名称 */
function getBizTypeName(value?: number) {
  if (value === ErpBizType.SALE_OUT) {
    return '销售出库'
  }
  if (value === ErpBizType.SALE_RETURN) {
    return '销售退货'
  }
  return '-'
}

/** 打开销售出库选择器 */
function openSaleOutPicker() {
  if (!props.customerId) {
    toast.warning('请先选择客户')
    return
  }
  saleOutSelectorRef.value?.open(props.customerId)
}

/** 打开销售退货选择器 */
function openSaleReturnPicker() {
  if (!props.customerId) {
    toast.warning('请先选择客户')
    return
  }
  saleReturnSelectorRef.value?.open(props.customerId)
}

/** 添加销售出库明细 */
function handleAddSaleOut(rows: Record<string, any>[]) {
  rows.forEach((row) => {
    const receiptedPrice = toNumber(row.receiptPrice)
    items.value.push({
      bizId: row.id,
      bizType: ErpBizType.SALE_OUT,
      bizNo: row.no,
      totalPrice: toNumber(row.totalPrice),
      receiptedPrice,
      receiptPrice: toNumber(row.totalPrice) - receiptedPrice,
    })
  })
}

/** 添加销售退货明细 */
function handleAddSaleReturn(rows: Record<string, any>[]) {
  rows.forEach((row) => {
    const refundPrice = toNumber(row.refundPrice)
    items.value.push({
      bizId: row.id,
      bizType: ErpBizType.SALE_RETURN,
      bizNo: row.no,
      totalPrice: -toNumber(row.totalPrice),
      receiptedPrice: -refundPrice,
      receiptPrice: -toNumber(row.totalPrice) + refundPrice,
    })
  })
}

/** 删除明细 */
function handleRemove(index: number) {
  items.value.splice(index, 1)
}

/** 校验明细 */
function validate() {
  if (items.value.length === 0) {
    toast.warning('请至少添加一条收款明细')
    return false
  }
  const invalidIndex = items.value.findIndex(item => item.receiptPrice === undefined || item.receiptPrice === null || item.receiptPrice === '')
  if (invalidIndex >= 0) {
    toast.warning(`请完善收款明细 ${invalidIndex + 1}`)
    return false
  }
  return true
}

/** 同步外部明细 */
watch(() => props.modelValue, (value) => {
  items.value = Array.isArray(value) ? value : []
}, { immediate: true })

/** 明细变更后回写表单 */
watch(items, (value) => {
  emit('update:modelValue', value)
}, { deep: true })

defineExpose({ openSaleOutPicker, openSaleReturnPicker, validate })
</script>
