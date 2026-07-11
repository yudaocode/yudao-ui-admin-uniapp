<template>
  <!-- 余额流水列表 -->
  <z-paging
    ref="pagingRef"
    v-model="list"
    :fixed="false"
    class="min-h-0 flex-1"
    :default-page-size="10"
    :refresher-enabled="true"
    :inside-more="true"
    :loading-more-default-as-loading="true"
    empty-view-text="暂无余额流水"
    @query="queryList"
  >
    <view class="p-24rpx pb-160rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-16rpx flex items-center justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
            {{ item.title || '余额变动' }}
          </view>
          <wd-tag :type="(item.price || 0) > 0 ? 'success' : 'danger'" variant="plain">
            {{ formatSignedAmount(item.price) }}
          </wd-tag>
        </view>
        <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
          <text class="mr-8rpx text-[#999]">钱包余额：</text>
          <text>{{ formatAmount(item.balance) }}</text>
        </view>
        <view class="text-24rpx text-[#999]">
          {{ formatDateTime(item.createTime) || '-' }}
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { PayWalletTransaction } from '@/api/pay/wallet/transaction'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getPayWalletTransactionPage } from '@/api/pay/wallet/transaction'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  walletId?: number
}>()

const list = ref<PayWalletTransaction[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<PayWalletTransaction>>() // 分页组件引用

/** 金额分转元展示 */
function formatAmount(value?: number | string) {
  return `￥${(Number(value || 0) / 100).toFixed(2)}`
}

/** 变动金额展示 */
function formatSignedAmount(value?: number | string) {
  const amount = Number(value || 0)
  const sign = amount > 0 ? '+' : ''
  return `${sign}${formatAmount(amount)}`
}

/** 查询余额流水 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.walletId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getPayWalletTransactionPage({
      walletId: props.walletId,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 监听钱包变化，重新加载列表 */
watch(
  () => props.walletId,
  () => reload(),
)

/** 初始化 */
onMounted(() => {
  uni.$on('member:user:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('member:user:reload', reload)
})
</script>
