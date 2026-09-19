<template>
  <view class="yd-page-container pb-160rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公文收文详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="单据编号" :value="formData?.no ?? '-'" />
        <wd-cell title="审批状态">
          <text v-if="formData?.status === OA_APPLY_STATUS.NOT_START" class="text-28rpx text-[#999]">未提交</text>
          <dict-tag v-else-if="formData" :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="办理状态">
          <dict-tag v-if="formData?.handleStatus != null" :type="DICT_TYPE.OA_OFFICIAL_DOC_HANDLE_STATUS" :value="formData.handleStatus" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="公文标题" :value="formData?.title || '-'" />
        <wd-cell title="来文字号" :value="formData?.documentNo || '-'" />
        <wd-cell title="发文部门" :value="formData?.sendDeptName || '-'" />
        <wd-cell title="发文日期" :value="formatDateTime(formData?.issueTime) || '-'" />
        <wd-cell title="签发人" :value="formData?.signerName || '-'" />
        <wd-cell title="密级">
          <dict-tag v-if="formData?.secrecyLevel != null" :type="DICT_TYPE.OA_OFFICIAL_DOC_SECRET_LEVEL" :value="formData.secrecyLevel" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="紧急程度">
          <dict-tag v-if="formData?.urgencyLevel != null" :type="DICT_TYPE.OA_OFFICIAL_DOC_URGENCY_LEVEL" :value="formData.urgencyLevel" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="公开类别">
          <dict-tag v-if="formData?.disclosureType != null" :type="DICT_TYPE.OA_OFFICIAL_DOC_PUBLIC_CATEGORY" :value="formData.disclosureType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="收文类型">
          <dict-tag v-if="formData?.receiveType != null" :type="DICT_TYPE.OA_OFFICIAL_DOC_RECEIVE_TYPE" :value="formData.receiveType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="收文时间" :value="formatDateTime(formData?.receiveTime) || '-'" />
        <wd-cell title="收文部门" :value="formData?.receiveDeptName || '-'" />
        <wd-cell title="主办人" :value="formData?.handlerName || '-'" />
        <wd-cell title="办理期限" :value="formatDateTime(formData?.deadlineTime) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 内容摘要 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          内容摘要
        </view>
        <view v-if="formData?.summary" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.summary }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无摘要
        </view>
      </view>

      <!-- 领导批示 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          领导批示
        </view>
        <view v-if="formData?.instruction" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.instruction }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无批示
        </view>
      </view>

      <!-- 办理结果 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          办理结果
        </view>
        <view v-if="formData?.result" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.result }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无办理结果
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

      <!-- 正式公文 -->
      <view
        v-if="formData?.formalFileUrl"
        class="mt-20rpx flex items-center justify-between rounded-12rpx bg-white p-24rpx"
        @click="openAttachment(formData.formalFileUrl)"
      >
        <text class="text-28rpx text-[#333]">正式公文</text>
        <wd-icon name="arrow-right" size="28rpx" color="#999" />
      </view>

      <!-- 关联发文入口 -->
      <view
        v-if="formData?.sendId"
        class="mt-20rpx flex items-center justify-between rounded-12rpx bg-white p-24rpx"
        @click="handleViewSend"
      >
        <text class="text-28rpx text-[#333]">关联发文</text>
        <wd-icon name="arrow-right" size="28rpx" color="#999" />
      </view>

    </view>

    <!-- 底部操作按钮 -->
    <view v-if="formData?.processInstanceId || (showActions)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canEdit && hasAccessByCodes(['oa:officialdoc-receive:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canDelete && hasAccessByCodes(['oa:officialdoc-receive:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
        <wd-button
          v-if="canSubmit && hasAccessByCodes(['oa:officialdoc-receive:update'])"
          class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply"
        >
          提交审批
        </wd-button>
        <wd-button
          v-if="canCancel && hasAccessByCodes(['oa:officialdoc-receive:update'])"
          class="flex-1" type="danger" :loading="cancelling" @click="handleCancel"
        >
          撤销收文
        </wd-button>
        <wd-button
          v-if="canClaim"
          class="flex-1" type="primary" :loading="claiming" @click="handleClaim"
        >
          签收
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
import type { OfficialDocReceive } from '@/api/oa/officialdoc-receive'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { cancelOfficialDocReceive, claimOfficialDocReceive, deleteOfficialDocReceive, getOfficialDocReceive, submitOfficialDocReceive } from '@/api/oa/officialdoc-receive'
import { useAccess } from '@/hooks/useAccess'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { OA_APPLY_STATUS, OA_OFFICIAL_DOC_RECEIVE_TYPE } from '../../../utils/constants'

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
/** 收文办理状态：与字典 oa_official_doc_handle_status 一致 */
const HANDLE_STATUS = { PENDING_CLAIM: 0 } as const

