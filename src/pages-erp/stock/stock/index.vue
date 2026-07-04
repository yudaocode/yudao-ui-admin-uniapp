<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="产品库存" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 产品库存列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无产品库存数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm" @click="handleDetail(item)">
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.productName || '-' }}
              </view>
              <view class="rounded-full bg-[#f1f5f9] px-16rpx py-6rpx text-24rpx text-[#475569]">
                {{ item.unitName || '-' }}
              </view>
            </view>
            <view class="grid grid-cols-2 mb-12rpx gap-12rpx text-28rpx text-[#666]">
              <view>
                <text class="text-[#999]">分类：</text>{{ item.categoryName || '-' }}
              </view>
              <view>
                <text class="text-[#999]">仓库：</text>{{ item.warehouseName || '-' }}
              </view>
            </view>
            <view class="rounded-12rpx bg-[#f8fafc] p-20rpx text-center">
              <view class="text-22rpx text-[#999]">
                当前库存
              </view>
              <view class="mt-6rpx text-40rpx text-[#9254de] font-semibold">
                {{ formatCount(item.count) }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Stock } from '@/api/erp/stock/stock'
import { ref } from 'vue'
import { getStockPage } from '@/api/erp/stock/stock'
import { navigateBackPlus } from '@/utils'
import SearchForm from './components/search-form.vue'
import { formatCount } from '@/pages-erp/utils/format'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<Stock[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询产品库存列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getStockPage({ ...queryParams.value, pageNo, pageSize })
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

/** 查看详情 */
function handleDetail(item: Stock) {
  uni.navigateTo({ url: `/pages-erp/stock/stock/detail/index?id=${item.id}` })
}
</script>
