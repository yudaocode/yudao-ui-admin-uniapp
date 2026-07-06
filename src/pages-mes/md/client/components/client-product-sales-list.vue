<template>
  <view class="min-h-0 flex flex-1 flex-col bg-white">
    <view class="flex items-center border-b border-b-[#f0f0f0] px-24rpx py-20rpx" :class="showTitle ? 'justify-between' : 'justify-end'">
      <view v-if="showTitle" class="text-30rpx text-[#333] font-semibold">
        销售出库记录
      </view>
      <view class="text-24rpx text-[#999]">
        共 {{ total }} 条
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="5"
      :refresher-enabled="false"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无销售出库记录"
      @query="queryList"
    >
      <view class="px-24rpx py-8rpx pb-160rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
          @click="handleDetail(item)"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-medium">
                {{ item.code || `出库单 #${item.id}` }}
              </view>
              <view class="mt-4rpx truncate text-26rpx text-[#666]">
                {{ item.name || '-' }}
              </view>
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS" :value="item.status" />
            <text v-else class="shrink-0 text-24rpx text-[#999]">-</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">销售订单：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.salesOrderCode || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">出库日期：</text>
            <text class="min-w-0 flex-1 truncate">{{ formatDate(item.salesDate) || '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">创建时间：</text>
            <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WmProductSales } from '@/api/mes/wm/productsales'
import { nextTick, ref, watch } from 'vue'
import { getProductSalesPage } from '@/api/mes/wm/productsales'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

const props = withDefaults(defineProps<{
  clientId?: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const list = ref<WmProductSales[]>([]) // 销售出库单
const total = ref(0) // 总条数
const pagingRef = ref<ZPagingRef<WmProductSales>>() // 分页组件引用

/** 查询销售出库记录 */
async function queryList(currentPageNo: number, currentPageSize: number) {
  if (!props.clientId) {
    total.value = 0
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getProductSalesPage({
      pageNo: currentPageNo,
      pageSize: currentPageSize,
      clientId: props.clientId,
    })
    total.value = data.total
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 查看销售出库详情 */
function handleDetail(item: WmProductSales) {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/detail/index?id=${item.id}` })
}

/** 监听客户编号变化 */
watch(
  () => props.clientId,
  async () => {
    total.value = 0
    list.value = []
    await nextTick()
    pagingRef.value?.reload()
  },
  { immediate: true },
)
</script>
