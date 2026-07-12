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
    empty-view-text="暂无写作记录"
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
          <dict-tag :type="DICT_TYPE.AI_WRITE_TYPE" :value="item.type" />
          <text class="text-22rpx text-[#999]">{{ formatDateTime(item.createTime) }}</text>
        </view>
        <view class="line-clamp-2 text-28rpx text-[#333]">
          {{ item.prompt || '-' }}
        </view>
        <view class="line-clamp-3 mt-12rpx text-26rpx text-[#666]">
          {{ item.generatedContent || item.errorMessage || '-' }}
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { AiWrite } from '@/api/ai/write'
import { onMounted, onUnmounted, ref } from 'vue'
import { getWritePage } from '@/api/ai/write'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const list = ref<AiWrite[]>([]) // 写作记录
const pagingRef = ref<any>() // 分页组件引用

/** 查询写作记录 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWritePage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开作文详情 */
function handleOpen(item: AiWrite) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-ai/write/detail/index?id=${item.id}` })
}

/** 刷新写作记录 */
function handleReload() {
  pagingRef.value?.reload()
}

/** 监听详情页删除后的刷新事件 */
onMounted(() => uni.$on('ai:write:reload', handleReload))

/** 卸载刷新事件 */
onUnmounted(() => uni.$off('ai:write:reload', handleReload))
</script>
