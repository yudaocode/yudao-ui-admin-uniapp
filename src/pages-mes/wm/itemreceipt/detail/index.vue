<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 采购入库详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="入库单编号" :value="formData?.code || '-'" />
        <wd-cell title="入库单名称" :value="formData?.name || '-'" />
        <wd-cell title="来料检验单" :value="formData?.iqcCode || '-'" />
        <wd-cell title="到货通知单" :value="formData?.noticeCode || '-'" />
        <wd-cell title="采购订单号" :value="formData?.purchaseOrderCode || '-'" />
        <wd-cell title="供应商名称" :value="formData?.vendorName || '-'" />
        <wd-cell title="入库日期" :value="formatDate(formData?.receiptDate) || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_ITEM_RECEIPT_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <ItemReceiptLineList v-if="formData?.id" :receipt-id="formData.id" :notice-id="formData.noticeId" readonly />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canUpdatePrepare" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canSubmitPrepare" class="flex-1" type="warning" :loading="submitting" @click="handleSubmitReceipt">
          提交
        </wd-button>
        <wd-button v-if="canStockApproving" class="flex-1" type="success" @click="handleStock">
          执行上架
        </wd-button>
        <wd-button v-if="canFinishApproved" class="flex-1" type="success" @click="handleFinish">
          执行入库
        </wd-button>
        <wd-button v-if="canDeletePrepare" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
        <wd-button v-if="canCancelActive" class="flex-1" type="danger" :loading="canceling" @click="handleCancelReceipt">
          取消
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmItemReceipt } from '@/api/mes/wm/itemreceipt'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { cancelItemReceipt, deleteItemReceipt, getItemReceipt, submitItemReceipt } from '@/api/mes/wm/itemreceipt'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmItemReceiptStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import ItemReceiptLineList from '../components/item-receipt-line-list.vue'

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
const formData = ref<WmItemReceipt>() // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canceling = ref(false) // 取消状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-item-receipt:update'])
  && formData.value?.status === MesWmItemReceiptStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-item-receipt:delete'])
  && formData.value?.status === MesWmItemReceiptStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-item-receipt:update'])
  && formData.value?.status === MesWmItemReceiptStatusEnum.PREPARE
))
const canStockApproving = computed(() => (
  hasAccessByCodes(['mes:wm-item-receipt:update'])
  && formData.value?.status === MesWmItemReceiptStatusEnum.APPROVING
))
const canFinishApproved = computed(() => (
  hasAccessByCodes(['mes:wm-item-receipt:finish'])
  && formData.value?.status === MesWmItemReceiptStatusEnum.APPROVED
))
const canCancelActive = computed(() => (
  hasAccessByCodes(['mes:wm-item-receipt:update'])
  && (
    formData.value?.status === MesWmItemReceiptStatusEnum.APPROVING
    || formData.value?.status === MesWmItemReceiptStatusEnum.APPROVED
  )
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canStockApproving.value
  || canFinishApproved.value
  || canCancelActive.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/itemreceipt/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getItemReceipt(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/wm/itemreceipt/form/index?id=${props.id}`,
  })
}

/** 执行上架 */
function handleStock() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/wm/itemreceipt/form/index?id=${props.id}&mode=stock`,
  })
}

/** 执行入库 */
function handleFinish() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/wm/itemreceipt/form/index?id=${props.id}&mode=finish`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id || !formData.value) {
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
    await deleteItemReceipt(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:wm:itemreceipt:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交采购入库单 */
async function handleSubmitReceipt() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该采购入库单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitItemReceipt(Number(props.id))
    toast.success('提交成功')
    uni.$emit('mes:wm:itemreceipt:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 取消采购入库单 */
async function handleCancelReceipt() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该采购入库单？取消后不可恢复。',
    })
  } catch {
    return
  }
  canceling.value = true
  try {
    await cancelItemReceipt(Number(props.id))
    toast.success('取消成功')
    uni.$emit('mes:wm:itemreceipt:reload')
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
