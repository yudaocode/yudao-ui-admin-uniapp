<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 其他入库详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="入库单编号" :value="formData?.code || '-'" />
        <wd-cell title="入库单名称" :value="formData?.name || '-'" />
        <wd-cell title="杂项类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_WM_MISC_RECEIPT_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="来源单据类型" :value="formData?.sourceDocType || '-'" />
        <wd-cell title="来源单据编号" :value="formData?.sourceDocCode || '-'" />
        <wd-cell title="入库日期" :value="formatDateTime(formData?.receiptDate) || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_MISC_RECEIPT_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <MiscReceiptLineList v-if="props.id" :receipt-id="Number(props.id)" readonly />
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
        <wd-button v-if="canFinishApproved" class="flex-1" type="success" @click="handleFinish">
          执行入库
        </wd-button>
        <wd-button v-if="canDeletePrepare" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
        <wd-button v-if="canCancelApproved" class="flex-1" type="danger" :loading="canceling" @click="handleCancelReceipt">
          取消
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmMiscReceipt } from '@/api/mes/wm/miscreceipt'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { cancelMiscReceipt, deleteMiscReceipt, getMiscReceipt, submitMiscReceipt } from '@/api/mes/wm/miscreceipt'
import { useAccess } from '@/hooks/useAccess'
import MiscReceiptLineList from '@/pages-mes/wm/miscreceipt/components/misc-receipt-line-list.vue'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmMiscReceiptStatusEnum } from '@/utils/constants'
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
const formData = ref<WmMiscReceipt>() // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canceling = ref(false) // 取消状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm:misc-receipt:update'])
  && formData.value?.status === MesWmMiscReceiptStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm:misc-receipt:delete'])
  && formData.value?.status === MesWmMiscReceiptStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm:misc-receipt:update'])
  && formData.value?.status === MesWmMiscReceiptStatusEnum.PREPARE
))
const canFinishApproved = computed(() => (
  hasAccessByCodes(['mes:wm:misc-receipt:finish'])
  && formData.value?.status === MesWmMiscReceiptStatusEnum.APPROVED
))
const canCancelApproved = computed(() => (
  hasAccessByCodes(['mes:wm:misc-receipt:update'])
  && formData.value?.status === MesWmMiscReceiptStatusEnum.APPROVED
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canFinishApproved.value
  || canCancelApproved.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/miscreceipt/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMiscReceipt(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-mes/wm/miscreceipt/form/index?id=${props.id}`,
  })
}

/** 执行入库 */
function handleFinish() {
  uni.navigateTo({
    url: `/pages-mes/wm/miscreceipt/form/index?id=${props.id}&mode=finish`,
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
    await deleteMiscReceipt(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:wm:miscreceipt:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交杂项入库单 */
async function handleSubmitReceipt() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该杂项入库单？提交前请确认已维护入库物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitMiscReceipt(Number(props.id))
    toast.success('提交成功')
    uni.$emit('mes:wm:miscreceipt:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 取消杂项入库单 */
async function handleCancelReceipt() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该杂项入库单？取消后不可恢复。',
    })
  } catch {
    return
  }
  canceling.value = true
  try {
    await cancelMiscReceipt(Number(props.id))
    toast.success('取消成功')
    uni.$emit('mes:wm:miscreceipt:reload')
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
