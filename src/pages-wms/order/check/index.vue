<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="盘库单"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 盘库单列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无盘库单数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between">
              <view class="text-32rpx text-[#333] font-semibold">
                {{ item.no || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.WMS_ORDER_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">仓库：</text>
              <text>{{ item.warehouseName || '-' }}</text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">单据日期：</text>
              <text>{{ formatDate(item.orderTime) || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center justify-between text-28rpx text-[#666]">
              <text>总金额：{{ formatPrice(item.totalPrice) || '0.00' }}</text>
              <text>实际金额：{{ formatPrice(item.actualPrice) || '0.00' }}</text>
            </view>
            <view class="flex items-center justify-between text-28rpx text-[#666]">
              <text>盈亏数：<text :class="getLossClass(item.totalQuantity)">{{ formatQuantity(item.totalQuantity) || '0.00' }}</text></text>
              <text>盈亏额：<text :class="getLossClass(getDifferencePrice(item))">{{ formatPrice(getDifferencePrice(item)) || '0.00' }}</text></text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['wms:check-order:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { CheckOrder } from '@/api/wms/order/check'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getCheckOrderPage } from '@/api/wms/order/check'
import { useAccess } from '@/hooks/useAccess'
import { formatPrice, formatQuantity, getLossClass, roundPrice } from '@/pages-wms/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<CheckOrder[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询盘库单列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getCheckOrderPage({
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

/** 获取盈亏金额 */
function getDifferencePrice(item: CheckOrder) {
  return roundPrice(Number(item.actualPrice || 0) - Number(item.totalPrice || 0))
}

/** 新增盘库单 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-wms/order/check/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: CheckOrder) {
  uni.navigateTo({
    url: `/pages-wms/order/check/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('wms:check-order:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('wms:check-order:reload', reload)
})
</script>
