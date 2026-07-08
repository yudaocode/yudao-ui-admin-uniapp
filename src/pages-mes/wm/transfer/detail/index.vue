<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 库存调拨详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="转移单编号" :value="formData?.code || '-'" />
        <wd-cell title="转移单名称" :value="formData?.name || '-'" />
        <wd-cell title="转移单类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_WM_TRANSFER_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="是否配送" :value="formData?.deliveryFlag ? '是' : '否'" />
        <wd-cell title="是否确认" :value="formData?.confirmFlag ? '是' : '否'" />
        <wd-cell title="转移日期" :value="formatDateTime(formData?.transferDate) || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_TRANSFER_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell v-if="isOuterType" title="收货人" :value="formData?.recipientName || '-'" />
        <wd-cell v-if="isOuterType" title="联系电话" :value="formData?.recipientTelephone || '-'" />
        <wd-cell v-if="isOuterType" title="目的地" :value="formData?.destinationAddress || '-'" />
        <wd-cell v-if="isOuterType" title="承运商" :value="formData?.carrier || '-'" />
        <wd-cell v-if="isOuterType" title="运输单号" :value="formData?.shippingNumber || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <transfer-line-list v-if="currentId" :transfer-id="currentId" readonly />

      <view v-if="hasFooter" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-20rpx text-28rpx text-[#333] font-semibold">
          调拨操作
        </view>
        <view class="flex flex-wrap gap-16rpx text-28rpx">
          <wd-button v-if="canUpdatePrepare" class="min-w-180rpx flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="canSubmitPrepare" class="min-w-180rpx flex-1" type="warning" :loading="submitting" @click="handleSubmitTransfer">
            提交
          </wd-button>
          <wd-button v-if="canConfirm" class="min-w-180rpx flex-1" type="success" @click="handleConfirmPage">
            到货确认
          </wd-button>
          <wd-button v-if="canStock" class="min-w-180rpx flex-1" type="success" @click="handleStockPage">
            执行上架
          </wd-button>
          <wd-button v-if="canFinish" class="min-w-180rpx flex-1" type="success" @click="handleFinishPage">
            执行转移
          </wd-button>
          <wd-button v-if="canDeletePrepare" class="min-w-180rpx flex-1" type="danger" :loading="deleting" @click="handleDelete">
            删除
          </wd-button>
          <wd-button v-if="canCancel" class="min-w-180rpx flex-1" type="danger" :loading="canceling" @click="handleCancelTransfer">
            取消
          </wd-button>
        </view>
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canUpdatePrepare" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canSubmitPrepare" class="flex-1" type="warning" :loading="submitting" @click="handleSubmitTransfer">
          提交
        </wd-button>
        <wd-button v-if="canFinish" class="flex-1" type="success" @click="handleFinishPage">
          执行转移
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmTransfer } from '@/api/mes/wm/transfer'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { cancelTransfer, deleteTransfer, getTransfer, submitTransfer } from '@/api/mes/wm/transfer'
import { useAccess } from '@/hooks/useAccess'
import TransferLineList from '@/pages-mes/wm/transfer/components/transfer-line-list.vue'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmTransferStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | string
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
const formData = ref<WmTransfer>() // 详情数据
const currentId = computed(() => props.id ? Number(props.id) : undefined) // 当前详情编号
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canceling = ref(false) // 取消状态
const isOuterType = computed(() => Number(formData.value?.type) === 2)
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-transfer:update'])
  && formData.value?.status === MesWmTransferStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-transfer:delete'])
  && formData.value?.status === MesWmTransferStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-transfer:update'])
  && formData.value?.status === MesWmTransferStatusEnum.PREPARE
))
const canConfirm = computed(() => (
  hasAccessByCodes(['mes:wm-transfer:update'])
  && formData.value?.status === MesWmTransferStatusEnum.UNCONFIRMED
))
const canStock = computed(() => (
  hasAccessByCodes(['mes:wm-transfer:update'])
  && formData.value?.status === MesWmTransferStatusEnum.APPROVING
))
const canFinish = computed(() => (
  hasAccessByCodes(['mes:wm-transfer:finish'])
  && formData.value?.status === MesWmTransferStatusEnum.APPROVED
))
const canCancel = computed(() => (
  hasAccessByCodes(['mes:wm-transfer:update'])
  && (
    formData.value?.status === MesWmTransferStatusEnum.UNCONFIRMED
    || formData.value?.status === MesWmTransferStatusEnum.APPROVING
    || formData.value?.status === MesWmTransferStatusEnum.APPROVED
  )
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canConfirm.value
  || canStock.value
  || canFinish.value
  || canCancel.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/transfer/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getTransfer(currentId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-mes/wm/transfer/form/index?id=${currentId.value}`,
  })
}

/** 到货确认页 */
function handleConfirmPage() {
  uni.navigateTo({
    url: `/pages-mes/wm/transfer/form/index?id=${currentId.value}&mode=confirm`,
  })
}

/** 执行上架页 */
function handleStockPage() {
  uni.navigateTo({
    url: `/pages-mes/wm/transfer/form/index?id=${currentId.value}&mode=stock`,
  })
}

/** 执行转移页 */
function handleFinishPage() {
  uni.navigateTo({
    url: `/pages-mes/wm/transfer/form/index?id=${currentId.value}&mode=finish`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${formData.value.code || formData.value.name || formData.value.id}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteTransfer(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:transfer:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交转移单 */
async function handleSubmitTransfer() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该转移单？提交前请确认已维护调拨物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitTransfer(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:transfer:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 取消转移单 */
async function handleCancelTransfer() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该转移单？取消后不可恢复。',
    })
  } catch {
    return
  }
  canceling.value = true
  try {
    await cancelTransfer(currentId.value)
    toast.success('取消成功')
    uni.$emit('mes:wm:transfer:reload')
    await getDetail()
  } finally {
    canceling.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
