<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 采购退货详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="退货单编号" :value="formData?.code || '-'" />
        <wd-cell title="退货单名称" :value="formData?.name || '-'" />
        <wd-cell title="采购订单号" :value="formData?.purchaseOrderCode || '-'" />
        <wd-cell title="供应商编码" :value="formData?.vendorCode || '-'" />
        <wd-cell title="供应商名称" :value="formData?.vendorName || '-'" />
        <wd-cell title="供应商简称" :value="formData?.vendorNickname || '-'" />
        <wd-cell title="退货日期" :value="formatDate(formData?.returnDate) || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_RETURN_VENDOR_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="退货原因" :value="formData?.returnReason || '-'" />
        <wd-cell title="运单号" :value="formData?.transportCode || '-'" />
        <wd-cell title="联系电话" :value="formData?.transportTelephone || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <ReturnVendorLineList v-if="currentId" :return-id="currentId" :vendor-id="formData?.vendorId" readonly />
      <view v-if="hasFooter" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-20rpx text-28rpx text-[#333] font-semibold">
          退货操作
        </view>
        <view class="flex flex-wrap gap-16rpx text-28rpx">
          <wd-button v-if="canUpdatePrepare" class="min-w-180rpx flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="canSubmitPrepare" class="min-w-180rpx flex-1" type="warning" :loading="submitting" @click="handleSubmitReturnVendor">
            提交
          </wd-button>
          <wd-button v-if="canStockApproving" class="min-w-180rpx flex-1" type="success" @click="handleStock">
            执行拣货
          </wd-button>
          <wd-button v-if="canFinishApproved" class="min-w-180rpx flex-1" type="success" @click="handleFinish">
            完成退货
          </wd-button>
          <wd-button v-if="canDeletePrepare" class="min-w-180rpx flex-1" type="danger" :loading="deleting" @click="handleDelete">
            删除
          </wd-button>
          <wd-button v-if="canCancelActive" class="min-w-180rpx flex-1" type="danger" :loading="canceling" @click="handleCancelReturnVendor">
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
        <wd-button v-if="canSubmitPrepare" class="flex-1" type="warning" :loading="submitting" @click="handleSubmitReturnVendor">
          提交
        </wd-button>
        <wd-button v-if="canStockApproving" class="flex-1" type="success" @click="handleStock">
          执行拣货
        </wd-button>
        <wd-button v-if="canFinishApproved" class="flex-1" type="success" @click="handleFinish">
          完成退货
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmReturnVendor } from '@/api/mes/wm/returnvendor'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { cancelReturnVendor, deleteReturnVendor, getReturnVendor, submitReturnVendor } from '@/api/mes/wm/returnvendor'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmReturnVendorStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import ReturnVendorLineList from '../components/return-vendor-line-list.vue'

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
const formData = ref<WmReturnVendor>() // 详情数据
const currentId = computed(() => props.id ? Number(props.id) : undefined) // 当前详情编号
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canceling = ref(false) // 取消状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-return-vendor:update'])
  && formData.value?.status === MesWmReturnVendorStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-return-vendor:delete'])
  && formData.value?.status === MesWmReturnVendorStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-return-vendor:update'])
  && formData.value?.status === MesWmReturnVendorStatusEnum.PREPARE
))
const canStockApproving = computed(() => (
  hasAccessByCodes(['mes:wm-return-vendor:update'])
  && formData.value?.status === MesWmReturnVendorStatusEnum.APPROVING
))
const canFinishApproved = computed(() => (
  hasAccessByCodes(['mes:wm-return-vendor:finish'])
  && formData.value?.status === MesWmReturnVendorStatusEnum.APPROVED
))
const canCancelActive = computed(() => (
  hasAccessByCodes(['mes:wm-return-vendor:update'])
  && (
    formData.value?.status === MesWmReturnVendorStatusEnum.APPROVING
    || formData.value?.status === MesWmReturnVendorStatusEnum.APPROVED
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
  navigateBackPlus('/pages-mes/wm/returnvendor/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getReturnVendor(currentId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-mes/wm/returnvendor/form/index?id=${currentId.value}`,
  })
}

/** 执行拣货 */
function handleStock() {
  uni.navigateTo({
    url: `/pages-mes/wm/returnvendor/form/index?id=${currentId.value}&mode=stock`,
  })
}

/** 完成退货 */
function handleFinish() {
  uni.navigateTo({
    url: `/pages-mes/wm/returnvendor/form/index?id=${currentId.value}&mode=finish`,
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
    await deleteReturnVendor(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:returnvendor:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交供应商退货单 */
async function handleSubmitReturnVendor() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该退货单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitReturnVendor(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:returnvendor:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 取消供应商退货单 */
async function handleCancelReturnVendor() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该供应商退货单？取消后不可恢复。',
    })
  } catch {
    return
  }
  canceling.value = true
  try {
    await cancelReturnVendor(currentId.value)
    toast.success('取消成功')
    uni.$emit('mes:wm:returnvendor:reload')
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
