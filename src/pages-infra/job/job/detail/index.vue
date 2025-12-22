<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="定时任务详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="任务编号" :value="formData?.id" />
        <wd-cell title="任务名称" :value="formData?.name" />
        <wd-cell title="任务状态">
          <dict-tag :type="DICT_TYPE.INFRA_JOB_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="处理器名称" :value="formData?.handlerName" />
        <wd-cell title="处理器参数" :value="formData?.handlerParam ?? '-'" />
        <wd-cell title="CRON 表达式" :value="formData?.cronExpression" />
        <wd-cell title="重试次数" :value="formData?.retryCount" />
        <wd-cell title="重试间隔" :value="formData?.retryInterval ? `${formData.retryInterval} ms` : '-'" />
        <wd-cell title="监控超时" :value="formData?.monitorTimeout ? `${formData.monitorTimeout} ms` : '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['infra:job:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['infra:job:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
        <wd-button
          v-if="hasMoreActions"
          class="flex-1" type="info" @click="moreActionVisible = true"
        >
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />
  </view>
</template>

<script lang="ts" setup>
import type { Job } from '@/api/infra/job'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteJob, getJob, runJob, updateJobStatus } from '@/api/infra/job'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, InfraJobStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const formData = ref<Job>()
const deleting = ref(false)

const moreActionVisible = ref(false) // 更多操作菜单
const moreActions = computed(() => {
  const actions = []
  // 执行一次权限
  if (hasAccessByCodes(['infra:job:trigger'])) {
    actions.push({ name: '执行一次', value: 'run' })
  }
  // 更新状态权限
  if (hasAccessByCodes(['infra:job:update'])) {
    const isRunning = formData.value?.status === InfraJobStatusEnum.NORMAL
    actions.push({ name: isRunning ? '暂停任务' : '开启任务', value: 'update-status' })
  }
  // 查看调度日志权限
  if (hasAccessByCodes(['infra:job:query'])) {
    actions.push({ name: '调度日志', value: 'view-log' })
  }
  return actions
})
const hasMoreActions = computed(() => moreActions.value.length > 0)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/job/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getJob(props.id)
  } finally {
    toast.close()
  }
}

/** 执行一次 */
function handleRun() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要立即执行一次该任务吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      try {
        toast.loading('执行中...')
        await runJob(props.id)
        toast.success('执行成功')
      } finally {
        toast.close()
      }
    },
  })
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-infra/job/job/form/index?id=${props.id}`,
  })
}

/** 删除 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该定时任务吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteJob(props.id)
        toast.success('删除成功')
        setTimeout(() => {
          handleBack()
        }, 500)
      } finally {
        deleting.value = false
      }
    },
  })
}

/** 更多操作 */
function handleMoreAction({ item }: { item: { value: string } }) {
  if (item.value === 'run') {
    handleRun()
  } else if (item.value === 'update-status') {
    handleUpdateStatus()
  } else if (item.value === 'view-log') {
    handleViewLog()
  }
}

/** 更新任务状态 */
function handleUpdateStatus() {
  if (!props.id) {
    return
  }
  const isRunning = formData.value?.status === InfraJobStatusEnum.NORMAL
  const statusText = isRunning ? '暂停' : '开启'
  uni.showModal({
    title: '提示',
    content: `确定要${statusText}该任务吗？`,
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      try {
        toast.loading(`正在${statusText}中...`)
        const newStatus = isRunning ? InfraJobStatusEnum.STOP : InfraJobStatusEnum.NORMAL
        await updateJobStatus(props.id, newStatus)
        toast.success(`${statusText}成功`)
        await getDetail()
      } finally {
        toast.close()
      }
    },
  })
}

/** 查看调度日志 */
function handleViewLog() {
  uni.navigateTo({
    url: `/pages-infra/job/index?tab=log&jobId=${props.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
