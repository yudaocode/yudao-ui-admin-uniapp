<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="请假详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="标题" :value="formData?.title ?? '-'" />
        <wd-cell title="审批状态">
          <text v-if="formData?.status === OA_APPLY_STATUS.NOT_START" class="text-28rpx text-[#999]">未提交</text>
          <dict-tag v-else-if="formData" :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="紧急程度">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_APPLY_URGENCY" :value="formData.urgency" />
        </wd-cell>
        <wd-cell title="请假类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_LEAVE_TYPE" :value="formData.type" />
        </wd-cell>
        <wd-cell title="开始时间" :value="formatDateTime(formData?.startTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDateTime(formData?.endTime) || '-'" />
        <wd-cell title="请假天数" :value="formData?.days != null ? `${formData.days} 天` : '-'" />
        <wd-cell title="申请人" :value="formData?.creatorName || '-'" />
        <wd-cell title="申请时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 申请原因 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          申请原因
        </view>
        <view v-if="formData?.reason" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.reason }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无原因
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

      <!-- 审批进度入口 -->
      <view
        v-if="formData?.processInstanceId"
        class="mt-20rpx flex items-center justify-between rounded-12rpx bg-white p-24rpx"
        @click="handleViewProcess"
      >
        <text class="text-28rpx text-[#333]">审批进度</text>
        <wd-icon name="arrow-right" size="28rpx" color="#999" />
      </view>
    </view>

    <!-- 底部操作按钮：草稿可编辑、提交审批 -->
    <view v-if="formData?.status === OA_APPLY_STATUS.NOT_START" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:leave-apply:create'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:leave-apply:create'])"
          class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply"
        >
          提交审批
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { LeaveApply } from '@/api/oa/leave'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getLeaveApply, submitLeaveApply } from '@/api/oa/leave'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { OA_APPLY_STATUS } from '../../utils/constants'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<LeaveApply>() // 详情数据
const submitting = ref(false) // 提交审批状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载请假申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getLeaveApply(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑请假申请 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/leave/form/index?id=${props.id}`,
  })
}

/** 提交审批 */
async function handleSubmitApply() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要提交审批吗？',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitLeaveApply(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:leave:reload')
    delay(handleBack)
  } finally {
    submitting.value = false
  }
}

/** 查看审批进度 */
function handleViewProcess() {
  uni.navigateTo({
    url: `/pages-bpm/processInstance/detail/index?id=${formData.value?.processInstanceId}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:leave:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:leave:reload', getDetail)
})
</script>
