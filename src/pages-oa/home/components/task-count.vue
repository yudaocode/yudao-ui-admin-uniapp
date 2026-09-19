<template>
  <view class="rounded-12rpx bg-[linear-gradient(135deg,#fa8c16,#ffa940)] p-24rpx text-white" @click="handleGo('/pages-oa/task/my/index')">
    <view class="mb-8rpx text-26rpx opacity-90">
      新任务
    </view>
    <view class="truncate text-36rpx font-semibold">
      {{ newTaskCount }}
    </view>
    <view v-if="hasAccessByCodes(['oa:announcement:query'])" class="mt-4rpx truncate text-22rpx opacity-85">
      未读公告 {{ unreadAnnouncementTotal }} 条
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getReceivedAnnouncementPage } from '@/api/oa/announcement'
import { getTaskStatusCount } from '@/api/oa/task'
import { useAccess } from '@/hooks/useAccess'
import { OA_TASK_STATUS } from '../../utils/constants'

const { hasAccessByCodes } = useAccess()
const newTaskCount = ref(0) // 新任务数
const unreadAnnouncementTotal = ref(0) // 未读公告数

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 初始化 */
onMounted(() => {
  getTaskStatusCount().then((data) => {
    newTaskCount.value = data[OA_TASK_STATUS.NEW] || 0
  })
  if (hasAccessByCodes(['oa:announcement:query'])) {
    getReceivedAnnouncementPage({ pageNo: 1, pageSize: 1, readStatus: false }).then((data) => {
      unreadAnnouncementTotal.value = data.total
    })
  }
})
</script>
