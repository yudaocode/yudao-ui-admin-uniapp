<template>
  <view class="mt-24rpx bg-white">
    <view v-if="showTitle" class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        盘点清单
      </view>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无盘点清单
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
          <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_LINE_STATUS" :value="item.status" />
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
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">在库数量：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
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
import type { StockTakingTaskLine } from '@/api/mes/wm/stocktaking/task/line'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getStockTakingTaskLineSimpleList } from '@/api/mes/wm/stocktaking/task/line'
import { DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  taskId?: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const list = ref<StockTakingTaskLine[]>([]) // 清单数据
const loading = ref(false) // 加载状态

/** 加载盘点清单 */
async function loadList() {
  if (!props.taskId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getStockTakingTaskLineSimpleList(props.taskId)
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
