<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="入库单"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 入库单列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无入库单数据"
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
            <view class="mb-12rpx flex items-center gap-12rpx text-28rpx text-[#666]">
              <dict-tag :type="DICT_TYPE.WMS_RECEIPT_ORDER_TYPE" :value="item.type" />
              <text>{{ formatDate(item.orderTime) || '-' }}</text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">业务单号：</text>
              <text>{{ item.bizOrderNo || '-' }}</text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">仓库：</text>
              <text>{{ item.warehouseName || '-' }}</text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">供应商：</text>
              <text>{{ item.merchantName || '-' }}</text>
            </view>
            <view class="flex items-center justify-between text-28rpx text-[#666]">
              <text>数量：{{ formatQuantity(item.totalQuantity) || '0.00' }}</text>
              <text>金额：{{ formatPrice(item.totalPrice) || '0.00' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['wms:receipt-order:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ReceiptOrder } from '@/api/wms/order/receipt'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getReceiptOrderPage } from '@/api/wms/order/receipt'
import { useAccess } from '@/hooks/useAccess'
import { formatPrice, formatQuantity } from '@/pages-wms/utils/format'
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
const list = ref<ReceiptOrder[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询入库单列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReceiptOrderPage({
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

/** 新增入库单 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-wms/order/receipt/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: ReceiptOrder) {
  uni.navigateTo({
    url: `/pages-wms/order/receipt/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('wms:receipt-order:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('wms:receipt-order:reload', reload)
})
</script>
