<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="钱包流水"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm :default-wallet-id="walletId" @search="handleQuery" @reset="handleReset" />

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无钱包流水数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.title || `钱包流水 #${item.id}` }}
              </view>
              <view v-if="item.walletId != null" class="mt-6rpx truncate text-24rpx text-[#999]">
                钱包编号：{{ item.walletId }}
              </view>
            </view>
            <view class="text-32rpx text-[#fa8c16] font-semibold">
              {{ formatDisplayMoney(item.price) }}
            </view>
          </view>

          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">钱包余额：</text>
            <text>{{ formatDisplayMoney(item.balance) }}</text>
          </view>
          <view class="flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">交易时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { PayWalletTransaction } from '@/api/pay/wallet/transaction'
import { ref } from 'vue'
import { getPayWalletTransactionPage } from '@/api/pay/wallet/transaction'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { formatDisplayMoney } from '@/utils/format'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  walletId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<PayWalletTransaction[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>(props.walletId ? { walletId: parseId(props.walletId) } : {}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询钱包流水列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPayWalletTransactionPage({ ...queryParams.value, pageNo, pageSize })
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
</script>
