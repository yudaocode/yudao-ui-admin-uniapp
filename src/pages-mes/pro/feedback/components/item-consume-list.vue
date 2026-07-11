<template>
  <view class="mt-24rpx">
    <view v-if="showTitle" class="mb-16rpx px-24rpx text-28rpx text-[#333] font-semibold">
      BOM 物资消耗
    </view>
    <view v-if="loading" class="flex justify-center py-24rpx">
      <wd-loading />
    </view>
    <view v-else-if="list.length === 0" class="rounded-12rpx bg-white py-48rpx">
      <wd-empty icon="content" tip="暂无物资消耗记录" />
    </view>
    <view v-else class="space-y-16rpx">
      <view v-for="item in list" :key="item.id" class="rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
          {{ item.itemCode || '-' }}
        </view>
        <view class="text-26rpx text-[#666] space-y-8rpx">
          <view>物资名称：{{ item.itemName || '-' }}</view>
          <view>规格型号：{{ item.specification || '-' }}</view>
          <view>消耗数量：{{ item.quantity ?? '-' }} {{ item.unitName || '' }}</view>
          <view>批次号：{{ item.batchCode || '-' }}</view>
        </view>
      </view>
      <wd-button v-if="hasMore" block size="small" :loading="loadingMore" variant="plain" @click="loadMore">
        加载更多
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmItemConsumeLine } from '@/api/mes/wm/itemconsume/line'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getItemConsumeLinePage } from '@/api/mes/wm/itemconsume/line'

const props = withDefaults(defineProps<{
  feedbackId?: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const loading = ref(false) // 列表加载状态
const loadingMore = ref(false) // 加载更多状态
const list = ref<WmItemConsumeLine[]>([]) // 消耗行列表
const total = ref(0) // 消耗行总数
const pageNo = ref(1) // 当前页码
const hasMore = computed(() => list.value.length < total.value)

/** 加载消耗行数据 */
async function loadList(currentPage = 1) {
  if (!props.feedbackId) {
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
    const data = await getItemConsumeLinePage({
      pageNo: currentPage,
      pageSize: 20,
      feedbackId: props.feedbackId,
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

/** 监听报工编号变化 */
watch(
  () => props.feedbackId,
  () => loadList(),
  { immediate: true },
)

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:pro:feedback:reload', loadList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:pro:feedback:reload', loadList)
})
</script>
