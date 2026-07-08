<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 销售退货详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view v-if="formData" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="退货单编号" :value="formData.code || '-'" />
        <wd-cell title="退货单名称" :value="formData.name || '-'" />
        <wd-cell title="销售订单号" :value="formData.salesOrderCode || '-'" />
        <wd-cell title="客户编码" :value="formData.clientCode || '-'" />
        <wd-cell title="客户名称" :value="formData.clientName || '-'" />
        <wd-cell title="客户简称" :value="formData.clientNickname || '-'" />
        <wd-cell title="退货日期" :value="formatDate(formData.returnDate) || '-'" />
        <wd-cell title="退货原因" :value="formData.returnReason || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_RETURN_SALES_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>

      <ReturnSalesLineList :return-id="currentId" readonly />

      <view v-if="canQuality" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#ad6800] leading-40rpx">
        当前单据处于待检验状态，请前往【质量管理 - 退货检验（RQC）】中进行退货检验操作。
      </view>

      <view v-if="hasFooter" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-20rpx text-28rpx text-[#333] font-semibold">
          销售退货操作
        </view>
        <view class="flex flex-wrap gap-16rpx text-28rpx">
          <wd-button v-if="canUpdatePrepare" class="min-w-180rpx flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="canSubmitPrepare" class="min-w-180rpx flex-1" type="warning" :loading="submitting" @click="handleSubmitReturnSales">
            提交
          </wd-button>
          <wd-button v-if="canQuality" class="min-w-180rpx flex-1" type="warning" @click="handleQuality">
            执行质检
          </wd-button>
          <wd-button v-if="canFinish" class="min-w-180rpx flex-1" type="success" @click="handleFinish">
            执行退货
          </wd-button>
          <wd-button v-if="canStock" class="min-w-180rpx flex-1" type="success" @click="handleStock">
            执行上架
          </wd-button>
          <wd-button v-if="canDeletePrepare" class="min-w-180rpx flex-1" type="danger" :loading="deleting" @click="handleDelete">
            删除
          </wd-button>
          <wd-button v-if="canCancelStatus" class="min-w-180rpx flex-1" type="danger" @click="handleCancel">
            取消
          </wd-button>
        </view>
      </view>
      <view class="h-180rpx" />
    </scroll-view>
    <view v-else class="flex-1 bg-white p-24rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmReturnSales } from '@/api/mes/wm/returnsales'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteReturnSales, getReturnSales, submitReturnSales } from '@/api/mes/wm/returnsales'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmReturnSalesStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import ReturnSalesLineList from '../components/return-sales-line-list.vue'

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
const formData = ref<WmReturnSales>() // 详情数据
const currentId = computed(() => props.id ? Number(props.id) : undefined) // 当前详情编号
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-return-sales:update'])
  && formData.value?.status === MesWmReturnSalesStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-return-sales:delete'])
  && formData.value?.status === MesWmReturnSalesStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-return-sales:submit'])
  && formData.value?.status === MesWmReturnSalesStatusEnum.PREPARE
))
const canQuality = computed(() => formData.value?.status === MesWmReturnSalesStatusEnum.CONFIRMED)
const canFinish = computed(() => (
  hasAccessByCodes(['mes:wm-return-sales:finish'])
  && formData.value?.status === MesWmReturnSalesStatusEnum.APPROVING
))
const canStock = computed(() => (
  hasAccessByCodes(['mes:wm-return-sales:stock'])
  && formData.value?.status === MesWmReturnSalesStatusEnum.APPROVED
))
const canCancelStatus = computed(() => (
  hasAccessByCodes(['mes:wm-return-sales:cancel'])
  && (
    formData.value?.status === MesWmReturnSalesStatusEnum.CONFIRMED
    || formData.value?.status === MesWmReturnSalesStatusEnum.APPROVING
    || formData.value?.status === MesWmReturnSalesStatusEnum.APPROVED
  )
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canQuality.value
  || canFinish.value
  || canStock.value
  || canCancelStatus.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/returnsales/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getReturnSales(currentId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/wm/returnsales/form/index?id=${currentId.value}` })
}

/** 执行质检提示 */
function handleQuality() {
  dialog.alert({
    title: '执行质检',
    msg: '请前往【质量管理 - 退货检验（RQC）】中进行退货检验操作。',
  })
}

/** 执行退货 */
function handleFinish() {
  uni.navigateTo({ url: `/pages-mes/wm/returnsales/form/index?id=${currentId.value}&mode=finish` })
}

/** 执行上架 */
function handleStock() {
  uni.navigateTo({ url: `/pages-mes/wm/returnsales/form/index?id=${currentId.value}&mode=stock` })
}

/** 取消 */
function handleCancel() {
  uni.navigateTo({ url: `/pages-mes/wm/returnsales/form/index?id=${currentId.value}&mode=cancel` })
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
    await deleteReturnSales(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:returnsales:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交销售退货单 */
async function handleSubmitReturnSales() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该销售退货单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitReturnSales(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:returnsales:reload')
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
