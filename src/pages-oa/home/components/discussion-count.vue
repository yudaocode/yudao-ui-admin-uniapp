<template>
  <view
    class="rounded-12rpx bg-[linear-gradient(135deg,#722ed1,#9254de)] p-24rpx text-white"
    @click="handleGo('/pages-oa/discussion/list/index')"
  >
    <view v-if="loadError" class="py-24rpx text-center text-26rpx" @click.stop="loadData">
      讨论区加载失败，点击重试
    </view>
    <template v-else>
      <view class="mb-8rpx text-26rpx opacity-90">
        讨论区
      </view>
      <view class="truncate text-36rpx font-semibold">
        {{ discussionTotal }}
      </view>
      <view class="mt-4rpx truncate text-22rpx opacity-85">
        全部讨论与投票总数
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getDiscussionPage } from '@/api/oa/discussion'

const loadError = ref(false) // 加载失败时显示重试入口
const loading = ref(false) // 防止重复加载

const discussionTotal = ref(0) // 讨论区总数

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 加载面板数据，失败不展示为零值或空列表 */
async function loadData() {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    discussionTotal.value = (await getDiscussionPage({ pageNo: 1, pageSize: 1 })).total
    loadError.value = false
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(loadData)
</script>
