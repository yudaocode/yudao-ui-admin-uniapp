<template>
  <view>
    <view v-if="loading" class="py-24rpx text-28rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="py-24rpx text-28rpx text-[#999]">
      {{ direction === 'forward' ? '暂无向前追溯数据' : '暂无向后追溯数据' }}
    </view>
    <view v-else>
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-20rpx rounded-12rpx bg-[#f8f9fb] p-20rpx last:mb-0"
      >
        <view class="mb-10rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-semibold">
              {{ item.code || '-' }}
            </view>
            <view class="mt-6rpx truncate text-24rpx text-[#999]">
              生产工单：{{ item.workOrderCode || '-' }}
            </view>
          </view>
          <dict-tag v-if="item.qualityStatus != null" :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="item.qualityStatus" />
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">物料：</text>{{ item.itemCode || '-' }} / {{ item.itemName || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">规格单位：</text>{{ item.itemSpecification || '-' }} / {{ item.unitName || '-' }}
        </view>
        <view class="text-24rpx text-[#999]">
          生产批号：{{ item.lotNumber || '-' }}
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Batch } from '@/api/mes/wm/batch'
import { onMounted, ref, watch } from 'vue'
import { getBackwardList, getForwardList } from '@/api/mes/wm/batch'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  batchCode?: string
  direction: 'forward' | 'backward'
}>()

const loading = ref(false) // 加载状态
const list = ref<Batch[]>([]) // 追溯列表

/** 加载追溯列表 */
async function loadList() {
  if (!props.batchCode) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = props.direction === 'forward'
      ? await getForwardList(props.batchCode)
      : await getBackwardList(props.batchCode)
  } finally {
    loading.value = false
  }
}

/** 监听批次和方向变化 */
watch(
  () => [props.batchCode, props.direction],
  () => loadList(),
)

/** 初始化 */
onMounted(() => {
  loadList()
})
</script>
