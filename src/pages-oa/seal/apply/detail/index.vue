<template>
  <view class="yd-page-container pb-160rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="用印申请详情"
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
        <wd-cell title="用印状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SEAL_USE_STATUS" :value="formData.useStatus" />
        </wd-cell>
        <wd-cell title="印章" :value="formData?.sealName ? `${formData.sealName}（${formData.sealNo || '-'}）` : '-'" />
        <wd-cell title="印章类型">
          <dict-tag v-if="formData?.sealType != null" :type="DICT_TYPE.OA_SEAL_TYPE" :value="formData.sealType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="用印类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SEAL_APPLY_TYPE" :value="formData.type" />
        </wd-cell>
        <wd-cell title="用印方式">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SEAL_USE_MODE" :value="formData.mode" />
        </wd-cell>
        <wd-cell title="文件标题" :value="formData?.documentTitle || '-'" />
        <wd-cell title="文件类型" :value="formData?.documentType || '-'" />
        <wd-cell title="文件份数" :value="formData?.documentCount != null ? String(formData.documentCount) : '-'" />
        <!-- 合同字段仅合同类用印展示，归还时间仅借用方式展示（对齐 PC） -->
        <wd-cell v-if="formData?.type === OA_SEAL_APPLY_TYPE.CONTRACT" title="合同金额（元）" :value="formData?.contractPrice != null ? String(formData.contractPrice) : '-'" />
        <wd-cell v-if="formData?.type === OA_SEAL_APPLY_TYPE.CONTRACT" title="合同对方" :value="formData?.contractParty || '-'" />
        <wd-cell title="预计用印时间" :value="formatDateTime(formData?.expectedUseTime) || '-'" />
        <wd-cell v-if="formData?.mode === OA_SEAL_USE_MODE.BORROW" title="预计归还时间" :value="formatDateTime(formData?.expectedReturnTime) || '-'" />
        <wd-cell title="实际用印时间" :value="formatDateTime(formData?.actualUseTime) || '-'" />
        <wd-cell v-if="formData?.mode === OA_SEAL_USE_MODE.BORROW" title="实际归还时间" :value="formatDateTime(formData?.actualReturnTime) || '-'" />
        <wd-cell title="是否紧急" :value="formData?.urgent ? '是' : '否'" />
        <wd-cell title="申请人" :value="formData?.userName || '-'" />
        <wd-cell title="申请部门" :value="formData?.deptName || '-'" />
        <wd-cell title="保管人" :value="formData?.keeperName || '-'" />
        <wd-cell title="保管部门" :value="formData?.keeperDeptName || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 用印事由 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          用印事由
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
    <view v-if="formData?.processInstanceId || showActions" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="formData?.status === OA_APPLY_STATUS.NOT_START">
          <wd-button
            v-if="hasAccessByCodes(['oa:seal-apply:update'])"
            class="flex-1" type="warning" @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:seal-apply:delete'])"
            class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
          >
            删除
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:seal-apply:create'])"
            class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply"
          >
            提交审批
          </wd-button>
        </template>
        <wd-button
          v-if="formData?.status === BPM_STATUS.RUNNING && hasAccessByCodes(['oa:seal-apply:update'])"
          class="flex-1" type="danger" :loading="cancelling" @click="handleCancel"
        >
          撤销申请
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
import type { SealApply } from '@/api/oa/seal-apply'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { cancelSealApply, deleteSealApply, getSealApply, submitSealApply } from '@/api/oa/seal-apply'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { OA_APPLY_STATUS, OA_SEAL_APPLY_TYPE, OA_SEAL_USE_MODE } from '../../../utils/constants'

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
const formData = ref<SealApply>() // 详情数据
const submitting = ref(false) // 提交审批状态
const deleting = ref(false) // 删除状态
const cancelling = ref(false) // 撤销申请状态
const showActions = computed(() =>
  formData.value?.status === OA_APPLY_STATUS.NOT_START
  || formData.value?.status === BPM_STATUS.RUNNING)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载用印申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSealApply(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑用印申请 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/seal/apply/form/index?id=${props.id}`,
  })
}

/** 删除用印申请草稿 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该用印申请吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteSealApply(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:seal-apply:reload')
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
    await submitSealApply(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:seal-apply:reload')
    delay(handleBack)
  } finally {
    submitting.value = false
  }
}

/** 撤销申请 */
async function handleCancel() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要撤销该用印申请吗？',
    })
  } catch {
    return
  }
  cancelling.value = true
  try {
    await cancelSealApply(Number(props.id))
    toast.success('撤销成功')
    uni.$emit('oa:seal-apply:reload')
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
  uni.$on('oa:seal-apply:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:seal-apply:reload', getDetail)
})
</script>
