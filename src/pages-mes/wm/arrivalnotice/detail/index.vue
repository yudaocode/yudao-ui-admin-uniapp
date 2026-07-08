<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 到货通知详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="通知单编号" :value="formData?.code || '-'" />
        <wd-cell title="通知单名称" :value="formData?.name || '-'" />
        <wd-cell title="采购订单编号" :value="formData?.purchaseOrderCode || '-'" />
        <wd-cell title="供应商编码" :value="formData?.vendorCode || '-'" />
        <wd-cell title="供应商名称" :value="formData?.vendorName || '-'" />
        <wd-cell title="到货日期" :value="formatDate(formData?.arrivalDate) || '-'" />
        <wd-cell title="联系人" :value="formData?.contactName || '-'" />
        <wd-cell title="联系方式" :value="formData?.contactTelephone || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <ArrivalNoticeLineList v-if="formData?.id" :notice-id="formData.id" readonly />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canUpdatePrepare"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canSubmitPrepare"
          class="flex-1"
          type="warning"
          :loading="submitting" @click="handleSubmitNotice"
        >
          提交
        </wd-button>
        <wd-button
          v-if="canPendingQc"
          class="flex-1"
          type="warning"
          @click="handlePendingQc"
        >
          执行质检
        </wd-button>
        <wd-button
          v-if="canPendingReceipt"
          class="flex-1"
          type="success"
          @click="handlePendingReceipt"
        >
          执行入库
        </wd-button>
        <wd-button
          v-if="canDeletePrepare"
          class="flex-1"
          type="danger"
          :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmArrivalNotice } from '@/api/mes/wm/arrivalnotice'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteArrivalNotice, getArrivalNotice, submitArrivalNotice } from '@/api/mes/wm/arrivalnotice'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmArrivalNoticeStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import ArrivalNoticeLineList from '../components/arrival-notice-line-list.vue'

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
const formData = ref<WmArrivalNotice>() // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-arrival-notice:update'])
  && formData.value?.status === MesWmArrivalNoticeStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-arrival-notice:delete'])
  && formData.value?.status === MesWmArrivalNoticeStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-arrival-notice:update'])
  && formData.value?.status === MesWmArrivalNoticeStatusEnum.PREPARE
))
const canPendingQc = computed(() => formData.value?.status === MesWmArrivalNoticeStatusEnum.PENDING_QC)
const canPendingReceipt = computed(() => formData.value?.status === MesWmArrivalNoticeStatusEnum.PENDING_RECEIPT)
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canPendingQc.value
  || canPendingReceipt.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/arrivalnotice/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getArrivalNotice(Number(props.id))
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
    url: `/pages-mes/wm/arrivalnotice/form/index?id=${props.id}`,
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
    await deleteArrivalNotice(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:wm:arrivalnotice:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交到货通知单 */
async function handleSubmitNotice() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该到货通知单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitArrivalNotice(Number(props.id))
    toast.success('提交成功')
    uni.$emit('mes:wm:arrivalnotice:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 执行质检 */
function handlePendingQc() {
  if (!formData.value?.code) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/qc/pendinginspect/index?sourceDocCode=${encodeURIComponent(formData.value.code)}&qcType=1`,
  })
}

/** 执行入库 */
function handlePendingReceipt() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/wm/itemreceipt/form/index?noticeId=${props.id}` })
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
