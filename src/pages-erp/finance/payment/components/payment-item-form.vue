<template>
  <view class="w-full">
    <view v-if="!items.length" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999] shadow-sm">
      请选择采购入库或采购退货单
    </view>
    <view v-for="(item, index) in items" :key="index" class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-20rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1">
          <text class="text-28rpx text-[#333] font-semibold">付款明细 {{ index + 1 }}</text>
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
          <text class="block text-24rpx text-[#999]">应付金额</text>
          <text class="mt-8rpx block text-28rpx text-[#333] font-semibold">{{ formatMoney(item.totalPrice) }}</text>
        </view>
        <view class="rounded-8rpx bg-[#f8f8f8] p-16rpx">
          <text class="block text-24rpx text-[#999]">已付金额</text>
          <text class="mt-8rpx block text-28rpx text-[#333] font-semibold">{{ formatMoney(item.paidPrice) }}</text>
        </view>
      </view>
      <view class="mb-20rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
        <text class="text-26rpx text-[#666]">本次付款</text>
        <wd-input-number v-model="item.paymentPrice" :precision="2" :disabled="disabled" />
      </view>
      <wd-input v-model="item.remark" label="备注" label-width="80rpx" placeholder="请输入备注" clearable :disabled="disabled" />
    </view>

    <PurchaseInPaymentPicker ref="purchaseInSelectorRef" @success="handleAddPurchaseIn" />
    <PurchaseReturnRefundPicker ref="purchaseReturnSelectorRef" @success="handleAddPurchaseReturn" />
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import PurchaseInPaymentPicker from '@/pages-erp/purchase/in/components/purchase-in-payment-picker.vue'
import PurchaseReturnRefundPicker from '@/pages-erp/purchase/return/components/purchase-return-refund-picker.vue'
import { formatMoney, toNumber } from '@/utils/format'
import { ErpBizType } from '@/utils/constants'

const props = defineProps<{
  disabled?: boolean
  modelValue?: Record<string, any>[]
  supplierId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const toast = useToast()
const items = ref<Record<string, any>[]>([])
const purchaseInSelectorRef = ref<InstanceType<typeof PurchaseInPaymentPicker>>()
const purchaseReturnSelectorRef = ref<InstanceType<typeof PurchaseReturnRefundPicker>>()

/** 获取业务类型名称 */
function getBizTypeName(value?: number) {
  if (value === ErpBizType.PURCHASE_IN) {
    return '采购入库'
  }
  if (value === ErpBizType.PURCHASE_RETURN) {
    return '采购退货'
  }
  return '-'
}

/** 打开采购入库选择器 */
function openPurchaseInPicker() {
  if (!props.supplierId) {
    toast.warning('请先选择供应商')
    return
  }
  purchaseInSelectorRef.value?.open(props.supplierId)
}

/** 打开采购退货选择器 */
function openPurchaseReturnPicker() {
  if (!props.supplierId) {
    toast.warning('请先选择供应商')
    return
  }
  purchaseReturnSelectorRef.value?.open(props.supplierId)
}

/** 添加采购入库明细 */
function handleAddPurchaseIn(rows: Record<string, any>[]) {
  rows.forEach((row) => {
    const paidPrice = toNumber(row.paymentPrice)
    items.value.push({
      bizId: row.id,
      bizType: ErpBizType.PURCHASE_IN,
      bizNo: row.no,
      totalPrice: toNumber(row.totalPrice),
      paidPrice,
      paymentPrice: toNumber(row.totalPrice) - paidPrice,
    })
  })
}

/** 添加采购退货明细 */
function handleAddPurchaseReturn(rows: Record<string, any>[]) {
  rows.forEach((row) => {
    const refundPrice = toNumber(row.refundPrice)
    items.value.push({
      bizId: row.id,
      bizType: ErpBizType.PURCHASE_RETURN,
      bizNo: row.no,
      totalPrice: -toNumber(row.totalPrice),
      paidPrice: -refundPrice,
      paymentPrice: -toNumber(row.totalPrice) + refundPrice,
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
    toast.warning('请至少添加一条付款明细')
    return false
  }
  const invalidIndex = items.value.findIndex(item => item.paymentPrice === undefined || item.paymentPrice === null || item.paymentPrice === '')
  if (invalidIndex >= 0) {
    toast.warning(`请完善付款明细 ${invalidIndex + 1}`)
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

defineExpose({ openPurchaseInPicker, openPurchaseReturnPicker, validate })
</script>
