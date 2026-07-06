<template>
  <view class="min-h-0 flex flex-1 flex-col bg-white">
    <view class="flex items-center border-b border-b-[#f0f0f0] px-24rpx py-20rpx" :class="showTitle ? 'justify-between' : 'justify-end'">
      <view v-if="showTitle" class="text-30rpx text-[#333] font-semibold">
        采购入库记录
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
      empty-view-text="暂无采购入库记录"
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
                {{ item.receiptCode || `入库单 #${item.receiptId}` }}
              </view>
              <view class="mt-4rpx truncate text-26rpx text-[#666]">
                {{ item.purchaseOrderCode || '无采购订单号' }}
              </view>
            </view>
            <view class="shrink-0 text-24rpx text-[#999]">
              {{ item.unitMeasureName || '-' }}
            </view>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">物料编码：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.itemCode || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">物料名称：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.itemName || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">入库数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.receivedQuantity ?? '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WmItemReceiptLine } from '@/api/mes/wm/itemreceipt/line'
import { nextTick, ref, watch } from 'vue'
import { getItemReceiptLinePage } from '@/api/mes/wm/itemreceipt/line'

const props = withDefaults(defineProps<{
  vendorId?: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const list = ref<WmItemReceiptLine[]>([]) // 采购入库行
const total = ref(0) // 总条数
const pagingRef = ref<ZPagingRef<WmItemReceiptLine>>() // 分页组件引用

/** 查询采购入库记录 */
async function queryList(currentPageNo: number, currentPageSize: number) {
  if (!props.vendorId) {
    total.value = 0
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getItemReceiptLinePage({
      pageNo: currentPageNo,
      pageSize: currentPageSize,
      vendorId: props.vendorId,
    })
    total.value = data.total
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 查看采购入库详情 */
function handleDetail(item: WmItemReceiptLine) {
  if (!item.receiptId) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/wm/itemreceipt/detail/index?id=${item.receiptId}` })
}

/** 监听供应商编号变化 */
watch(
  () => props.vendorId,
  async () => {
    total.value = 0
    list.value = []
    await nextTick()
    pagingRef.value?.reload()
  },
  { immediate: true },
)
</script>
