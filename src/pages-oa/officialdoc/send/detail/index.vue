<template>
  <view class="yd-page-container pb-160rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公文发文详情"
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
        <wd-cell title="公文标题" :value="formData?.title || '-'" />
        <wd-cell title="公文文号" :value="formData?.documentNo || '-'" />
        <wd-cell title="字号前缀" :value="formData?.noPrefix || '-'" />
        <wd-cell title="年份" :value="formData?.year != null ? String(formData.year) : '-'" />
        <wd-cell title="第几号文" :value="formData?.sequence != null ? String(formData.sequence) : '-'" />
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
        <wd-cell title="发文日期" :value="formatDateTime(formData?.issueTime) || '-'" />
        <wd-cell title="发文部门" :value="formData?.sendDeptName || '-'" />
        <wd-cell title="主送部门" :value="formData?.mainDeptNames?.join('、') || '-'" />
        <wd-cell title="抄送部门" :value="formData?.copyDeptNames?.join('、') || '-'" />
        <wd-cell title="签发人" :value="formData?.signerName || '-'" />
        <wd-cell title="附注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 公文正文：富文本消毒后渲染；纯文本（移动端自产）用 pre-wrap 保留换行 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          公文正文
        </view>
        <rich-text
          v-if="formData?.content && isHtmlContent(formData.content)"
          :nodes="sanitizeRichText(formData.content)"
        />
        <view
          v-else-if="formData?.content"
          class="whitespace-pre-wrap text-28rpx text-[#333]"
        >
          {{ formData.content }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无正文
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

    </view>

    <!-- 底部操作按钮 -->
    <view v-if="formData?.processInstanceId || (showActions)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="formData?.status === OA_APPLY_STATUS.NOT_START">
          <wd-button
            v-if="hasAccessByCodes(['oa:officialdoc-send:update'])"
            class="flex-1" type="warning" @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:officialdoc-send:update'])"
            class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply"
          >
            提交审批
          </wd-button>
        </template>
        <!-- 未提交、审批不通过和已取消的发文允许删除，与后端校验一致 -->
        <wd-button
          v-if="isDeletableStatus && hasAccessByCodes(['oa:officialdoc-send:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
        <wd-button
          v-if="formData?.status === BPM_STATUS.RUNNING && hasAccessByCodes(['oa:officialdoc-send:update'])"
          class="flex-1" type="danger" :loading="cancelling" @click="handleCancel"
        >
          撤销发文
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
import type { OfficialDocSend } from '@/api/oa/officialdoc-send'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { cancelOfficialDocSend, deleteOfficialDocSend, getOfficialDocSend, submitOfficialDocSend } from '@/api/oa/officialdoc-send'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { isHtmlContent, sanitizeRichText } from '@/utils/format'
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
const formData = ref<OfficialDocSend>() // 详情数据
const submitting = ref(false) // 提交审批状态
const deleting = ref(false) // 删除状态
const cancelling = ref(false) // 撤销状态
const showActions = computed(() =>
  formData.value?.status === OA_APPLY_STATUS.NOT_START
  || formData.value?.status === OA_APPLY_STATUS.REJECT
  || formData.value?.status === OA_APPLY_STATUS.CANCEL
  || formData.value?.status === BPM_STATUS.RUNNING)
const isDeletableStatus = computed(() =>
  [OA_APPLY_STATUS.NOT_START, OA_APPLY_STATUS.REJECT, OA_APPLY_STATUS.CANCEL]
    .includes(formData.value?.status as -1 | 3 | 4))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载发文详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getOfficialDocSend(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑发文 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/officialdoc/send/form/index?id=${props.id}`,
  })
}

/** 删除发文草稿 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该公文发文吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteOfficialDocSend(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:officialdoc-send:reload')
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
    await submitOfficialDocSend(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:officialdoc-send:reload')
    delay(handleBack)
  } finally {
    submitting.value = false
  }
}

/** 撤销发文 */
async function handleCancel() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要撤销该公文发文吗？',
    })
  } catch {
    return
  }
  cancelling.value = true
  try {
    await cancelOfficialDocSend(Number(props.id))
    toast.success('撤销成功')
    uni.$emit('oa:officialdoc-send:reload')
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
  uni.$on('oa:officialdoc-send:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:officialdoc-send:reload', getDetail)
})
</script>
