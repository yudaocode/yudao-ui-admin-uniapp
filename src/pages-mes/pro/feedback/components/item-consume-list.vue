<template>
  <view class="mt-24rpx">
    <view v-if="showTitle" class="mb-16rpx px-24rpx text-28rpx text-[#333] font-semibold">
      BOM 物资消耗
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
      loading-more-no-more-text="没有更多物资消耗记录了"
      empty-view-text="暂无物资消耗记录"
      @query="queryList"
    >
      <view class="space-y-16rpx">
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
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WmItemConsumeLine } from '@/api/mes/wm/itemconsume/line'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getItemConsumeLinePage } from '@/api/mes/wm/itemconsume/line'

const props = withDefaults(defineProps<{
  feedbackId?: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const list = ref<WmItemConsumeLine[]>([]) // 消耗行列表
const pagingRef = ref<ZPagingRef<WmItemConsumeLine>>() // 分页组件引用

/** 查询消耗行列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.feedbackId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getItemConsumeLinePage({
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