const { hasAccessByCodes } = useAccess()
const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const formData = ref<OfficialDocReceive>() // 详情数据
const submitting = ref(false) // 提交审批状态
const deleting = ref(false) // 删除状态
const cancelling = ref(false) // 撤销状态
const claiming = ref(false) // 签收状态
const isCreator = computed(() => formData.value?.creator === String(userStore.userInfo?.userId)) // 是否本人创建的手工收文
// 编辑/提交/删除/撤销条件对齐后端：编辑、提交仅未提交草稿；提交还需主送；删除允许未提交、驳回、已取消；撤销限审批中且本人
const canEdit = computed(() => formData.value?.status === OA_APPLY_STATUS.NOT_START && isCreator.value)
const canSubmit = computed(() => canEdit.value && formData.value?.receiveType === OA_OFFICIAL_DOC_RECEIVE_TYPE.MAIN)
const canDelete = computed(() =>
  ([OA_APPLY_STATUS.NOT_START, OA_APPLY_STATUS.REJECT, OA_APPLY_STATUS.CANCEL] as number[]).includes(formData.value?.status ?? 0)
  && isCreator.value)
const canCancel = computed(() => formData.value?.status === BPM_STATUS.RUNNING && isCreator.value)
const canClaim = computed(() =>
  formData.value?.handleStatus === HANDLE_STATUS.PENDING_CLAIM
  && !!formData.value?.sendId // 仅发文自动投递的收文可签收
  && !formData.value?.creator
  && hasAccessByCodes(['oa:officialdoc-receive:update']))
const showActions = computed(() =>
  canEdit.value
  || canDelete.value
  || canSubmit.value
  || canCancel.value
  || canClaim.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载收文详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getOfficialDocReceive(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑收文 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/officialdoc/receive/form/index?id=${props.id}`,
  })
}

/** 删除收文草稿 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该公文收文吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteOfficialDocReceive(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:officialdoc-receive:reload')
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
    await submitOfficialDocReceive(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:officialdoc-receive:reload')
    delay(handleBack)
  } finally {
    submitting.value = false
  }
}

/** 撤销收文 */
async function handleCancel() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要撤销该公文收文吗？',
    })
  } catch {
    return
  }
  cancelling.value = true
  try {
    await cancelOfficialDocReceive(Number(props.id))
    toast.success('撤销成功')
    uni.$emit('oa:officialdoc-receive:reload')
    getDetail()
  } finally {
    cancelling.value = false
  }
}

/** 签收公文 */
async function handleClaim() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要签收该公文吗？',
    })
  } catch {
    return
  }
  claiming.value = true
  try {
    await claimOfficialDocReceive(Number(props.id))
    toast.success('签收成功')
    uni.$emit('oa:officialdoc-receive:reload')
    getDetail()
  } finally {
    claiming.value = false
  }
}

/** 查看关联发文 */
function handleViewSend() {
  uni.navigateTo({
    url: `/pages-oa/officialdoc/send/detail/index?id=${formData.value?.sendId}`,
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
  uni.$on('oa:officialdoc-receive:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:officialdoc-receive:reload', getDetail)
})
</script>
