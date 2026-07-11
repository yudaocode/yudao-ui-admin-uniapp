<template>
  <view class="mt-24rpx">
    <view v-if="showTitle" class="mb-16rpx px-24rpx text-28rpx text-[#333] font-semibold">
      产品产出
    </view>
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      :auto="false"
      height="640rpx"
      :default-page-size="20"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多产品产出记录了"
      empty-view-text="暂无产品产出记录"
      @query="queryList"
    >
      <view class="space-y-16rpx">
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
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WmProductProduceLine } from '@/api/mes/wm/productproduce/line'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getProductProduceLinePage } from '@/api/mes/wm/productproduce/line'
import { DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  feedbackId?: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const list = ref<WmProductProduceLine[]>([]) // 产出行列表
const pagingRef = ref<ZPagingRef<WmProductProduceLine>>() // 分页组件引用

/** 查询产出行列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.feedbackId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getProductProduceLinePage({
      pageNo,
      pageSize,
      feedbackId: props.feedbackId,
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

/** 监听报工编号变化 */
watch(
  () => props.feedbackId,
  async () => {
    list.value = []
    await nextTick()
    reload()
  },
  { immediate: true },
)

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:pro:feedback:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:pro:feedback:reload', reload)
})
</script>
