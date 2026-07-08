<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="流转卡详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="流转卡编码" :value="formData?.code || '-'" />
        <wd-cell title="生产工单" :value="workOrderText" />
        <wd-cell title="批次号" :value="formData?.batchCode || '-'" />
        <wd-cell title="产品编码" :value="formData?.itemCode || '-'" />
        <wd-cell title="产品名称" :value="formData?.itemName || '-'" />
        <wd-cell title="规格型号" :value="formData?.specification || '-'" />
        <wd-cell title="单位" :value="formData?.unitMeasureName || '-'" />
        <wd-cell title="流转数量" :value="formData?.transferedQuantity ?? '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <CardProcessList v-if="formData?.id" :card-id="formData.id" :editable="canEdit" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="formData" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" @click="handleBarcode">
          条码
        </wd-button>
        <wd-button v-if="canEdit" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canFinish" class="flex-1" type="success" @click="handleFinish">
          完成
        </wd-button>
        <wd-button v-if="canCancel" class="flex-1" type="danger" @click="handleCancel">
          取消
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProCard } from '@/api/mes/pro/card'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { cancelCard, deleteCard, finishCard, getCard } from '@/api/mes/pro/card'
import { useAccess } from '@/hooks/useAccess'
import { buildBarcodeListUrl } from '@/pages-mes/wm/barcode/utils'
import { delay, navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, DICT_TYPE, MesProCardStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import CardProcessList from '../components/card-process-list.vue'

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
const formData = ref<ProCard>() // 详情数据
const deleting = ref(false) // 删除状态
const workOrderText = computed(() => `${formData.value?.workOrderCode || '-'} / ${formData.value?.workOrderName || '-'}`)
const isPrepare = computed(() => formData.value?.status === MesProCardStatusEnum.PREPARE)
const isConfirmed = computed(() => formData.value?.status === MesProCardStatusEnum.CONFIRMED)
const canEdit = computed(() => isPrepare.value && hasAccessByCodes(['mes:pro-card:update']))
const canFinish = computed(() => isConfirmed.value && hasAccessByCodes(['mes:pro-card:finish']))
const canCancel = computed(() => isConfirmed.value && hasAccessByCodes(['mes:pro-card:update']))
const canDelete = computed(() => isPrepare.value && hasAccessByCodes(['mes:pro-card:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/card/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getCard(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 查看条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: buildBarcodeListUrl({
      bizType: BarcodeBizTypeEnum.PROCARD,
      bizId: formData.value.id,
      bizCode: formData.value.code,
    }),
  })
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/card/form/index?id=${props.id}` })
}

/** 完成流转卡 */
async function handleFinish() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认完成该流转卡？' })
  } catch {
    return
  }
  await finishCard(formData.value.id)
  toast.success('完成成功')
  uni.$emit('mes:pro:card:reload')
  await getDetail()
}

/** 取消流转卡 */
async function handleCancel() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认取消该流转卡？取消后不可恢复。' })
  } catch {
    return
  }
  await cancelCard(formData.value.id)
  toast.success('取消成功')
  uni.$emit('mes:pro:card:reload')
  await getDetail()
}

/** 删除 */
async function handleDelete() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该流转卡吗？删除后会级联删除工序记录。' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteCard(formData.value.id)
    toast.success('删除成功')
    uni.$emit('mes:pro:card:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
