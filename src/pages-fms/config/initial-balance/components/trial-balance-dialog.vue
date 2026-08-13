<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <view class="w-96rpx" />
        <view class="text-32rpx text-[#333] font-semibold">
          试算平衡
        </view>
        <wd-button variant="plain" size="small" @click="visible = false">
          关闭
        </wd-button>
      </view>

      <view class="p-24rpx">
        <!-- 平衡结果 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-32rpx text-center shadow-sm">
          <view class="text-32rpx font-semibold" :class="result?.balanced ? 'text-[#34a853]' : 'text-[#fa8c16]'">
            {{ result?.balanced ? '期初余额试算平衡' : '期初余额试算不平衡' }}
          </view>
          <view class="mt-12rpx text-26rpx text-[#999]">
            {{ result?.balanced ? '借贷金额相等，可以开始记账' : '请检查期初余额和累计发生额' }}
          </view>
        </view>

        <!-- 试算明细 -->
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="flex py-12rpx text-26rpx text-[#999]">
            <text class="min-w-0 flex-1">项目</text>
            <text class="w-170rpx text-right">借方</text>
            <text class="w-170rpx text-right">贷方</text>
            <text class="w-150rpx text-right">差额</text>
          </view>
          <view
            v-for="row in rows"
            :key="row.name"
            class="flex border-t border-[#f0f0f0] border-t-solid py-16rpx text-26rpx text-[#333]"
          >
            <text class="min-w-0 flex-1">{{ row.name }}</text>
            <text class="w-170rpx text-right">{{ row.debitAmount }}</text>
            <text class="w-170rpx text-right">{{ row.creditAmount }}</text>
            <text class="w-150rpx text-right">{{ row.differenceAmount }}</text>
          </view>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { TrialBalance } from '@/api/fms/config/initial-balance'
import { getTrialBalance } from '@/api/fms/config/initial-balance'
import { formatFmsAmount } from '@/pages-fms/utils/format'

const visible = ref(false) // 弹窗显示状态
const result = ref<TrialBalance>() // 试算平衡结果
const rows = computed(() => // 试算平衡明细行
  result.value
    ? [
        {
          name: '期初余额（综合本位币）',
          debitAmount: formatFmsAmount(result.value.openingDebitAmount),
          creditAmount: formatFmsAmount(result.value.openingCreditAmount),
          differenceAmount: formatFmsAmount(result.value.openingDifferenceAmount),
        },
        {
          name: '累计发生额（综合本位币）',
          debitAmount: formatFmsAmount(result.value.yearDebitAmount),
          creditAmount: formatFmsAmount(result.value.yearCreditAmount),
          differenceAmount: formatFmsAmount(result.value.yearDifferenceAmount),
        },
      ]
    : [],
)

/** 打开弹窗 */
async function open(accountSetId: number) {
  result.value = await getTrialBalance(accountSetId)
  visible.value = true
}

defineExpose({ open })
</script>
