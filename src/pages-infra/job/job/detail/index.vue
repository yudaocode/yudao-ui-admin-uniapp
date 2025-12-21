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
        <wd-cell title="任务编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="任务名称" :value="String(formData?.name ?? '-')" />
        <wd-cell title="任务状态">
          <dict-tag :type="DICT_TYPE.INFRA_JOB_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="处理器名称" :value="String(formData?.handlerName ?? '-')" />
        <wd-cell title="处理器参数" :value="String(formData?.handlerParam ?? '-')" />
        <wd-cell title="CRON 表达式" :value="String(formData?.cronExpression ?? '-')" />
        <wd-cell title="重试次数" :value="String(formData?.retryCount ?? '-')" />
        <wd-cell title="重试间隔" :value="formData?.retryInterval ? `${formData.retryInterval} ms` : '-'" />
        <wd-cell title="监控超时" :value="formData?.monitorTimeout ? `${formData.monitorTimeout} ms` : '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['infra:job:trigger'])"
          class="flex-1" type="success" :loading="running" @click="handleRun"
        >
          执行一次
        </wd-button>
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
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Job } from '@/api/infra/job'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteJob, getJob, runJob } from '@/api/infra/job'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const running = ref(false)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/job/index')
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
      running.value = true
      try {
        await runJob(props.id)
        toast.success('执行成功')
      } finally {
        running.value = false
      }
    },
  })
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/job/job/form/index?id=${props.id}`,
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

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
