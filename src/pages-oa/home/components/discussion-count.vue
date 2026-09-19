<template>
  <view
    class="rounded-12rpx bg-[linear-gradient(135deg,#722ed1,#9254de)] p-24rpx text-white"
    @click="handleGo('/pages-oa/discussion/list/index')"
  >
    <view class="mb-8rpx text-26rpx opacity-90">
      讨论区
    </view>
    <view class="truncate text-36rpx font-semibold">
      {{ discussionTotal }}
    </view>
    <view class="mt-4rpx truncate text-22rpx opacity-85">
      全部讨论与投票总数
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getDiscussionPage } from '@/api/oa/discussion'

const discussionTotal = ref(0) // 讨论区总数

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 初始化 */
onMounted(() => {
  getDiscussionPage({ pageNo: 1, pageSize: 1 }).then((data) => {
    discussionTotal.value = data.total
  })
})
</script>
