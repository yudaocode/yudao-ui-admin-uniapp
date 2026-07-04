<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="付款单详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="付款单号" :value="formData?.no || '-'" />
        <wd-cell title="供应商" :value="formData?.supplierName || '-'" />
        <wd-cell title="付款时间" :value="formatDateTime(formData?.paymentTime) || '-'" />
        <wd-cell title="创建人" :value="formData?.creatorName || '-'" />
        <wd-cell title="财务人员" :value="formData?.financeUserName || '-'" />
        <wd-cell title="付款账户" :value="formData?.accountName || '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.ERP_AUDIT_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="合计付款" :value="formatMoney(formData?.totalPrice)" />
        <wd-cell title="优惠金额" :value="formatMoney(formData?.discountPrice)" />
        <wd-cell title="实际付款" :value="formatMoney(formData?.paymentPrice)" />
        <wd-cell title="附件" :value="formData?.fileUrl ? '查看附件' : '-'" :is-link="!!formData?.fileUrl" @click="handleOpenFile" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 付款明细 -->
      <view v-if="items.length > 0" class="mt-24rpx">
        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          付款明细
        </view>
        <view class="px-24rpx">
          <view
            v-for="(item, index) in items"
            :key="index"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
              明细 {{ index + 1 }}
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">采购单据编号：</text>
              <text class="min-w-0 flex-1">{{ item.bizNo || '-' }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">采购业务类型：</text>
              <text class="min-w-0 flex-1">{{ getBizTypeName(item.bizType) }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">应付金额：</text>
              <text class="min-w-0 flex-1">{{ formatMoney(item.totalPrice) }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">已付金额：</text>
              <text class="min-w-0 flex-1">{{ formatMoney(item.paidPrice) }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">本次付款：</text>
              <text class="min-w-0 flex-1">{{ formatMoney(item.paymentPrice) }}</text>
            </view>
            <view v-if="item.remark" class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
              <text class="min-w-0 flex-1">{{ item.remark }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="canUpdate || canUpdateStatus || canDelete" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canUpdateStatus" class="flex-1" type="primary" :loading="statusLoading" @click="handleUpdateStatus(nextStatus)">
          {{ nextStatus === ErpAuditStatusEnum.AUDITED ? '审批' : '反审批' }}
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FinancePayment } from '@/api/erp/finance/payment'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteFinancePayment, getFinancePayment, updateFinancePaymentStatus } from '@/api/erp/finance/payment'
import { useAccess } from '@/hooks/useAccess'
import { openAttachment } from '@/utils/download'
import { buildErpDocumentDetail } from '@/pages-erp/utils/erp'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, ErpAuditStatusEnum, ErpBizType } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<FinancePayment>() // 详情数据
const deleting = ref(false) // 删除状态
const statusLoading = ref(false) // 审批提交状态
const items = computed(() => Array.isArray(formData.value?.items) ? formData.value.items : [])
const canUpdate = computed(() => formData.value?.status !== ErpAuditStatusEnum.AUDITED && hasAccessByCodes(['erp:finance-payment:update']))
const canDelete = computed(() => hasAccessByCodes(['erp:finance-payment:delete']))
const canUpdateStatus = computed(() => hasAccessByCodes(['erp:finance-payment:update-status']) && (formData.value?.status === ErpAuditStatusEnum.UNAUDITED || formData.value?.status === ErpAuditStatusEnum.AUDITED))
const nextStatus = computed(() => formData.value?.status === ErpAuditStatusEnum.UNAUDITED ? ErpAuditStatusEnum.AUDITED : ErpAuditStatusEnum.UNAUDITED)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/finance/payment/index')
}

function getBizTypeName(value?: number) {
  if (value === ErpBizType.PURCHASE_IN) {
    return '采购入库'
  }
  if (value === ErpBizType.PURCHASE_RETURN) {
    return '采购退货'
  }
  return '-'
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await buildErpDocumentDetail(await getFinancePayment(props.id), 'finance-payment')
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/finance/payment/form/index?id=${props.id}` })
}

/** 打开附件 */
function handleOpenFile() {
  if (formData.value?.fileUrl) {
    openErpFile(formData.value.fileUrl)
  }
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该付款单吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteFinancePayment([props.id])
    toast.success('删除成功')
    uni.$emit('erp:finance-payment:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 审批或反审批 */
async function handleUpdateStatus(status: number) {
  if (!props.id) {
    return
  }
  const actionName = status === ErpAuditStatusEnum.AUDITED ? '审批' : '反审批'
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${actionName}该付款单吗？` })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updateFinancePaymentStatus(props.id, status)
    toast.success(`${actionName}成功`)
    uni.$emit('erp:finance-payment:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

onMounted(() => {
  getDetail()
  uni.$on('erp:finance-payment:reload', getDetail)
})

onUnload(() => {
  uni.$off('erp:finance-payment:reload', getDetail)
})
</script>
