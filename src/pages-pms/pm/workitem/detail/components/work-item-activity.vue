<template>
  <view>
    <view v-if="!activityList.length" class="py-60rpx text-center text-28rpx text-[#999]">
      暂无动态
    </view>
    <view
      v-for="activity in activityList"
      :key="activity.id"
      class="mb-16rpx flex gap-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <view class="h-48rpx w-48rpx flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1677ff] text-24rpx text-white">
        <wd-img
          v-if="activity.operatorUserAvatar"
          :src="activity.operatorUserAvatar"
          width="48rpx"
          height="48rpx"
          radius="50%"
        />
        <text v-else>{{ activity.operatorUserName?.slice(0, 1) || '-' }}</text>
      </view>
      <view class="min-w-0 flex-1">
        <view class="mb-4rpx flex items-center gap-12rpx">
          <text class="text-28rpx text-[#333] font-semibold">{{ activity.operatorUserName || '-' }}</text>
          <text class="text-24rpx text-[#999]">{{ formatDateTime(activity.createTime) }}</text>
        </view>
        <view class="text-28rpx text-[#666]">
          {{ activity.content }}
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WorkItemActivity } from '@/api/pms/pm/workitem/activity'
import { getWorkItemActivityList } from '@/api/pms/pm/workitem/activity'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  workItemId: number
}>()

const activityList = ref<WorkItemActivity[]>([]) // 动态列表

/** 查询工作项动态列表 */
async function getList() {
  activityList.value = await getWorkItemActivityList(props.workItemId)
}

defineExpose({ reload: getList })

/** 工作项变化时刷新动态 */
watch(() => props.workItemId, getList, { immediate: true })
</script>
