<template>
  <view class="rounded-12rpx bg-white p-24rpx">
    <view v-if="loadError" class="py-24rpx text-center text-26rpx" @click.stop="loadData">
      公告通知加载失败，点击重试
    </view>
    <template v-else>
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-30rpx text-[#333] font-semibold">公告通知</text>
        <text class="text-26rpx text-[#1677ff]" @click="handleGo('/pages-oa/announcement/my/index')">更多</text>
      </view>
      <view v-if="!announcements.length" class="py-24rpx text-center text-24rpx text-[#999]">
        暂无公告
      </view>
      <view
        v-for="item in announcements"
        :key="item.id"
        class="mb-12rpx flex items-center gap-12rpx"
        @click="handleAnnouncementDetail(item)"
      >
        <view v-if="!item.readStatus" class="h-12rpx w-12rpx shrink-0 rounded-full bg-[#f56c6c]" />
        <view v-else class="h-12rpx w-12rpx shrink-0" />
        <view class="min-w-0 flex-1">
          <view class="line-clamp-1 text-28rpx" :class="item.readStatus ? 'text-[#666]' : 'text-[#333] font-medium'">
            {{ item.title }}
          </view>
          <view class="mt-2rpx text-22rpx text-[#999]">
            {{ item.publisherDeptName || '-' }} · {{ formatDate(item.createTime) }}
          </view>
        </view>
        <dict-tag :type="DICT_TYPE.OA_PRIORITY" :value="item.priority" />
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { Announcement } from '@/api/oa/announcement'
import { onMounted, ref } from 'vue'
import { getReceivedAnnouncementPage } from '@/api/oa/announcement'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'

const loadError = ref(false) // 加载失败时显示重试入口
const loading = ref(false) // 防止重复加载

const announcements = ref<Announcement[]>([]) // 最近公告

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 公告详情 */
function handleAnnouncementDetail(item: Announcement) {
  uni.navigateTo({
    url: `/pages-oa/announcement/detail/index?id=${item.id}&scene=received`,
  })
}

/** 加载面板数据，失败不展示为零值或空列表 */
async function loadData() {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    announcements.value = (await getReceivedAnnouncementPage({ pageNo: 1, pageSize: 5 })).list
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
