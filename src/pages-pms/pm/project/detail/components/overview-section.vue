<template>
  <scroll-view scroll-y class="min-h-0 flex-1">
    <view class="p-24rpx pb-200rpx">
      <!-- 核心指标 -->
      <view class="grid grid-cols-4 mb-24rpx gap-16rpx">
        <view
          v-for="card in cards"
          :key="card.label"
          class="rounded-12rpx bg-white p-20rpx text-center shadow-sm"
        >
          <view class="text-24rpx text-[#999]">
            {{ card.label }}
          </view>
          <view class="mt-8rpx text-36rpx text-[#333] font-semibold">
            {{ card.value }}
          </view>
        </view>
      </view>

      <!-- 项目公告 -->
      <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">项目公告</text>
          <!-- 对齐 PC：概况新建公告只要求可编辑 -->
          <text
            v-if="editable"
            class="text-28rpx text-[#1677ff]"
            @click="handleOpenAnnouncement"
          >
            新建公告
          </text>
        </view>
        <view v-if="!latestAnnouncement" class="py-40rpx text-center text-28rpx text-[#999]">
          暂无公告
        </view>
        <template v-else>
          <view class="rounded-8rpx bg-[#f7f8fa] p-20rpx">
            <view class="mb-8rpx text-26rpx text-[#666]">
              {{ latestAnnouncement.creatorUserName || '-' }} 发布于 {{ formatDate(latestAnnouncement.createTime) }}
            </view>
            <view class="line-clamp-4 whitespace-pre-wrap text-28rpx text-[#333] leading-40rpx">
              {{ latestAnnouncement.content }}
            </view>
          </view>
          <view class="mt-12rpx text-right text-28rpx text-[#1677ff]" @click="handleOpenAnnouncement">
            查看全部公告
          </view>
        </template>
      </view>

      <!-- 敏捷项目迭代 -->
      <view v-if="isAgileProject" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">项目迭代</text>
          <text class="text-28rpx text-[#1677ff]" @click="emit('open-tab', 'iteration')">
            查看更多（{{ iterations.length }} 个未完成）
          </text>
        </view>
        <view v-if="!iterations.length" class="py-40rpx text-center text-28rpx text-[#999]">
          暂无未完成迭代
        </view>
        <view
          v-for="item in iterations"
          :key="item.id"
          class="border-t border-[#f0f0f0] py-16rpx first:border-t-0"
          @click="handleIterationDetail(item)"
        >
          <view class="mb-8rpx flex items-center justify-between gap-16rpx">
            <text class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-semibold">{{ item.name }}</text>
            <wd-tag :type="item.status === PmsIterationStatus.ACTIVE ? 'primary' : 'default'" plain>
              {{ getIterationStatusName(item.status) }}
            </wd-tag>
          </view>
          <view class="mb-8rpx text-24rpx text-[#999]">
            {{ formatDate(item.startTime) || '--' }} 至 {{ formatDate(item.endTime) || '--' }}
            <text v-if="item.progress !== undefined"> · 完成 {{ item.progress }}%</text>
          </view>
          <wd-progress :percentage="item.progress || 0" hide-text />
        </view>
      </view>

      <!-- 通用项目工作项趋势 -->
      <view v-else class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">工作项趋势</text>
          <text class="text-24rpx text-[#999]">近 14 日已完成 {{ trendTotal }} 项</text>
        </view>
        <template v-if="overview.completedTrends.length">
          <TrendBars :values="trendValues" height="240rpx" />
          <view class="mt-8rpx flex justify-between text-22rpx text-[#999]">
            <text>{{ trendDateRange[0] }}</text>
            <text>{{ trendDateRange[1] }}</text>
          </view>
        </template>
        <view v-else class="py-40rpx text-center text-28rpx text-[#999]">
          暂无数据
        </view>
      </view>

      <!-- 项目基本信息 -->
      <wd-cell-group border title="项目基本信息">
        <wd-cell title="项目名称" :value="project.name" />
        <wd-cell title="项目周期" :value="`${formatDate(project.startTime) || '未设置'} 至 ${formatDate(project.endTime) || '未设置'}`" />
        <wd-cell title="项目管理员" :value="project.adminNames.join('、') || '未设置'" />
        <wd-cell title="项目成员" :value="`${project.memberCount} 人`" />
        <wd-cell title="项目进度">
          <view class="flex items-center justify-end gap-12rpx">
            <wd-progress class="w-200rpx" :percentage="formatProjectCompletionRate(project)" hide-text />
            <text class="text-26rpx text-[#666]">{{ formatProjectCompletionRate(project) }}%</text>
          </view>
        </wd-cell>
        <wd-cell title="项目描述" :value="project.description || '暂无项目描述'" />
      </wd-cell-group>

      <!-- 分配给我的 -->
      <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">分配给我的</text>
          <text class="text-28rpx text-[#1677ff]" @click="handleOpenAssigned">
            查看更多
          </text>
        </view>
        <view v-if="!overview.assignedWorkItems.length" class="py-40rpx text-center text-28rpx text-[#999]">
          暂无工作项
        </view>
        <view
          v-for="item in overview.assignedWorkItems.slice(0, 5)"
          :key="item.id"
          class="border-t border-[#f0f0f0] py-16rpx first:border-t-0"
          @click="handleWorkItemDetail(item.id)"
        >
          <view class="mb-8rpx flex items-center justify-between gap-16rpx">
            <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ item.name }}</text>
            <text class="shrink-0 text-24rpx text-[#999]">#{{ item.serialNumber }} · {{ getWorkItemTypeName(item.type) }}</text>
          </view>
          <wd-progress :percentage="item.progress" hide-text />
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { Iteration } from '@/api/pms/pm/iteration'
import type { Project, ProjectOverview } from '@/api/pms/pm/project'
import type { ProjectAnnouncement } from '@/api/pms/pm/project/announcement'
import { computed, ref } from 'vue'
import { getIterationPage } from '@/api/pms/pm/iteration'
import { getProjectOverview } from '@/api/pms/pm/project'
import { getProjectAnnouncementList } from '@/api/pms/pm/project/announcement'
import { PmsIterationStatus, PmsProjectType } from '@/pages-pms/pm/utils/constants'
import {
  formatProjectCompletionRate,
  getIterationStatusName,
  getWorkItemTypeName,
} from '@/pages-pms/pm/utils/format'
import TrendBars from '@/pages-pms/pm/components/trend-bars.vue'
import { formatDate } from '@/utils/date'
import { useUserStore } from '@/store/user'
import { getAllPageItems } from '@/utils/page'

