<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="生产工单详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="工单编码" :value="formData?.code || '-'" />
        <wd-cell title="工单名称" :value="formData?.name || '-'" />
        <wd-cell title="工单状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="工单类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="工单来源">
          <dict-tag v-if="formData?.orderSourceType != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE" :value="formData.orderSourceType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="来源单据" :value="formData?.orderSourceCode || '-'" />
        <wd-cell title="父工单" :value="formData?.parentCode || '-'" />
        <wd-cell title="产品编码" :value="formData?.productCode || '-'" />
        <wd-cell title="产品名称" :value="formData?.productName || '-'" />
        <wd-cell title="规格型号" :value="formData?.productSpecification || '-'" />
        <wd-cell title="单位" :value="formData?.unitMeasureName || '-'" />
        <wd-cell title="工单数量" :value="formData?.quantity ?? '-'" />
        <wd-cell title="已生产数量" :value="formData?.quantityProduced ?? 0" />
        <wd-cell title="调整数量" :value="formData?.quantityChanged ?? 0" />
        <wd-cell title="已排产数量" :value="formData?.quantityScheduled ?? 0" />
        <wd-cell title="客户" :value="clientText" />
        <wd-cell title="供应商" :value="vendorText" />
        <wd-cell title="批次号" :value="formData?.batchCode || '-'" />
        <wd-cell title="需求日期" :value="formatDate(formData?.requestDate) || '-'" />
        <wd-cell title="完成时间" :value="formatDateTime(formData?.finishDate) || '-'" />
        <wd-cell title="取消时间" :value="formatDateTime(formData?.cancelDate) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <WorkOrderBomList
        :work-order-id="workOrderId"
        :work-order="formData"
        readonly
        @generate-work-order="handleGenerateWorkOrder"
      />
      <WorkOrderItemList :work-order-id="workOrderId" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="formData" class="flex-1" variant="plain" @click="handleBarcode">
          条码
        </wd-button>
        <wd-button v-if="canEdit" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
        <wd-button v-if="canAddChild" class="flex-1" type="primary" @click="handleAddChild">
          子工单
        </wd-button>
        <wd-button v-if="canFinish" class="flex-1" type="success" @click="handleFinish">
          完成
        </wd-button>
        <wd-button v-if="canFinish" class="flex-1" type="warning" @click="handleCancel">
          取消
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import type { ProWorkOrderBom } from '@/api/mes/pro/workorder/bom'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { cancelWorkOrder, deleteWorkOrder, finishWorkOrder, getWorkOrder } from '@/api/mes/pro/workorder'
import { useAccess } from '@/hooks/useAccess'
import { buildBarcodeListUrl } from '@/pages-mes/wm/barcode/utils'
import { delay, navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, DICT_TYPE, MesProWorkOrderStatusEnum, MesProWorkOrderTypeEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import WorkOrderBomList from '../components/workorder-bom-list.vue'
import WorkOrderItemList from '../components/workorder-item-list.vue'

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
const formData = ref<ProWorkOrder>() // 详情数据
const deleting = ref(false) // 删除状态
const workOrderId = computed(() => formData.value?.id)
const canEdit = computed(() =>
  hasAccessByCodes(['mes:pro-work-order:update']) && formData.value?.status === MesProWorkOrderStatusEnum.PREPARE,
)
const canDelete = computed(() =>
  hasAccessByCodes(['mes:pro-work-order:delete']) && formData.value?.status === MesProWorkOrderStatusEnum.PREPARE,
)
const canAddChild = computed(() =>
  hasAccessByCodes(['mes:pro-work-order:create'])
  && formData.value?.status === MesProWorkOrderStatusEnum.CONFIRMED
  && formData.value?.type === MesProWorkOrderTypeEnum.SELF,
)
const canFinish = computed(() =>
  hasAccessByCodes(['mes:pro-work-order:update']) && formData.value?.status === MesProWorkOrderStatusEnum.CONFIRMED,
)
const clientText = computed(() => {
  if (!formData.value?.clientName && !formData.value?.clientCode) {
    return '-'
  }
  return `${formData.value.clientCode || '-'} / ${formData.value.clientName || '-'}`
})
const vendorText = computed(() => {
  if (!formData.value?.vendorName && !formData.value?.vendorCode) {
    return '-'
  }
  return `${formData.value.vendorCode || '-'} / ${formData.value.vendorName || '-'}`
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/workorder/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getWorkOrder(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/workorder/form/index?id=${props.id}` })
}

/** 新增子工单 */
function handleAddChild() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/workorder/form/index?parentId=${formData.value.id}` })
}

/** 从 BOM 行生成子工单 */
function handleGenerateWorkOrder(row: ProWorkOrderBom) {
  if (!formData.value?.id || !row.id) {
    return
  }
  const query = [
    `parentId=${formData.value.id}`,
    `bomId=${row.id}`,
  ].join('&')
  uni.navigateTo({ url: `/pages-mes/pro/workorder/form/index?${query}` })
}

/** 查看条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: buildBarcodeListUrl({
      bizType: BarcodeBizTypeEnum.WORKORDER,
      bizId: formData.value.id,
      bizCode: formData.value.code,
    }),
  })
}

/** 完成工单 */
async function handleFinish() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确认要完成「${formData.value.code}」生产工单吗？` })
  } catch {
    return
  }
  await finishWorkOrder(formData.value.id)
  toast.success('工单已完成')
  uni.$emit('mes:pro:workorder:reload')
  await getDetail()
}

/** 取消工单 */
async function handleCancel() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确认要取消「${formData.value.code}」生产工单吗？取消后不可恢复。` })
  } catch {
    return
  }
  await cancelWorkOrder(formData.value.id)
  toast.success('工单已取消')
  uni.$emit('mes:pro:workorder:reload')
  await getDetail()
}

/** 删除 */
async function handleDelete() {
  if (!props.id || !formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${formData.value.code}」生产工单吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteWorkOrder(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:pro:workorder:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
