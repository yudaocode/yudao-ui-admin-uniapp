<template>
  <view class="yd-page-container pb-160rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="还车申请详情"
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
        <wd-cell title="用车申请单号" :value="formData?.applyNo || '-'" />
        <wd-cell title="车牌号" :value="formData?.vehicleNo || '-'" />
        <wd-cell title="实际出车时间" :value="formatDateTime(formData?.actualStartTime) || '-'" />
        <wd-cell title="实际出车地点" :value="formData?.startLocation || '-'" />
        <wd-cell title="实际回车时间" :value="formatDateTime(formData?.actualReturnTime) || '-'" />
        <wd-cell title="回车地点" :value="formData?.returnLocation || '-'" />
        <wd-cell title="用车事由" :value="formData?.reason || '-'" />
        <wd-cell title="随行人" :value="formData?.passenger || '-'" />
        <wd-cell title="申请人" :value="formData?.userName || '-'" />
        <wd-cell title="申请部门" :value="formData?.deptName || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="申请时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

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
    <view
      v-if="formData?.processInstanceId || formData?.status === OA_APPLY_STATUS.NOT_START || formData?.status === BPM_STATUS.RUNNING"
      class="yd-detail-footer"
    >
      <view class="yd-detail-footer-actions">
        <template v-if="formData?.status === OA_APPLY_STATUS.NOT_START">
          <wd-button
            v-if="hasAccessByCodes(['oa:vehicle-return:update'])"
            class="flex-1" type="warning" @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:vehicle-return:delete'])"
            class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
          >
            删除
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:vehicle-return:create'])"
            class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply"
          >
            提交审批
          </wd-button>
        </template>
        <wd-button
          v-if="formData?.status === BPM_STATUS.RUNNING && hasAccessByCodes(['oa:vehicle-return:update'])"
          class="flex-1" type="danger" :loading="cancelling" @click="handleCancel"
        >
          取消申请
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
import type { VehicleReturn } from '@/api/oa/vehicle/return'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { cancelVehicleReturn, deleteVehicleReturn, getVehicleReturn, submitVehicleReturn } from '@/api/oa/vehicle/return'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { OA_APPLY_STATUS } from '../../../utils/constants'

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
const BPM_STATUS = { RUNNING: 1 } as const

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<VehicleReturn>() // 详情数据
const submitting = ref(false) // 提交审批状态
const deleting = ref(false) // 删除状态
const cancelling = ref(false) // 取消申请状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载还车申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getVehicleReturn(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑还车申请 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/vehicle/return/form/index?id=${props.id}`,
  })
}

/** 删除还车申请草稿 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该还车申请吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteVehicleReturn(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:vehicle-return:reload')
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
    await submitVehicleReturn(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:vehicle-return:reload')
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
      msg: '确定要取消该还车申请吗？',
    })
  } catch {
    return
  }
  cancelling.value = true
  try {
    await cancelVehicleReturn(Number(props.id))
    toast.success('取消成功')
    uni.$emit('oa:vehicle-return:reload')
    getDetail()
  } finally {
    cancelling.value = false
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
  uni.$on('oa:vehicle-return:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:vehicle-return:reload', getDetail)
})
</script>
