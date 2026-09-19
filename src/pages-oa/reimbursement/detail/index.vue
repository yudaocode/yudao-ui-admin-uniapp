<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="费用报销详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="标题" :value="formData?.title || '-'" />
        <wd-cell title="审批状态">
          <text v-if="formData?.status === OA_APPLY_STATUS.NOT_START" class="text-28rpx text-[#999]">未提交</text>
          <dict-tag v-else-if="formData" :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="紧急程度">
          <dict-tag v-if="formData?.urgency != null" :type="DICT_TYPE.OA_APPLY_URGENCY" :value="formData.urgency" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="报销方式">
          <dict-tag v-if="formData?.paymentMethod != null" :type="DICT_TYPE.OA_REIMBURSEMENT_PAYMENT_METHOD" :value="formData.paymentMethod" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="相关客户" :value="formData?.customerName || '-'" />
        <wd-cell title="证明人" :value="witnessUserName || '-'" />
        <wd-cell title="票据总数" :value="formData?.invoiceCount != null ? `${formData.invoiceCount} 张` : '-'" />
        <wd-cell title="报销总金额" :value="formData?.totalPrice != null ? `${formData.totalPrice} 元` : '-'" />
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
          暂无申请原因
        </view>
      </view>

      <!-- 报销明细 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          报销明细（{{ formData?.items?.length ?? 0 }}）
        </view>
        <view v-if="!formData?.items?.length" class="py-16rpx text-26rpx text-[#999]">
          暂无报销明细
        </view>
        <view
          v-for="(row, index) in formData?.items"
          :key="index"
          class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
        >
          <view class="mb-8rpx flex items-center justify-between gap-12rpx">
            <text class="line-clamp-1 min-w-0 flex-1 text-30rpx text-[#333] font-semibold">
              {{ row.description || '费用明细' }}
            </text>
            <dict-tag :type="DICT_TYPE.OA_EXPENSE_TYPE" :value="row.expenseType" />
          </view>
          <view class="text-26rpx text-[#666]">
            {{ formatDateTime(row.expenseTime) || '-' }} · 票据 {{ row.invoiceCount ?? 0 }} 张 · {{ row.price ?? 0 }} 元
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

    <!-- 底部操作按钮 -->
    <view v-if="formData?.status === OA_APPLY_STATUS.NOT_START && hasAccessByCodes(['oa:reimbursement:create'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply">
          提交审批
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Reimbursement } from '@/api/oa/reimbursement'
import type { User } from '@/api/system/user'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getReimbursement, submitReimbursement } from '@/api/oa/reimbursement'
import { getSimpleUserList } from '@/api/system/user'
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
const formData = ref<Reimbursement>() // 详情数据
const submitting = ref(false) // 提交审批状态
const userList = ref<User[]>([]) // 用户列表，用于证明人昵称回显
const witnessUserName = computed(() => // 证明人昵称
  userList.value.find(user => user.id === formData.value?.witnessUserId)?.nickname)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载报销详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getReimbursement(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑报销草稿 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/reimbursement/form/index?id=${props.id}`,
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
    await submitReimbursement(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:reimbursement:reload')
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
  uni.$on('oa:reimbursement:reload', getDetail)
  getDetail()
  getSimpleUserList().then((list) => {
    userList.value = list
  })
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:reimbursement:reload', getDetail)
})
</script>
