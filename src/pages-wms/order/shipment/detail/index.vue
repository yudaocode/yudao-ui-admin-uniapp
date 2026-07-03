<template>
  <view class="yd-page-container pb-120rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="出库单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border title="单据信息">
        <wd-cell title="出库单号" :value="formData?.no || '-'" />
        <wd-cell title="出库类型">
          <dict-tag :type="DICT_TYPE.WMS_SHIPMENT_ORDER_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="单据状态">
          <dict-tag :type="DICT_TYPE.WMS_ORDER_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="仓库" :value="formData?.warehouseName || '-'" />
        <wd-cell title="单据日期" :value="formatDate(formData?.orderTime) || '-'" />
        <wd-cell title="客户" :value="formData?.merchantName || '-'" />
        <wd-cell title="业务单号" :value="formData?.bizOrderNo || '-'" />
        <wd-cell title="总数量" :value="formatQuantity(formData?.totalQuantity) || '-'" />
        <wd-cell title="总金额" :value="formatPrice(formData?.totalPrice) || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="创建人" :value="formData?.creatorName || formData?.creator || '-'" />
        <wd-cell title="更新时间" :value="formatDateTime(formData?.updateTime) || '-'" />
        <wd-cell title="更新人" :value="formData?.updaterName || formData?.updater || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 商品明细 -->
      <view class="mx-24rpx mb-16rpx mt-24rpx text-30rpx text-[#333] font-semibold">
        商品明细
      </view>
      <view
        v-for="detail in detailRows"
        :key="detail.id || detail.skuId"
        class="mx-24rpx mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <view class="border-b border-b-[#f5f5f5] px-24rpx py-20rpx">
          <view class="text-28rpx text-[#333] font-semibold">
            {{ detail.itemName || '-' }}
          </view>
          <view class="mt-4rpx text-24rpx text-[#999]">
            {{ detail.skuName || '-' }}
          </view>
        </view>
        <wd-cell-group border>
          <wd-cell title="数量" :value="formatQuantity(detail.quantity) || '-'" />
          <wd-cell title="单位" :value="detail.unit || '-'" />
          <wd-cell title="单价" :value="formatPrice(detail.price) || '-'" />
          <wd-cell title="总价" :value="formatPrice(detail.totalPrice) || '-'" />
        </wd-cell-group>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canUpdate && hasAccessByCodes(['wms:shipment-order:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canUpdate && hasAccessByCodes(['wms:shipment-order:complete'])"
          class="flex-1" type="primary" :loading="actionLoading" :disabled="deleting" @click="handleComplete"
        >
          完成
        </wd-button>
        <wd-button
          v-if="moreActions.length > 0"
          class="flex-1" type="info" :disabled="actionLoading || deleting" @click="moreActionVisible = true"
        >
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />
  </view>
</template>

<script lang="ts" setup>
import type { ShipmentOrder } from '@/api/wms/order/shipment'
import type { ShipmentOrderDetail } from '@/api/wms/order/shipment/detail'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  cancelShipmentOrder,
  completeShipmentOrder,
  deleteShipmentOrder,
  getShipmentOrder,
} from '@/api/wms/order/shipment'
import { useAccess } from '@/hooks/useAccess'
import { formatPrice, formatQuantity, multiplyPrice } from '@/pages-wms/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, WmsOrderDeleteStatusList, WmsOrderUpdateStatusList } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

interface DetailRow extends ShipmentOrderDetail {
  totalPrice?: number
}

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ShipmentOrder>() // 详情数据
const deleting = ref(false) // 删除状态
const actionLoading = ref(false) // 单据动作状态
const moreActionVisible = ref(false) // 更多操作菜单

const detailRows = computed<DetailRow[]>(() => {
  return (formData.value?.details || []).map(detail => ({
    ...detail,
    totalPrice: detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price),
  }))
})
const canUpdate = computed(() => formData.value?.status !== undefined && WmsOrderUpdateStatusList.includes(formData.value.status))
const canDelete = computed(() => formData.value?.status !== undefined && WmsOrderDeleteStatusList.includes(formData.value.status))
const moreActions = computed(() => {
  const actions = []
  if (canDelete.value && hasAccessByCodes(['wms:shipment-order:delete'])) {
    actions.push({ name: '删除', value: 'delete' })
  }
  if (canUpdate.value && hasAccessByCodes(['wms:shipment-order:cancel'])) {
    actions.push({ name: '作废', value: 'cancel' })
  }
  return actions
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/order/shipment/index')
}

/** 加载出库单详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getShipmentOrder(Number(props.id))
}

/** 编辑出库单 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-wms/order/shipment/form/index?id=${props.id}`,
  })
}

/** 删除出库单 */
async function handleDelete() {
  if (!props.id || deleting.value || actionLoading.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该出库单吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteShipmentOrder(Number(props.id))
    toast.success('删除成功')
    uni.$emit('wms:shipment-order:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 更多操作 */
function handleMoreAction({ item }: { item: { value: string } }) {
  if (deleting.value || actionLoading.value) {
    return
  }
  if (item.value === 'delete') {
    handleDelete()
  } else if (item.value === 'cancel') {
    handleCancel()
  }
}

/** 完成出库 */
async function handleComplete() {
  if (!props.id || actionLoading.value || deleting.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认完成出库？完成后将更新库存。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await completeShipmentOrder(Number(props.id))
    toast.success('出库成功')
    uni.$emit('wms:shipment-order:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 作废出库单 */
async function handleCancel() {
  if (!props.id || actionLoading.value || deleting.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认作废该出库单？作废后不可恢复。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await cancelShipmentOrder(Number(props.id))
    toast.success('作废成功')
    uni.$emit('wms:shipment-order:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
