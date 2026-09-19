<template>
  <view class="yd-page-container pb-160rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="用车申请详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="申请单号" :value="formData?.no ?? '-'" />
        <wd-cell title="审批状态">
          <text v-if="formData?.status === OA_APPLY_STATUS.NOT_START" class="text-28rpx text-[#999]">未提交</text>
          <dict-tag v-else-if="formData" :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="还车状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_VEHICLE_RETURN_STATUS" :value="formData.returnStatus" />
        </wd-cell>
        <wd-cell title="车牌号" :value="formData?.vehicleNo || '-'" />
        <wd-cell title="预计出车时间" :value="formatDateTime(formData?.startTime) || '-'" />
        <wd-cell title="预计回车时间" :value="formatDateTime(formData?.endTime) || '-'" />
        <wd-cell title="出车地点" :value="formData?.startLocation || '-'" />
        <wd-cell title="预计回车地点" :value="formData?.endLocation || '-'" />
        <wd-cell title="随行人" :value="formData?.passenger || '-'" />
        <wd-cell title="申请人" :value="formData?.userName || '-'" />
        <wd-cell title="申请部门" :value="formData?.deptName || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="申请时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 用车事由 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          用车事由
        </view>
        <view v-if="formData?.reason" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.reason }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无事由
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
    <view v-if="formData?.processInstanceId || (showActions)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="formData?.status === OA_APPLY_STATUS.NOT_START">
          <wd-button
            v-if="hasAccessByCodes(['oa:vehicle-apply:update'])"
            class="flex-1" type="warning" @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:vehicle-apply:delete'])"
            class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
          >
            删除
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:vehicle-apply:create'])"
            class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply"
          >
            提交审批
          </wd-button>
        </template>
        <wd-button
          v-if="formData?.status === BPM_STATUS.RUNNING && hasAccessByCodes(['oa:vehicle-apply:update'])"
          class="flex-1" type="danger" :loading="cancelling" @click="handleCancel"
        >
          取消申请
        </wd-button>
        <wd-button
          v-if="canReturn"
          class="flex-1" type="primary" @click="handleReturn"
        >
          发起还车
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
import type { VehicleApply } from '@/api/oa/vehicle-apply'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { cancelVehicleApply, deleteVehicleApply, getVehicleApply, submitVehicleApply } from '@/api/oa/vehicle-apply'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { OA_APPLY_STATUS, OA_VEHICLE_RETURN_STATUS } from '../../../utils/constants'

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
const formData = ref<VehicleApply>() // 详情数据
const submitting = ref(false) // 提交审批状态
const deleting = ref(false) // 删除状态
const cancelling = ref(false) // 取消申请状态
const canReturn = computed(() => // 审批通过且待还车时，可发起还车
  formData.value?.status === BPM_STATUS.APPROVE
  && formData.value?.returnStatus === OA_VEHICLE_RETURN_STATUS.PENDING_RETURN
  && hasAccessByCodes(['oa:vehicle-return:create']))
const showActions = computed(() =>
  formData.value?.status === OA_APPLY_STATUS.NOT_START
  || formData.value?.status === BPM_STATUS.RUNNING
  || canReturn.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载用车申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getVehicleApply(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑用车申请 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/vehicle/apply/form/index?id=${props.id}`,
  })
}

/** 删除用车申请草稿 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该用车申请吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteVehicleApply(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:vehicle-apply:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
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
    await submitVehicleApply(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:vehicle-apply:reload')
    delay(handleBack)
  } finally {
    submitting.value = false
  }
}

/** 取消申请 */
async function handleCancel() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要取消该用车申请吗？',
    })
  } catch {
    return
  }
  cancelling.value = true
  try {
    await cancelVehicleApply(Number(props.id))
    toast.success('取消成功')
    uni.$emit('oa:vehicle-apply:reload')
    getDetail()
  } finally {
    cancelling.value = false
  }
}

/** 发起还车：跳还车申请表单并带入用车申请 */
function handleReturn() {
  uni.navigateTo({
    url: `/pages-oa/vehicle/return/form/index?applyId=${props.id}`,
  })
}

/** 查看审批进度 */
function handleViewProcess() {
  uni.navigateTo({
    url: `/pages-bpm/processInstance/detail/index?id=${formData.value?.processInstanceId}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:vehicle-apply:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:vehicle-apply:reload', getDetail)
})
</script>
