<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="库存流水"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 记录列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无库存流水"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between">
              <view class="text-32rpx text-[#333] font-semibold">
                {{ item.itemName || '-' }}
              </view>
              <text :class="getQuantityClass(item.quantity)" class="text-32rpx font-semibold">
                {{ formatQuantity(item.quantity) || '0.00' }}
              </text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">规格：</text>
              <text>{{ item.skuName || '-' }}</text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">仓库：</text>
              <text>{{ item.warehouseName || '-' }}</text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">变更：</text>
              <text>{{ formatQuantity(item.beforeQuantity) || '0.00' }} -> {{ formatQuantity(item.afterQuantity) || '0.00' }}</text>
            </view>
            <view class="grid grid-cols-3 mb-12rpx gap-12rpx text-24rpx text-[#999]">
              <text>数量 {{ formatQuantity(item.quantity) || '0.00' }}</text>
              <text>单价 {{ formatPrice(item.price) || '-' }}</text>
              <text>金额 {{ formatPrice(item.totalPrice) || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center gap-12rpx text-28rpx text-[#666]">
              <dict-tag :type="DICT_TYPE.WMS_ORDER_TYPE" :value="item.orderType" />
              <text>{{ item.orderNo || '-' }}</text>
            </view>
            <view class="text-24rpx text-[#999]">
              {{ formatDateTime(item.createTime) || '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { InventoryHistory } from '@/api/wms/inventory/history'
import { ref } from 'vue'
import { getInventoryHistoryPage } from '@/api/wms/inventory/history'
import { formatPrice, formatQuantity } from '@/pages-wms/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<InventoryHistory[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询库存流水 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getInventoryHistoryPage({
      ...queryParams.value,
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
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 获取数量颜色 */
function getQuantityClass(quantity?: number) {
  if (!quantity) {
    return 'text-[#666]'
  }
  return quantity > 0 ? 'text-green-600' : 'text-red-500'
}
</script>
