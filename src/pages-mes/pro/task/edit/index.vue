<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="甘特图编辑" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 甘特图 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view v-if="loading" class="py-100rpx text-center text-26rpx text-[#999]">
        加载中...
      </view>
      <TaskGanttPreview
        v-else
        title="排产甘特图"
        :tasks="ganttTasks"
        editable
        @task-click="handleEdit"
        @task-update="handleTaskUpdate"
      >
        <template #actions>
          <view class="flex items-center gap-12rpx">
            <wd-button size="small" variant="plain" @click="handleRefresh">
              刷新
            </wd-button>
            <wd-button size="small" type="primary" :loading="formLoading" :disabled="pendingCount === 0" @click="handleSave">
              保存{{ pendingCount ? `(${pendingCount})` : '' }}
            </wd-button>
          </view>
        </template>
      </TaskGanttPreview>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { getGanttTaskList, updateTask } from '@/api/mes/pro/task'
import type { ProTask, ProTaskGantt } from '@/api/mes/pro/task'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum } from '@/utils/constants'
import TaskGanttPreview from '../components/task-gantt-preview.vue'

interface TaskGanttChange {
  id: number
  startTime: string
  endTime: string
  duration: number
}

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const loading = ref(false) // 页面加载状态
const formLoading = ref(false) // 保存状态
const ganttTasks = ref<ProTaskGantt[]>([]) // 甘特任务数据
const pendingChanges = ref(new Map<number, TaskGanttChange>()) // 待保存修改
const pendingCount = computed(() => pendingChanges.value.size)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/task/index')
}

/** 加载甘特任务 */
async function getList() {
  loading.value = true
  try {
    ganttTasks.value = await getGanttTaskList({})
  } finally {
    loading.value = false
  }
}

/** 记录拖拽修改 */
function handleTaskUpdate(change: TaskGanttChange) {
  const next = new Map(pendingChanges.value)
  next.set(change.id, change)
  pendingChanges.value = next
  ganttTasks.value = ganttTasks.value.map((item) => {
    if (item.type !== BarcodeBizTypeEnum.TASK || item.originalId !== change.id) {
      return item
    }
    return {
      ...item,
      startDate: change.startTime,
      endDate: change.endTime,
      duration: change.duration,
    }
  })
}

/** 保存甘特修改 */
async function handleSave() {
  if (pendingChanges.value.size === 0) {
    return
  }

  formLoading.value = true
  try {
    await Promise.all(Array.from(pendingChanges.value.values()).map(change =>
      updateTask({
        id: change.id,
        startTime: change.startTime,
        endTime: change.endTime,
        duration: change.duration,
      } as ProTask),
    ))
    toast.success(`已保存 ${pendingChanges.value.size} 条修改`)
    pendingChanges.value = new Map()
    uni.$emit('mes:pro:task:reload')
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 刷新甘特图 */
async function handleRefresh() {
  pendingChanges.value = new Map()
  await getList()
}

/** 编辑任务 */
function handleEdit(item: ProTaskGantt) {
  if (item.type !== BarcodeBizTypeEnum.TASK || !item.originalId) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/task/form/index?id=${item.originalId}` })
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
