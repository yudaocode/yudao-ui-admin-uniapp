<template>
  <!-- TODO @芋艿：功能待 review；先从老版本迁移过来！ -->
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="审批详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 流程信息卡片 -->
    <view class="mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white">
      <view class="p-24rpx">
        <!-- 标题和状态 -->
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-32rpx text-[#333] font-bold">{{ processInstance.name }}</text>
          <wd-tag :type="getStatusType(processInstance.status)">
            {{ getStatusText(processInstance.status) }}
          </wd-tag>
        </view>
        <!-- 发起人信息 -->
        <view class="flex items-center">
          <view class="mr-12rpx h-64rpx w-64rpx flex items-center justify-center rounded-full bg-[#1890ff] text-white">
            {{ processInstance.startUser?.nickname?.[0] || '?' }}
          </view>
          <view>
            <text class="text-28rpx text-[#333]">{{ processInstance.startUser?.nickname }}</text>
            <text v-if="processInstance.startUser?.deptName" class="ml-8rpx text-24rpx text-[#999]">
              {{ processInstance.startUser?.deptName }}
            </text>
          </view>
        </view>
        <!-- 提交时间 -->
        <view class="mt-16rpx text-24rpx text-[#999]">
          提交于 {{ formatDateTime(processInstance.startTime) }}
        </view>
      </view>
    </view>

    <!-- 摘要信息 -->
    <view v-if="processInstance.summary?.length" class="mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white">
      <view class="p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-bold">
          审批信息
        </view>
        <view v-for="(item, index) in processInstance.summary" :key="index" class="mb-8rpx flex">
          <text class="text-26rpx text-[#999]">{{ item.key }}：</text>
          <text class="text-26rpx text-[#333]">{{ item.value }}</text>
        </view>
      </view>
    </view>

    <!-- 审批记录 -->
    <view class="mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white">
      <view class="p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-28rpx text-[#333] font-bold">审批记录</text>
          <wd-icon :name="orderAsc ? 'arrow-up' : 'arrow-down'" size="32rpx" @click="toggleOrder" />
        </view>
        <!-- 任务列表 -->
        <view v-for="(task, index) in sortedTasks" :key="task.id || index" class="relative pb-24rpx pl-40rpx">
          <!-- 时间线 -->
          <view
            class="absolute left-12rpx top-8rpx h-16rpx w-16rpx rounded-full"
            :class="getTaskDotClass(task)"
          />
          <view v-if="index < sortedTasks.length - 1" class="absolute bottom-0 left-18rpx top-28rpx w-2rpx bg-[#e5e5e5]" />
          <!-- 任务内容 -->
          <view>
            <text class="text-28rpx text-[#333] font-bold">{{ task.name }}</text>
            <view v-if="task.assigneeUser" class="mt-8rpx flex items-center">
              <view class="mr-8rpx h-48rpx w-48rpx flex items-center justify-center rounded-full bg-[#1890ff] text-24rpx text-white">
                {{ task.assigneeUser?.nickname?.[0] || '?' }}
              </view>
              <view class="flex-1">
                <view class="flex items-center justify-between">
                  <view class="flex items-center">
                    <text class="text-26rpx text-[#333]">{{ task.assigneeUser?.nickname }}</text>
                    <text v-if="task.assigneeUser?.deptName" class="ml-8rpx text-22rpx text-[#999]">
                      {{ task.assigneeUser?.deptName }}
                    </text>
                  </view>
                  <text v-if="task.endTime" class="text-22rpx text-[#999]">{{ formatPast(task.endTime) }}</text>
                </view>
                <view class="mt-4rpx flex items-center">
                  <text :class="getStatusTextClass(task.status)" class="text-24rpx">
                    {{ getStatusText(task.status) }}
                  </text>
                  <text v-if="task.reason" class="ml-8rpx text-24rpx text-[#666]">{{ task.reason }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="runningTask" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="error" plain class="flex-1" @click="handleReject">
          拒绝
        </wd-button>
        <wd-button type="primary" class="flex-1" @click="handleApprove">
          同意
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProcessInstance } from '@/api/bpm/processInstance'
import type { Task } from '@/api/bpm/task'
// TODO @芋艿：缺少功能的补全！！！！
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getProcessInstance } from '@/api/bpm/processInstance'
import { getTaskListByProcessInstanceId } from '@/api/bpm/task'
import { useUserStore } from '@/store'
import { navigateBackPlus } from '@/utils'
import { formatDateTime, formatPast } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()
const toast = useToast()
const processInstanceId = ref('')
const processInstance = ref<Partial<ProcessInstance>>({})
const tasks = ref<Task[]>([])
const orderAsc = ref(true)

