<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 销售出库详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view v-if="formData" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="出库单编号" :value="formData?.code || '-'" />
        <wd-cell title="出库单名称" :value="formData?.name || '-'" />
        <wd-cell title="发货通知单号" :value="formData?.noticeCode || '-'" />
        <wd-cell title="销售订单编号" :value="formData?.salesOrderCode || '-'" />
        <wd-cell title="客户编码" :value="formData?.clientCode || '-'" />
        <wd-cell title="客户名称" :value="formData?.clientName || '-'" />
        <wd-cell title="出库日期" :value="formatDate(formData?.salesDate) || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="收货人" :value="formData?.contactName || '-'" />
        <wd-cell title="联系方式" :value="formData?.contactTelephone || '-'" />
        <wd-cell title="收货地址" :value="formData?.contactAddress || '-'" />
        <wd-cell title="承运商" :value="formData?.carrier || '-'" />
        <wd-cell title="运输单号" :value="formData?.shippingNumber || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <ProductSalesLineList :sales-id="currentId" :notice-id="formData.noticeId" readonly />
      <view v-if="hasFooter" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-20rpx text-28rpx text-[#333] font-semibold">
          销售出库操作
        </view>
        <view class="flex flex-wrap gap-16rpx text-28rpx">
          <wd-button v-if="canUpdatePrepare" class="min-w-180rpx flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="canSubmitPrepare" class="min-w-180rpx flex-1" type="warning" :loading="submitting" @click="handleSubmitProductSales">
            提交
          </wd-button>
          <wd-button v-if="canStock" class="min-w-180rpx flex-1" type="success" @click="handleStock">
            拣货
          </wd-button>
          <wd-button v-if="canShipping" class="min-w-180rpx flex-1" type="warning" @click="handleShipping">
            填写运单
          </wd-button>
          <wd-button v-if="canFinish" class="min-w-180rpx flex-1" type="success" @click="handleFinish">
            执行出库
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
import type { WmProductSales } from '@/api/mes/wm/productsales'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteProductSales, getProductSales, submitProductSales } from '@/api/mes/wm/productsales'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmProductSalesStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import ProductSalesLineList from '../components/product-sales-line-list.vue'

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
const formData = ref<WmProductSales>() // 详情数据
const currentId = computed(() => props.id ? Number(props.id) : undefined) // 当前详情编号
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:update'])
  && formData.value?.status === MesWmProductSalesStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:delete'])
  && formData.value?.status === MesWmProductSalesStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:update'])
  && formData.value?.status === MesWmProductSalesStatusEnum.PREPARE
))
const canStock = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:stock'])
  && formData.value?.status === MesWmProductSalesStatusEnum.APPROVING
))
const canShipping = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:shipping'])
  && formData.value?.status === MesWmProductSalesStatusEnum.SHIPPING
))
const canFinish = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:finish'])
  && formData.value?.status === MesWmProductSalesStatusEnum.APPROVED
))
const canCancelStatus = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:cancel'])
  && (
    formData.value?.status === MesWmProductSalesStatusEnum.CONFIRMED
    || formData.value?.status === MesWmProductSalesStatusEnum.APPROVING
    || formData.value?.status === MesWmProductSalesStatusEnum.SHIPPING
    || formData.value?.status === MesWmProductSalesStatusEnum.APPROVED
  )
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canStock.value
  || canShipping.value
  || canFinish.value
  || canCancelStatus.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/productsales/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProductSales(currentId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?id=${currentId.value}` })
}

/** 拣货 */
function handleStock() {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?id=${currentId.value}&mode=stock` })
}

/** 填写运单 */
function handleShipping() {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?id=${currentId.value}&mode=shipping` })
}

/** 执行出库 */
function handleFinish() {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?id=${currentId.value}&mode=finish` })
}

/** 取消 */
function handleCancel() {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?id=${currentId.value}&mode=cancel` })
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
    await deleteProductSales(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:productsales:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交销售出库单 */
async function handleSubmitProductSales() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该销售出库单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitProductSales(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:productsales:reload')
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
