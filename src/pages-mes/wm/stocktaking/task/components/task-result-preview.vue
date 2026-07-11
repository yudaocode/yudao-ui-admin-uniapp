<template>
  <view class="mt-24rpx bg-white">
    <view v-if="showTitle" class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        盘点结果
      </view>
    </view>
    <!-- 盘点结果列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      :auto="false"
      height="640rpx"
      :default-page-size="10"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多盘点结果了"
      empty-view-text="暂无盘点结果"
      @query="queryList"
    >
      <view class="px-24rpx py-8rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-medium">
                {{ item.itemCode || '-' }}
              </view>
              <view class="mt-4rpx truncate text-26rpx text-[#666]">
                {{ item.itemName || '-' }}
              </view>
            </view>
            <view class="shrink-0 text-right text-26rpx">
              <view class="text-[#999]">
                账面：{{ item.quantity ?? '-' }}
              </view>
              <view class="mt-4rpx text-28rpx text-[#1677ff] font-semibold">
                实盘：{{ item.takingQuantity ?? '-' }}
              </view>
            </view>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.unitMeasureName || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">批次：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">库存位置：</text>
            <text class="min-w-0 flex-1 truncate">
              {{ item.warehouseName || '-' }} / {{ item.locationName || '-' }} / {{ item.areaName || '-' }}
            </text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { StockTakingResult } from '@/api/mes/wm/stocktaking/task/result'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getStockTakingResultPage } from '@/api/mes/wm/stocktaking/task/result'

const props = withDefaults(defineProps<{
  taskId?: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const list = ref<StockTakingResult[]>([]) // 结果数据
const pagingRef = ref<ZPagingRef<StockTakingResult>>() // 分页组件引用

/** 查询盘点结果 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.taskId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getStockTakingResultPage({
      pageNo,
      pageSize,
      taskId: props.taskId,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 监听任务编号变化 */
watch(
  () => props.taskId,
  async () => {
    list.value = []
    await nextTick()
    reload()
  },
  { immediate: true },
)

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:stocktaking:task:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:stocktaking:task:reload', reload)
})
</script>
