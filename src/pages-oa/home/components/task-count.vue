<template>
  <view class="rounded-12rpx bg-[linear-gradient(135deg,#fa8c16,#ffa940)] p-24rpx text-white" @click="handleGo('/pages-oa/task/my/index')">
    <view v-if="loadError" class="py-24rpx text-center text-26rpx" @click.stop="loadData">
      新任务加载失败，点击重试
    </view>
    <template v-else>
      <view class="mb-8rpx text-26rpx opacity-90">
        新任务
      </view>
      <view class="truncate text-36rpx font-semibold">
        {{ newTaskCount }}
      </view>
      <view v-if="hasAccessByCodes(['oa:announcement:query'])" class="mt-4rpx truncate text-22rpx opacity-85">
        未读公告 {{ unreadAnnouncementTotal }} 条
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { getReceivedAnnouncementPage } from '@/api/oa/announcement'
import { getTaskStatusCount } from '@/api/oa/task'
import { useAccess } from '@/hooks/useAccess'
import { OA_TASK_STATUS } from '../../utils/constants'

const loadError = ref(false) // 加载失败时显示重试入口
const loading = ref(false) // 防止重复加载

const { hasAccessByCodes } = useAccess()
const newTaskCount = ref(0) // 新任务数
const unreadAnnouncementTotal = ref(0) // 未读公告数

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
    const [counts, announcements] = await Promise.all([
      getTaskStatusCount(),
      hasAccessByCodes(['oa:announcement:query'])
        ? getReceivedAnnouncementPage({ pageNo: 1, pageSize: 1, readStatus: false })
        : undefined,
    ])
    newTaskCount.value = counts[OA_TASK_STATUS.NEW] || 0
    unreadAnnouncementTotal.value = announcements?.total || 0
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
