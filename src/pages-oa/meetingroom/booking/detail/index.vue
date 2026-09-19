<template>
  <view class="yd-page-container pb-160rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="预定详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="预定单号" :value="formData?.no ?? '-'" />
        <wd-cell title="审批状态">
          <text v-if="formData?.status === OA_APPLY_STATUS.NOT_START" class="text-28rpx text-[#999]">未提交</text>
          <dict-tag v-else-if="formData" :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="使用状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_MEETING_ROOM_USE_STATUS" :value="formData.useStatus" />
        </wd-cell>
        <wd-cell title="会议主题" :value="formData?.title || '-'" />
        <wd-cell title="会议室" :value="formData?.roomName || '-'" />
        <wd-cell title="会议室位置" :value="formData?.roomLocation || '-'" />
        <wd-cell title="会议室类型">
          <dict-tag v-if="formData?.roomType != null" :type="DICT_TYPE.OA_MEETING_ROOM_TYPE" :value="formData.roomType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="需要审批" :value="formData?.needApproval == null ? '-' : formData.needApproval ? '是' : '否'" />
        <wd-cell title="开始时间" :value="formatDateTime(formData?.startTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDateTime(formData?.endTime) || '-'" />
        <wd-cell title="主持人" :value="formData?.moderatorName || '-'" />
        <wd-cell title="参会人" :value="formData?.attendeeNames?.join('、') || '-'" />
        <wd-cell title="会议提醒">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_MEETING_ROOM_REMINDER_TYPE" :value="formData.reminderType" />
        </wd-cell>
        <wd-cell title="申请人" :value="formData?.creatorName || '-'" />
        <wd-cell title="申请部门" :value="formData?.deptName || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="申请时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 会议描述 -->
      <view v-if="formData?.description" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          会议描述
        </view>
        <view class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.description }}
        </view>
      </view>

      <!-- 附件 -->
      <view v-if="formData?.fileUrls?.length" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          附件（{{ formData.fileUrls.length }}）
        </view>
        <view
          v-for="(url, index) in formData.fileUrls"
          :key="index"
          class="mb-12rpx flex items-center gap-12rpx text-26rpx text-[#1677ff]"
          @click="openAttachment(url)"
        >
          <wd-icon name="link" size="26rpx" />
          <text class="line-clamp-1">{{ getFileName(url) }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="formData?.processInstanceId || showActions" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="formData?.status === OA_APPLY_STATUS.NOT_START">
          <wd-button
            v-if="hasAccessByCodes(['oa:meeting-room-booking:update'])"
            class="flex-1" type="warning" @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:meeting-room-booking:delete'])"
            class="flex-1" type="danger" :loading="operating" @click="handleDelete"
          >
            删除
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:meeting-room-booking:create'])"
            class="flex-1" type="primary" :loading="operating" @click="handleSubmitApply"
          >
            提交审批
          </wd-button>
        </template>
        <wd-button
          v-if="canStart"
          class="flex-1" type="primary" :loading="operating" @click="handleStart"
        >
          开始使用
        </wd-button>
        <wd-button
          v-if="canFinish"
          class="flex-1" type="primary" :loading="operating" @click="handleFinish"
        >
          完成使用
        </wd-button>
        <wd-button
          v-if="canCancel"
          class="flex-1" type="danger" :loading="operating" @click="handleCancel"
        >
          取消预定
        </wd-button>
        <wd-button
          v-if="formData?.processInstanceId"
          class="flex-1" type="primary" @click="handleViewProcess"
        >
          审批进度
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MeetingRoomBooking } from '@/api/oa/meeting-room-booking'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  cancelMeetingRoomBooking,
  deleteMeetingRoomBooking,
  finishMeetingRoomBooking,
  getMeetingRoomBooking,
  startMeetingRoomBooking,
  submitMeetingRoomBooking,
} from '@/api/oa/meeting-room-booking'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { OA_APPLY_STATUS, OA_MEETING_ROOM_USE_STATUS } from '../../../utils/constants'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

/** BPM 流程实例状态：与字典 bpm_process_instance_status 一致 */
const BPM_STATUS = { RUNNING: 1, APPROVE: 2 } as const

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<MeetingRoomBooking>() // 详情数据
const operating = ref(false) // 操作进行中状态
const canStart = computed(() => // 审批通过且待使用时，可开始使用
  formData.value?.status === BPM_STATUS.APPROVE
  && formData.value?.useStatus === OA_MEETING_ROOM_USE_STATUS.PENDING
  && hasAccessByCodes(['oa:meeting-room-booking:update']))
const canFinish = computed(() => // 审批通过且使用中时，可完成使用
  formData.value?.status === BPM_STATUS.APPROVE
  && formData.value?.useStatus === OA_MEETING_ROOM_USE_STATUS.IN_USE
  && hasAccessByCodes(['oa:meeting-room-booking:update']))
const canCancel = computed(() => // 审批中，或审批通过但未开始使用时，可取消
  hasAccessByCodes(['oa:meeting-room-booking:update'])
  && (formData.value?.status === BPM_STATUS.RUNNING
    || (formData.value?.status === BPM_STATUS.APPROVE && formData.value?.useStatus === OA_MEETING_ROOM_USE_STATUS.PENDING)))
const showActions = computed(() =>
  formData.value?.status === OA_APPLY_STATUS.NOT_START || canStart.value || canFinish.value || canCancel.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载会议室预定详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMeetingRoomBooking(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑会议室预定 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/meetingroom/booking/form/index?id=${props.id}`,
  })
}

/** 二次确认后执行操作 */
async function confirmThen(msg: string, action: () => Promise<any>, successText: string) {
  try {
    await dialog.confirm({ title: '提示', msg })
  } catch {
    return
  }
  operating.value = true
  try {
    await action()
    toast.success(successText)
    uni.$emit('oa:meeting-room-booking:reload')
  } finally {
    operating.value = false
  }
}

/** 删除预定草稿 */
function handleDelete() {
  if (!props.id) {
    return
  }
  confirmThen('确定要删除该会议室预定吗？', async () => {
    await deleteMeetingRoomBooking(Number(props.id))
    delay(handleBack)
  }, '删除成功')
}

/** 提交审批 */
function handleSubmitApply() {
  if (!props.id) {
    return
  }
  confirmThen('确定要提交审批吗？', async () => {
    await submitMeetingRoomBooking(Number(props.id))
    delay(handleBack)
  }, '提交成功')
}

/** 取消预定 */
function handleCancel() {
  if (!props.id) {
    return
  }
  confirmThen('确定要取消该会议室预定吗？', () => cancelMeetingRoomBooking(Number(props.id)), '取消成功')
}

/** 开始使用 */
function handleStart() {
  if (!props.id) {
    return
  }
  confirmThen('确定要开始使用该会议室吗？', () => startMeetingRoomBooking(Number(props.id)), '已开始使用')
}

/** 完成使用 */
function handleFinish() {
  if (!props.id) {
    return
  }
  confirmThen('确定要完成使用该会议室吗？', () => finishMeetingRoomBooking(Number(props.id)), '已完成使用')
}

/** 查看审批进度 */
function handleViewProcess() {
  uni.navigateTo({
    url: `/pages-bpm/processInstance/detail/index?id=${formData.value?.processInstanceId}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:meeting-room-booking:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:meeting-room-booking:reload', getDetail)
})
</script>
