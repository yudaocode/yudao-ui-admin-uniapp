<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <!-- 搜索组件 -->
    <AfterSaleSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 售后记录列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无售后记录"
      @query="queryList"
    >
      <view class="p-24rpx pb-160rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.no || `售后 ${item.id}` }}
            </view>
            <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            {{ item.spuName || '-' }}
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">订单编号：</text>
            <text>{{ item.orderNo || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">退款金额：</text>
            <text>{{ formatAmount(item.refundPrice) }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">售后方式：</text>
            <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_WAY" :value="item.way" />
          </view>
          <view class="text-24rpx text-[#999]">
            {{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view class="mt-16rpx text-right text-24rpx text-[#1890ff]">
            处理退款
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { TradeAfterSale } from '@/api/mall/trade/after-sale'
import { ref, watch } from 'vue'
import { getTradeAfterSalePage } from '@/api/mall/trade/after-sale'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import AfterSaleSearchForm from './after-sale-search-form.vue'

const props = defineProps<{
  userId?: number | any
}>()

const list = ref<TradeAfterSale[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<TradeAfterSale>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 金额分转元展示 */
function formatAmount(value?: number | string) {
  return `￥${(Number(value || 0) / 100).toFixed(2)}`
}

/** 查询售后记录 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.userId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getTradeAfterSalePage({
      ...queryParams.value,
      userId: Number(props.userId),
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看售后详情 */
function handleDetail(item: TradeAfterSale) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mall/trade/after-sale/detail/index?id=${item.id}`,
  })
}

/** 监听会员变化，重新加载列表 */
watch(
  () => props.userId,
  () => reload(),
)
</script>