/** 当前用户需要处理的任务 */
const runningTask = computed(() => {
  return tasks.value.find((task) => {
    // 待处理状态
    if (task.status !== 1 && task.status !== 6) {
      return false
    }
    // 当前用户是处理人
    return task.assigneeUser?.id === userStore.userInfo?.id
  })
})

/** 排序后的任务列表 */
const sortedTasks = computed(() => {
  const list = [...tasks.value].filter(t => t.status !== 4) // 过滤已取消
  list.sort((a, b) => {
    if (a.endTime && b.endTime) {
      return orderAsc.value ? a.endTime - b.endTime : b.endTime - a.endTime
    }
    if (a.endTime) {
      return orderAsc.value ? -1 : 1
    }
    if (b.endTime) {
      return orderAsc.value ? 1 : -1
    }
    return orderAsc.value ? a.createTime - b.createTime : b.createTime - a.createTime
  })
  return list
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/bpm/index')
}

/** 切换排序 */
function toggleOrder() {
  orderAsc.value = !orderAsc.value
}

/** 获取状态文本 */
function getStatusText(status?: number) {
  const map: Record<number, string> = {
    0: '待审批',
    1: '审批中',
    2: '审批通过',
    3: '审批不通过',
    4: '已取消',
    5: '已退回',
    6: '委派中',
    7: '审批通过中',
  }
  return map[status ?? 0] || '待审批'
}

/** 获取状态标签类型 */
function getStatusType(status?: number): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  if ([1, 6, 7].includes(status ?? 0)) {
    return 'primary'
  }
  if (status === 2) {
    return 'success'
  }
  if (status === 3) {
    return 'danger'
  }
  if (status === 4 || status === 5) {
    return 'warning'
  }
  return 'default'
}

/** 获取任务圆点样式 */
function getTaskDotClass(task: Task) {
  if ([1, 6, 7].includes(task.status)) {
    return 'bg-[#1890ff]'
  }
  if (task.status === 2) {
    return 'bg-[#52c41a]'
  }
  if (task.status === 3) {
    return 'bg-[#ff4d4f]'
  }
  if (task.status === 5) {
    return 'bg-[#faad14]'
  }
  return 'bg-[#d9d9d9]'
}

/** 获取状态文本样式 */
function getStatusTextClass(status: number) {
  if ([1, 6, 7].includes(status)) {
    return 'text-[#1890ff]'
  }
  if (status === 2) {
    return 'text-[#52c41a]'
  }
  if (status === 3) {
    return 'text-[#ff4d4f]'
  }
  if (status === 5) {
    return 'text-[#faad14]'
  }
  return 'text-[#999]'
}

/** 同意 */
function handleApprove() {
  if (!runningTask.value) {
    return
  }
  uni.navigateTo({ url: `/pages-bpm/processInstance/detail/audit/index?id=${runningTask.value.id}&pass=true` })
}

/** 拒绝 */
function handleReject() {
  if (!runningTask.value) {
    return
  }
  uni.navigateTo({ url: `/pages-bpm/processInstance/detail/audit/index?id=${runningTask.value.id}&pass=false` })
}

/** 加载流程实例 */
async function loadProcessInstance() {
  try {
    processInstance.value = await getProcessInstance(processInstanceId.value)
  } catch (error) {
    console.error('[detail] 加载流程实例失败:', error)
  }
}

/** 加载任务列表 */
async function loadTasks() {
  try {
    tasks.value = await getTaskListByProcessInstanceId(processInstanceId.value)
  } catch (error) {
    console.error('[detail] 加载任务列表失败:', error)
  }
}

/** 初始化 */
onLoad(async (options) => {
  if (!options?.id) {
    toast.show('参数错误')
    return
  }
  processInstanceId.value = options.id
  await Promise.all([loadProcessInstance(), loadTasks()])
})
</script>
