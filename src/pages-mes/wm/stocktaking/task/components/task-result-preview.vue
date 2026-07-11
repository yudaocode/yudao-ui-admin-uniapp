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
      <wd-button v-if="hasMore" block size="small" :loading="loadingMore" variant="plain" @click="loadMore">
        加载更多
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { StockTakingResult } from '@/api/mes/wm/stocktaking/task/result'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getStockTakingResultPage } from '@/api/mes/wm/stocktaking/task/result'

const props = withDefaults(defineProps<{
  taskId?: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const list = ref<StockTakingResult[]>([]) // 结果数据
const loading = ref(false) // 加载状态
const loadingMore = ref(false) // 加载更多状态
const total = ref(0) // 结果总数
const pageNo = ref(1) // 当前页码
const hasMore = computed(() => list.value.length < total.value)

/** 加载盘点结果 */
async function loadList(currentPage = 1) {
  if (!props.taskId) {
    list.value = []
    total.value = 0
    pageNo.value = 1
    return
  }
  const firstPage = currentPage === 1
  if (firstPage) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  try {
    const data = await getStockTakingResultPage({
      pageNo: currentPage,
      pageSize: 20,
      taskId: props.taskId,
    })
    pageNo.value = currentPage
    total.value = data.total
    list.value = firstPage ? data.list : [...list.value, ...data.list]
  } finally {
    if (firstPage) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

/** 加载更多 */
function loadMore() {
  if (!hasMore.value || loading.value || loadingMore.value) {
    return
  }
  loadList(pageNo.value + 1)
}

/** 监听任务编号变化 */
watch(() => props.taskId, () => loadList(), { immediate: true })

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:stocktaking:task:reload', loadList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:stocktaking:task:reload', loadList)
})
</script>
