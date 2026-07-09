<template>
  <view class="mt-24rpx bg-white">
    <view v-if="showTitle" class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        盘点结果
      </view>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无盘点结果
    </view>
    <view v-else class="px-24rpx py-8rpx">
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
          <view class="shrink-0 text-28rpx text-[#1677ff] font-semibold">
            {{ item.quantity ?? '-' }}
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
  </view>
</template>

<script lang="ts" setup>
import type { StockTakingResult } from '@/api/mes/wm/stocktaking/task/result'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getStockTakingResultPage } from '@/api/mes/wm/stocktaking/task/result'

const props = withDefaults(defineProps<{
  taskId?: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const list = ref<StockTakingResult[]>([]) // 结果数据
const loading = ref(false) // 加载状态

/** 加载盘点结果 */
async function loadList() {
  if (!props.taskId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getStockTakingResultPage({
      pageNo: 1,
      pageSize: 50,
      taskId: props.taskId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 监听任务编号变化 */
watch(() => props.taskId, loadList)

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:stocktaking:task:reload', loadList)
  loadList()
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:stocktaking:task:reload', loadList)
})
</script>
