<template>
  <view class="mt-24rpx">
    <view class="mb-16rpx px-24rpx text-28rpx text-[#333] font-semibold">
      产品产出
    </view>
    <view v-if="loading" class="flex justify-center py-24rpx">
      <wd-loading />
    </view>
    <view v-else-if="list.length === 0" class="rounded-12rpx bg-white py-48rpx">
      <wd-empty icon="content" tip="暂无产品产出记录" />
    </view>
    <view v-else class="space-y-16rpx">
      <view v-for="item in list" :key="item.id" class="rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
            {{ item.itemCode || '-' }}
          </view>
          <dict-tag v-if="item.qualityStatus != null" :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="item.qualityStatus" />
        </view>
        <view class="text-26rpx text-[#666] space-y-8rpx">
          <view>物资名称：{{ item.itemName || '-' }}</view>
          <view>规格型号：{{ item.specification || '-' }}</view>
          <view>产出数量：{{ item.quantity ?? '-' }} {{ item.unitMeasureName || '' }}</view>
          <view>批次号：{{ item.batchCode || '-' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmProductProduceLine } from '@/api/mes/wm/productproduce/line'
import { ref, watch } from 'vue'
import { getProductProduceLinePage } from '@/api/mes/wm/productproduce/line'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  feedbackId?: number
}>()

const loading = ref(false) // 列表加载状态
const list = ref<WmProductProduceLine[]>([]) // 产出行列表

/** 加载产出行数据 */
async function loadList() {
  if (!props.feedbackId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getProductProduceLinePage({
      pageNo: 1,
      pageSize: 20,
      feedbackId: props.feedbackId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 监听报工编号变化 */
watch(
  () => props.feedbackId,
  () => loadList(),
  { immediate: true },
)
</script>