const props = defineProps<{
  project: Project
  editable: boolean
}>()
const emit = defineEmits<{
  'open-tab': [tab: string, assigneeUserId?: number] // 请求父级切换详情页签（可带负责人预选）
}>()

const announcements = ref<ProjectAnnouncement[]>([]) // 项目公告
const iterations = ref<Iteration[]>([]) // 敏捷项目未完成迭代
const overview = ref<ProjectOverview>({
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  typeCountMap: {},
  completedTrends: [],
  assignedWorkItems: [],
}) // 项目概况

const latestAnnouncement = computed(() => announcements.value[0]) // 最新项目公告
const isAgileProject = computed(() => props.project.type === PmsProjectType.AGILE) // 是否敏捷项目
const cards = computed(() => [ // 核心指标卡片
  { label: '总事项', value: overview.value.totalCount },
  { label: '未开始', value: overview.value.pendingCount },
  { label: '进行中', value: overview.value.processingCount },
  { label: '已完成', value: overview.value.completedCount },
])
const trendValues = computed(() => overview.value.completedTrends.map(point => point.count)) // 近 14 日完成数量
const trendTotal = computed(() => trendValues.value.reduce((total, count) => total + count, 0)) // 近 14 日完成总数
const trendDateRange = computed(() => { // 趋势起止日期（MM-DD）
  const trends = overview.value.completedTrends
  if (!trends.length) {
    return []
  }
  return [trends[0].date.slice(5), trends[trends.length - 1].date.slice(5)]
})

/** 查询项目概况 */
async function getOverview() {
  const iterationPromise = isAgileProject.value
    ? getAllPageItems((pageNo, pageSize) =>
        getIterationPage({ pageNo, pageSize, projectId: props.project.id }))
    : Promise.resolve([] as Iteration[])
  const [currentOverview, currentAnnouncements, currentIterations] = await Promise.all([
    getProjectOverview(props.project.id),
    getProjectAnnouncementList(props.project.id),
    iterationPromise,
  ])
  overview.value = currentOverview
  announcements.value = currentAnnouncements
  iterations.value = currentIterations.filter(item => item.status !== PmsIterationStatus.COMPLETED)
}

/** 进入全部事项并预选当前用户负责的事项（对齐 PC 深链） */
function handleOpenAssigned() {
  emit('open-tab', isAgileProject.value ? 'all' : 'task', useUserStore().userInfo.userId)
}

/** 打开项目公告管理 */
function handleOpenAnnouncement() {
  uni.navigateTo({ url: `/pages-pms/pm/project/config/index?id=${props.project.id}&tabs=announcement` })
}

/** 查看迭代详情 */
function handleIterationDetail(item: Iteration) {
  uni.navigateTo({ url: `/pages-pms/pm/iteration/detail/index?id=${item.id}` })
}

/** 查看工作项详情 */
function handleWorkItemDetail(id: number) {
  uni.navigateTo({ url: `/pages-pms/pm/workitem/detail/index?id=${id}` })
}

defineExpose({ reload: getOverview })

/** 初始化 */
onMounted(() => {
  getOverview()
})
</script>
