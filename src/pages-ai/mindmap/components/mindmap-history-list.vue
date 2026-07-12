<template>
  <z-paging
    ref="pagingRef"
    v-model="list"
    :fixed="false"
    class="min-h-0 flex-1"
    :default-page-size="10"
    :refresher-enabled="true"
    :inside-more="true"
    :loading-more-default-as-loading="true"
    empty-view-text="暂无思维导图记录"
    @query="queryList"
  >
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="handleOpen(item)"
      >
        <view class="mb-12rpx flex items-center justify-between">
          <view class="text-28rpx text-[#333] font-semibold">
            {{ item.prompt || '未命名导图' }}
          </view>
          <text class="text-22rpx text-[#999]">{{ formatDateTime(item.createTime) }}</text>
        </view>
        <view class="line-clamp-4 text-26rpx text-[#666]">
          {{ item.generatedContent || item.errorMessage || '-' }}
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { MindMap } from '@/api/ai/mindmap'
import { onMounted, onUnmounted, ref } from 'vue'
import { getMindMapPage } from '@/api/ai/mindmap'
import { formatDateTime } from '@/utils/date'

const list = ref<MindMap[]>([]) // 思维导图记录
const pagingRef = ref<any>() // 分页组件引用

/** 查询思维导图记录 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getMindMapPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开思维导图详情 */
function handleOpen(item: MindMap) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-ai/mindmap/detail/index?id=${item.id}` })
}

/** 刷新思维导图记录 */
function handleReload() {
  pagingRef.value?.reload()
}

/** 监听详情页删除事件 */
onMounted(() => uni.$on('ai:mind-map:reload', handleReload))

/** 移除详情页删除事件 */
onUnmounted(() => uni.$off('ai:mind-map:reload', handleReload))
</script>
