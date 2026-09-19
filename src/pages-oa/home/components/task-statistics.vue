<template>
  <!-- 任务完成情况：状态占比 + 完成排行，纯样式条形图 -->
  <view class="rounded-12rpx bg-white p-24rpx">
    <view class="mb-16rpx flex items-center justify-between">
      <text class="text-30rpx text-[#333] font-semibold">任务完成情况</text>
      <text class="text-26rpx text-[#1677ff]" @click="handleMore">查看任务</text>
    </view>

    <!-- 我的任务状态 -->
    <view class="mb-16rpx">
      <view class="mb-12rpx text-26rpx text-[#666]">
        我的任务
      </view>
      <view
        v-for="item in taskStatuses"
        :key="item.status"
        class="mb-12rpx flex items-center gap-16rpx"
      >
        <dict-tag :type="DICT_TYPE.OA_TASK_STATUS" :value="item.status" />
        <view class="h-16rpx flex-1 overflow-hidden rounded-full bg-[#f0f0f0]">
          <view
            class="h-full rounded-full bg-[#3b82f6]"
            :style="{ width: `${getStatusPercentage(item.count)}%` }"
          />
        </view>
        <text class="w-48rpx text-right text-24rpx text-[#999]">{{ item.count }}</text>
      </view>
    </view>

    <!-- 任务完成排行（按发布人） -->
    <view>
      <view class="mb-12rpx text-26rpx text-[#666]">
        任务完成排行（按发布人）
      </view>
      <view v-if="!rankings.length" class="py-24rpx text-center text-24rpx text-[#999]">
        暂无完成记录
      </view>
      <view
        v-for="item in rankings"
        :key="item.userId"
        class="mb-12rpx flex items-center gap-16rpx"
      >
        <text class="line-clamp-1 w-140rpx text-26rpx text-[#333]">{{ item.userName || `用户 ${item.userId}` }}</text>
        <view class="h-16rpx flex-1 overflow-hidden rounded-full bg-[#f0f0f0]">
          <view
            class="h-full rounded-full bg-[#52c41a]"
            :style="{ width: `${getRankingPercentage(item.completedCount)}%` }"
          />
        </view>
        <text class="w-48rpx text-right text-24rpx text-[#999]">{{ item.completedCount }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { TaskRanking } from '@/api/oa/task'
import { computed, onMounted, ref } from 'vue'
import { getCompletedTaskRanking, getTaskStatusCount } from '@/api/oa/task'
import { DICT_TYPE } from '@/utils/constants'
import { OA_TASK_STATUS } from '../../utils/constants'

const statusCountMap = ref<Record<number, number>>({}) // 状态与任务数量
const rankings = ref<TaskRanking[]>([]) // 任务完成排行
const taskStatuses = computed(() => // 补齐没有任务的状态
  Object.values(OA_TASK_STATUS).map(status => ({
    status,
    count: statusCountMap.value[status] || 0,
  })))
const taskTotal = computed(() => taskStatuses.value.reduce((total, item) => total + item.count, 0)) // 我的任务总数
const rankingMax = computed(() => Math.max(...rankings.value.map(item => item.completedCount), 0)) // 排行最大值

/** 获得任务状态占比 */
function getStatusPercentage(count: number) {
  return taskTotal.value === 0 ? 0 : Math.round((count / taskTotal.value) * 100)
}

/** 获得完成排行占比 */
function getRankingPercentage(count: number) {
  return rankingMax.value === 0 ? 0 : Math.round((count / rankingMax.value) * 100)
}

/** 查看任务 */
function handleMore() {
  uni.navigateTo({
    url: '/pages-oa/task/my/index',
  })
}

/** 初始化 */
onMounted(() => {
  getTaskStatusCount().then((data) => {
    statusCountMap.value = data
  })
  getCompletedTaskRanking().then((data) => {
    rankings.value = data
  })
})
</script>
