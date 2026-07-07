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
        :editable="hasAccessByCodes(['mes:pro-task:update'])"
        @task-click="handleEdit"
        @task-update="handleTaskUpdate"
      >
        <template #actions>
          <view class="flex items-center gap-12rpx">
            <wd-button size="small" variant="plain" @click="handleRefresh">
              刷新
            </wd-button>
            <wd-button v-if="hasAccessByCodes(['mes:pro-task:update'])" size="small" type="primary" :loading="formLoading" :disabled="pendingCount === 0" @click="handleSave">
              保存{{ pendingCount ? `(${pendingCount})` : '' }}
            </wd-button>
          </view>
        </template>
      </TaskGanttPreview>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ProTask, ProTaskGantt } from '@/api/mes/pro/task'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getGanttTaskList, getTask, updateTask } from '@/api/mes/pro/task'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, MesProTaskStatusEnum, MesProWorkOrderStatusEnum, MesProWorkOrderTypeEnum } from '@/utils/constants'
import TaskGanttPreview from '../components/task-gantt-preview.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()
const loading = ref(false) // 页面加载状态
const formLoading = ref(false) // 保存状态
const ganttTasks = ref<ProTaskGantt[]>([]) // 甘特任务数据
const pendingChanges = ref(new Map<number, ProTask>()) // 待保存修改
const needReloadOnShow = ref(false) // 从任务表单返回后刷新
const pendingCount = computed(() => pendingChanges.value.size)

/** 返回上一页 */
async function handleBack() {
  if (!await confirmDiscardChanges()) {
    return
  }
  navigateBackPlus('/pages-mes/pro/task/index')
}

/** 加载甘特任务 */
async function getList() {
  loading.value = true
  try {
    ganttTasks.value = await getGanttTaskList({
      status: MesProWorkOrderStatusEnum.CONFIRMED,
      type: MesProWorkOrderTypeEnum.SELF,
    })
  } finally {
    loading.value = false
  }
}

/** 确认放弃未保存修改 */
async function confirmDiscardChanges() {
  if (pendingChanges.value.size === 0) {
    return true
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '当前有未保存的排产调整，确认放弃吗？',
    })
    return true
  } catch {
    return false
  }
}

/** 记录拖拽修改 */
function handleTaskUpdate(change: ProTask) {
  if (!change.id) {
    return
  }
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
    const changes = Array.from(pendingChanges.value.values())

    // 保存前重新拉取任务状态，避免拖拽期间任务已完成或取消
    const checkedChanges = await Promise.all(changes.map(async change => ({
      change,
      task: await getTask(Number(change.id)).catch(() => undefined),
    })))
    const updates = checkedChanges.filter(({ task }) => {
      return task?.id
        && task.status !== MesProTaskStatusEnum.FINISHED
        && task.status !== MesProTaskStatusEnum.CANCELED
    })
    if (updates.length === 0) {
      toast.warning('任务不存在、已完成或已取消，不能调整')
      pendingChanges.value = new Map()
      await getList()
      return
    }

    // 只提交仍可调整的任务
    await Promise.all(updates.map(({ change }) =>
      updateTask(change),
    ))
    const skippedCount = changes.length - updates.length
    toast.success(skippedCount ? `已保存 ${updates.length} 条，跳过 ${skippedCount} 条终态任务` : `已保存 ${updates.length} 条修改`)

    // 清空本地草稿并刷新甘特图
    pendingChanges.value = new Map()
    uni.$emit('mes:pro:task:reload')
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 刷新甘特图 */
async function handleRefresh() {
  if (!await confirmDiscardChanges()) {
    return
  }
  pendingChanges.value = new Map()
  await getList()
}

/** 编辑任务 */
async function handleEdit(item: ProTaskGantt) {
  if (item.type !== BarcodeBizTypeEnum.TASK || !item.originalId) {
    return
  }
  if (!await confirmDiscardChanges()) {
    return
  }
  needReloadOnShow.value = true
  const readonlyQuery = hasAccessByCodes(['mes:pro-task:update']) ? '' : '&readonly=true'
  uni.navigateTo({ url: `/pages-mes/pro/task/form/index?id=${item.originalId}${readonlyQuery}` })
}

/** 初始化 */
onShow(() => {
  if (ganttTasks.value.length > 0 && !needReloadOnShow.value) {
    return
  }
  needReloadOnShow.value = false
  pendingChanges.value = new Map()
  getList()
})
</script>
