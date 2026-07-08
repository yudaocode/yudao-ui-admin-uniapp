<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 发货通知详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="通知单编号" :value="formData?.code || '-'" />
        <wd-cell title="通知单名称" :value="formData?.name || '-'" />
        <wd-cell title="销售订单编号" :value="formData?.salesOrderCode || '-'" />
        <wd-cell title="客户编码" :value="formData?.clientCode || '-'" />
        <wd-cell title="客户名称" :value="formData?.clientName || '-'" />
        <wd-cell title="发货日期" :value="formatDate(formData?.salesDate) || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_SALES_NOTICE_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="收货人" :value="formData?.recipientName || '-'" />
        <wd-cell title="联系方式" :value="formData?.recipientTelephone || '-'" />
        <wd-cell title="收货地址" :value="formData?.recipientAddress || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <SalesNoticeLineList v-if="currentId" :notice-id="currentId" readonly />
      <view v-if="hasFooter" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-20rpx text-28rpx text-[#333] font-semibold">
          发货通知操作
        </view>
        <view class="flex flex-wrap gap-16rpx text-28rpx">
          <wd-button v-if="canUpdatePrepare" class="min-w-180rpx flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="canSubmitPrepare" class="min-w-180rpx flex-1" type="warning" :loading="submitting" @click="handleSubmitSalesNotice">
            提交
          </wd-button>
          <wd-button v-if="canFinishApproved" class="min-w-180rpx flex-1" type="success" @click="handleFinish">
            执行出库
          </wd-button>
          <wd-button v-if="canDeletePrepare" class="min-w-180rpx flex-1" type="danger" :loading="deleting" @click="handleDelete">
            删除
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
        <wd-button v-if="canSubmitPrepare" class="flex-1" type="warning" :loading="submitting" @click="handleSubmitSalesNotice">
          提交
        </wd-button>
        <wd-button v-if="canFinishApproved" class="flex-1" type="success" @click="handleFinish">
          执行出库
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmSalesNotice } from '@/api/mes/wm/salesnotice'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteSalesNotice, getSalesNotice, submitSalesNotice } from '@/api/mes/wm/salesnotice'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmSalesNoticeStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import SalesNoticeLineList from '../components/sales-notice-line-list.vue'

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
const formData = ref<WmSalesNotice>() // 详情数据
const currentId = computed(() => props.id ? Number(props.id) : undefined) // 当前详情编号
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-sales-notice:update'])
  && formData.value?.status === MesWmSalesNoticeStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-sales-notice:delete'])
  && formData.value?.status === MesWmSalesNoticeStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-sales-notice:update'])
  && formData.value?.status === MesWmSalesNoticeStatusEnum.PREPARE
))
const canFinishApproved = computed(() => (
  hasAccessByCodes(['mes:wm-sales-notice:update'])
  && formData.value?.status === MesWmSalesNoticeStatusEnum.APPROVED
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canFinishApproved.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/salesnotice/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSalesNotice(currentId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-mes/wm/salesnotice/form/index?id=${currentId.value}`,
  })
}

/** 执行出库 */
function handleFinish() {
  uni.navigateTo({
    url: `/pages-mes/wm/salesnotice/form/index?id=${currentId.value}&mode=finish`,
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
    await deleteSalesNotice(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:salesnotice:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交发货通知单 */
async function handleSubmitSalesNotice() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该发货通知单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitSalesNotice(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:salesnotice:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
