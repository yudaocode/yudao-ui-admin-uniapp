<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="库存调拨详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="调拨单号" :value="formData?.no || '-'" />
        <wd-cell title="调拨时间" :value="formatDateTime(formData?.moveTime) || '-'" />
        <wd-cell title="创建人" :value="formData?.creatorName || '-'" />
        <wd-cell title="审核状态">
          <dict-tag :type="DICT_TYPE.ERP_AUDIT_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="合计数量" :value="formatCount(formData?.totalCount)" />
        <wd-cell title="合计金额" :value="formatMoney(formData?.totalPrice)" />
        <wd-cell title="附件" :value="formData?.fileUrl ? '查看附件' : '-'" :is-link="!!formData?.fileUrl" @click="handleOpenFile" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 调拨明细 -->
      <view v-if="items.length > 0" class="mt-24rpx">
        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          调拨产品清单
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
              <text class="mr-8rpx shrink-0 text-[#999]">调出仓库：</text>
              <text class="min-w-0 flex-1">{{ item.fromWarehouseName || '-' }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">调入仓库：</text>
              <text class="min-w-0 flex-1">{{ item.toWarehouseName || '-' }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">产品：</text>
              <text class="min-w-0 flex-1">{{ item.productName || '-' }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">条码：</text>
              <text class="min-w-0 flex-1">{{ item.productBarCode || '-' }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
              <text class="min-w-0 flex-1">{{ item.productUnitName || '-' }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">数量：</text>
              <text class="min-w-0 flex-1">{{ formatCount(item.count) }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">产品单价：</text>
              <text class="min-w-0 flex-1">{{ formatMoney(item.productPrice) }}</text>
            </view>
            <view class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">合计金额：</text>
              <text class="min-w-0 flex-1">{{ formatMoney(item.totalPrice) }}</text>
            </view>
            <view v-if="item.remark" class="mb-10rpx flex text-26rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
              <text class="min-w-0 flex-1">{{ item.remark }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="canUpdate || canUpdateStatus || hasAccessByCodes(['erp:stock-move:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canUpdate"
          class="flex-1" type="warning" :disabled="statusLoading || deleting" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canUpdateStatus"
          class="flex-1" type="primary" :loading="statusLoading" :disabled="deleting" @click="handleUpdateStatus(nextStatus)"
        >
          {{ nextStatus === ErpAuditStatusEnum.AUDITED ? '审批' : '反审批' }}
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['erp:stock-move:delete'])"
          class="flex-1" type="danger" :loading="deleting" :disabled="statusLoading" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { StockMove } from '@/api/erp/stock/move'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteStockMove, getStockMove, updateStockMoveStatus } from '@/api/erp/stock/move'
import { useAccess } from '@/hooks/useAccess'
import { openAttachment } from '@/utils/download'
import { buildErpDocumentDetail } from '@/pages-erp/utils/erp'
import { formatCount } from '@/pages-erp/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, ErpAuditStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'

const props = defineProps<{ id?: number }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<StockMove>() // 详情数据
const deleting = ref(false) // 删除状态
const statusLoading = ref(false) // 审批状态
const items = computed(() => Array.isArray(formData.value?.items) ? formData.value.items : [])
const canUpdate = computed(() => formData.value?.status !== ErpAuditStatusEnum.AUDITED && hasAccessByCodes(['erp:stock-move:update']))
const canUpdateStatus = computed(() => hasAccessByCodes(['erp:stock-move:update-status']) && (formData.value?.status === ErpAuditStatusEnum.UNAUDITED || formData.value?.status === ErpAuditStatusEnum.AUDITED))
const nextStatus = computed(() => formData.value?.status === ErpAuditStatusEnum.UNAUDITED ? ErpAuditStatusEnum.AUDITED : ErpAuditStatusEnum.UNAUDITED)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/stock/move/index')
}

/** 加载库存调拨详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await buildErpDocumentDetail(await getStockMove(props.id), 'stock-move') as StockMove
  } finally {
    toast.close()
  }
}

/** 编辑库存调拨 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/stock/move/form/index?id=${props.id}` })
}

/** 打开附件 */
function handleOpenFile() {
  if (formData.value?.fileUrl) {
    openAttachment(formData.value.fileUrl)
  }
}

/** 删除库存调拨 */
async function handleDelete() {
  if (!props.id || deleting.value || statusLoading.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该库存调拨吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteStockMove([props.id])
    toast.success('删除成功')
    uni.$emit('erp:stock-move:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 审批或反审批 */
async function handleUpdateStatus(status: number) {
  if (!props.id || statusLoading.value || deleting.value) {
    return
  }
  const actionName = status === ErpAuditStatusEnum.AUDITED ? '审批' : '反审批'
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${actionName}该库存调拨吗？` })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updateStockMoveStatus(props.id, status)
    toast.success(`${actionName}成功`)
    uni.$emit('erp:stock-move:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('erp:stock-move:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:stock-move:reload', getDetail)
})
</script>
