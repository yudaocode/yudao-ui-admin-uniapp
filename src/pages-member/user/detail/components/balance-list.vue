<template>
  <scroll-view scroll-y class="min-h-520rpx">
    <view class="p-24rpx">
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
      <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无余额流水" />
      <view v-if="hasMore" class="pb-24rpx">
        <wd-button block variant="plain" :loading="loading" @click="loadMore">
          加载更多
        </wd-button>
      </view>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { PayWalletTransaction } from '@/api/pay/wallet/transaction'
import { computed, onMounted, ref, watch } from 'vue'
import { getPayWalletTransactionPage } from '@/api/pay/wallet/transaction'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  walletId?: number
}>()

const list = ref<PayWalletTransaction[]>([]) // 列表数据
const loading = ref(false) // 加载状态
const total = ref(0) // 总条数
const pageNo = ref(1) // 当前页码
const pageSize = 10 // 每页条数
const hasMore = computed(() => list.value.length < total.value)

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
async function getList(reset = true) {
  if (!props.walletId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const currentPageNo = reset ? 1 : pageNo.value + 1
    const data = await getPayWalletTransactionPage({
      walletId: props.walletId,
      pageNo: currentPageNo,
      pageSize,
    })
    list.value = reset ? data.list : [...list.value, ...data.list]
    total.value = data.total
    pageNo.value = currentPageNo
  } finally {
    loading.value = false
  }
}

/** 加载更多 */
function loadMore() {
  getList(false)
}

watch(
  () => props.walletId,
  () => {
    getList()
  },
)

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
