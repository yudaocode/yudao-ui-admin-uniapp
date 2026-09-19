<template>
  <view class="yd-page-container pb-160rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="差旅报销详情"
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
        <wd-cell title="支付状态" :value="formData?.payStatus ? '已支付' : '未支付'" />
        <wd-cell title="关联出差申请" :value="formData?.travelApplyNo || '-'" />
        <wd-cell title="开始日期" :value="formatDate(formData?.startTime) || '-'" />
        <wd-cell title="结束日期" :value="formatDate(formData?.endTime) || '-'" />
        <wd-cell title="出差天数" :value="formData?.days != null ? `${formData.days} 天` : '-'" />
        <wd-cell title="报销总金额（元）" :value="formData?.totalPrice != null ? String(formData.totalPrice) : '-'" />
        <wd-cell title="申请人" :value="formData?.creatorName || '-'" />
        <wd-cell title="申请部门" :value="formData?.deptName || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 出差事由 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          出差事由
        </view>
        <view v-if="formData?.reason" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.reason }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无事由
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          费用明细（{{ formData?.items?.length ?? 0 }}）
        </view>
        <view v-if="!formData?.items?.length" class="py-16rpx text-26rpx text-[#999]">
          暂无费用明细
        </view>
        <view
          v-for="(row, index) in formData?.items"
          :key="index"
          class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
        >
          <view class="mb-8rpx flex items-center justify-between gap-12rpx">
            <dict-tag :type="DICT_TYPE.OA_EXPENSE_TYPE" :value="row.expenseType" />
            <text class="shrink-0 text-30rpx text-[#fa541c] font-semibold">{{ row.price != null ? `${row.price} 元` : '-' }}</text>
          </view>
          <view class="text-26rpx text-[#666]">
            {{ formatDate(row.expenseTime) || '-' }}
            <text v-if="row.departureCity || row.arrivalCity">
              · {{ row.departureCity || '-' }} → {{ row.arrivalCity || '-' }}
            </text>
          </view>
          <view v-if="row.description" class="mt-4rpx text-26rpx text-[#999]">
            {{ row.description }}
          </view>
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
        <template v-if="canRework">
          <wd-button
            v-if="hasAccessByCodes(['oa:travel-reimbursement:save'])"
            class="flex-1" type="warning" @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:travel-reimbursement:delete'])"
            class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
          >
            删除
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:travel-reimbursement:save'])"
            class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply"
          >
            提交审批
          </wd-button>
        </template>
        <wd-button
          v-if="formData?.status === BPM_STATUS.RUNNING && hasAccessByCodes(['oa:travel-reimbursement:save'])"
          class="flex-1" type="danger" :loading="cancelling" @click="handleCancel"
        >
          撤回申请
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
import type { TravelReimbursement } from '@/api/oa/travel-reimbursement'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { cancelTravelReimbursement, deleteTravelReimbursement, getTravelReimbursement, submitTravelReimbursement } from '@/api/oa/travel-reimbursement'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
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
const formData = ref<TravelReimbursement>() // 详情数据
const submitting = ref(false) // 提交审批状态
const deleting = ref(false) // 删除状态
const cancelling = ref(false) // 撤回申请状态
const canRework = computed(() => // 草稿、审批不通过、已取消可返工
  ([OA_APPLY_STATUS.NOT_START, OA_APPLY_STATUS.REJECT, OA_APPLY_STATUS.CANCEL] as number[]).includes(formData.value?.status ?? 0))
const showActions = computed(() =>
  canRework.value || formData.value?.status === BPM_STATUS.RUNNING)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载差旅报销详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getTravelReimbursement(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑差旅报销 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/travel/reimbursement/form/index?id=${props.id}`,
  })
}

/** 删除差旅报销草稿 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该差旅报销吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteTravelReimbursement(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:travel-reimbursement:reload')
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
    await submitTravelReimbursement(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:travel-reimbursement:reload')
    delay(handleBack)
  } finally {
    submitting.value = false
  }
}

/** 撤回申请 */
async function handleCancel() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要撤回该差旅报销吗？',
    })
  } catch {
    return
  }
  cancelling.value = true
  try {
    await cancelTravelReimbursement(Number(props.id))
    toast.success('撤回成功')
    uni.$emit('oa:travel-reimbursement:reload')
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
  uni.$on('oa:travel-reimbursement:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:travel-reimbursement:reload', getDetail)
})
</script>
