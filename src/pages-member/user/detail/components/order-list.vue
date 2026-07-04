<template>
  <view>
    <OrderSearchForm @search="handleQuery" @reset="handleReset" />
    <scroll-view scroll-y class="min-h-520rpx">
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.no || `订单 ${item.id}` }}
            </view>
            <dict-tag :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">支付金额：</text>
            <text>{{ formatAmount(item.payPrice) }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">商品数量：</text>
            <text>{{ item.productCount ?? '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">配送方式：</text>
            <dict-tag :type="DICT_TYPE.TRADE_DELIVERY_TYPE" :value="item.deliveryType" />
          </view>
          <view v-if="item.items?.length" class="mb-12rpx text-26rpx text-[#666]">
            {{ item.items.map(goods => goods.spuName).filter(Boolean).join('、') }}
          </view>
          <view class="text-24rpx text-[#999]">
            {{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view class="mt-16rpx text-right text-24rpx text-[#1890ff]">
            查看详情
          </view>
        </view>
        <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无订单记录" />
        <view v-if="hasMore" class="pb-24rpx">
          <wd-button block variant="plain" :loading="loading" @click="loadMore">
            加载更多
          </wd-button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { TradeOrder } from '@/api/mall/trade/order'
import { computed, onMounted, ref, watch } from 'vue'
import { getTradeOrderPage } from '@/api/mall/trade/order'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import OrderSearchForm from './order-search-form.vue'

const props = defineProps<{
  userId?: number | any
}>()

const list = ref<TradeOrder[]>([]) // 列表数据
const loading = ref(false) // 加载状态
const total = ref(0) // 总条数
const pageNo = ref(1) // 当前页码
const pageSize = 10 // 每页条数
const queryParams = ref<Record<string, any>>({}) // 查询参数
const hasMore = computed(() => list.value.length < total.value)

/** 金额分转元展示 */
function formatAmount(value?: number | string) {
  return `￥${(Number(value || 0) / 100).toFixed(2)}`
}

/** 查询订单记录 */
async function getList(reset = true) {
  if (!props.userId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const currentPageNo = reset ? 1 : pageNo.value + 1
    const data = await getTradeOrderPage({
      ...queryParams.value,
      userId: Number(props.userId),
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

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 查看订单详情 */
function handleDetail(item: TradeOrder) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mall/trade/order/detail/index?id=${item.id}`,
  })
}

watch(
  () => props.userId,
  () => {
    getList()
  },
)

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
