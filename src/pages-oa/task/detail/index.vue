<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="任务详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="任务标题" :value="formData?.title ?? '-'" />
        <wd-cell title="任务类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_TASK_TYPE" :value="formData.type" />
        </wd-cell>
        <wd-cell title="总体状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_TASK_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="任务进度">
          <wd-progress v-if="formData" class="pt-12rpx" :percentage="getTaskStatusProgress(formData.status)" />
        </wd-cell>
        <wd-cell title="是否置顶" :value="formData?.top ? '是' : '否'" />
        <wd-cell title="是否取消" :value="formData?.canceled ? '是' : '否'" />
        <wd-cell title="发布人" :value="formData?.publisherUserName || '-'" />
        <wd-cell title="发布部门" :value="formData?.publisherDeptName || '-'" />
        <wd-cell title="发布时间" :value="formatDateTime(formData?.publishTime) || '-'" />
        <wd-cell title="开始时间" :value="formatDateTime(formData?.startTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDateTime(formData?.endTime) || '-'" />
        <wd-cell v-if="formData?.comment" title="任务评价" :value="formData.comment" />
      </wd-cell-group>

      <!-- 任务描述 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          任务描述
        </view>
        <view v-if="formData?.description" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.description }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无描述
        </view>
      </view>

      <!-- 接收人列表 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-26rpx text-[#999]">
          接收人（{{ formData?.receivers?.length ?? 0 }}）
        </view>
        <view v-if="formData?.receivers?.length">
          <view
            v-for="receiver in formData.receivers"
            :key="receiver.id"
            class="flex items-center justify-between border-0 border-b border-[#f5f5f5] border-solid py-16rpx last:border-b-0"
          >
            <text class="line-clamp-1 min-w-0 flex-1 text-28rpx text-[#333]">
              {{ receiver.userName }}<text v-if="receiver.deptName" class="ml-8rpx text-24rpx text-[#999]">{{ receiver.deptName }}</text>
            </text>
            <dict-tag :type="DICT_TYPE.OA_TASK_STATUS" :value="receiver.status" />
          </view>
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无接收人
        </view>
      </view>

      <!-- 反馈日志列表 -->
      <view v-if="formData?.logs?.length" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-26rpx text-[#999]">
          反馈日志（{{ formData.logs.length }}）
        </view>
        <view
          v-for="log in formData.logs"
          :key="log.id"
          class="border-0 border-b border-[#f5f5f5] border-solid py-16rpx last:border-b-0"
        >
          <view class="mb-8rpx flex items-center justify-between gap-12rpx">
            <text class="text-28rpx text-[#333]">{{ log.userName }}</text>
            <dict-tag :type="DICT_TYPE.OA_TASK_STATUS" :value="log.status" />
          </view>
          <view v-if="log.content" class="mb-8rpx whitespace-pre-wrap text-26rpx text-[#666]">
            {{ log.content }}
          </view>
          <view class="text-24rpx text-[#999]">
            {{ formatDateTime(log.createTime) }}
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <!-- 发布人视角 -->
      <view v-if="isPublisher" class="yd-detail-footer-actions">
        <wd-button
          v-if="canFeedback"
          class="flex-1" type="primary" @click="handleOpenFeedback"
        >
          反馈
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:task:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:task:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
      <!-- 接收人视角 -->
      <view v-else class="yd-detail-footer-actions">
        <wd-button
          v-if="canFeedback"
          class="flex-1" type="primary" @click="handleOpenFeedback"
        >
          反馈
        </wd-button>
        <wd-button
          v-if="formData?.canceled"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>

    <!-- 反馈弹窗 -->
    <wd-popup
      v-model="feedbackVisible"
      position="bottom"
      root-portal
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="feedbackVisible = false"
    >
      <view class="p-24rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
          任务反馈
        </view>
        <yd-form-picker v-model="feedbackStatus" label="反馈状态" :columns="feedbackStatusOptions" />
        <wd-textarea
          v-model="feedbackContent"
          :maxlength="1000"
          show-word-limit
          placeholder="请输入反馈内容"
        />
        <wd-button
          class="mt-24rpx"
          type="primary"
          block
          :loading="feedbacking"
          @click="handleSubmitFeedback"
        >
          提交反馈
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { Task } from '@/api/oa/task'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteReceivedTask, deleteTask, feedbackTask, getTask } from '@/api/oa/task'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel } from '@/hooks/useDict'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { OA_TASK_STATUS } from '../../utils/constants'
import { getTaskStatusProgress } from '../../utils/format'

const props = defineProps<{
  id?: string
  scene?: string // 入口场景：received 我接收的、published 我发布的
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Task>() // 详情数据
const deleting = ref(false) // 删除状态
const feedbackVisible = ref(false) // 反馈弹窗显示状态
const feedbackStatus = ref<number>() // 反馈状态
const feedbackContent = ref('') // 反馈内容
const feedbacking = ref(false) // 反馈提交状态
const isPublisher = computed(() => { // 发布人视角：优先按入口场景判断，未传场景时回退到发布人身份
  if (props.scene) {
    return props.scene === 'published'
  }
  return formData.value?.publisherUserId === userStore.userInfo.userId
})
const canFeedback = computed(() => { // 可反馈：未取消；接收人需在提交前，发布人不受限
  if (!formData.value || formData.value.canceled) {
    return false
  }
  return isPublisher.value
    || (formData.value.receiverStatus != null && formData.value.receiverStatus < OA_TASK_STATUS.SUBMITTED)
})
const feedbackStatusOptions = computed(() => { // 反馈状态选项：接收人最多到已提交，发布人可到已完成
  const values = isPublisher.value
    ? Object.values(OA_TASK_STATUS)
    : Object.values(OA_TASK_STATUS).filter(value => value <= OA_TASK_STATUS.SUBMITTED)
  return values.map(value => ({ label: getDictLabel(DICT_TYPE.OA_TASK_STATUS, value), value }))
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载任务详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getTask(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑任务 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/task/form/index?id=${props.id}`,
  })
}

/** 删除任务：发布人删除任务，接收人仅删除自己的接收关系 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: isPublisher.value ? '确定要删除该任务吗？' : '确定要删除该任务的接收记录吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    if (isPublisher.value) {
      await deleteTask(Number(props.id))
    } else {
      await deleteReceivedTask(Number(props.id))
    }
    toast.success('删除成功')
    uni.$emit('oa:task:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 打开反馈弹窗 */
function handleOpenFeedback() {
  // 预填当前状态：接收人用自己的接收状态，发布人用任务总体状态
  feedbackStatus.value = isPublisher.value ? formData.value?.status : formData.value?.receiverStatus
  feedbackContent.value = ''
  feedbackVisible.value = true
}

/** 提交任务反馈 */
async function handleSubmitFeedback() {
  if (!props.id) {
    return
  }
  if (feedbackStatus.value === undefined) {
    toast.warning('请选择反馈状态')
    return
  }
  feedbacking.value = true
  try {
    await feedbackTask({
      taskId: Number(props.id),
      publisher: isPublisher.value,
      status: feedbackStatus.value,
      content: feedbackContent.value.trim() || undefined,
    })
    toast.success('反馈成功')
    feedbackVisible.value = false
    uni.$emit('oa:task:reload')
  } finally {
    feedbacking.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:task:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:task:reload', getDetail)
})
</script>
