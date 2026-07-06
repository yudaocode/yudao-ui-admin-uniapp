<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 生产报工详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="报工单号" :value="formData?.code || '-'" />
        <wd-cell title="报工类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_PRO_FEEDBACK_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_PRO_FEEDBACK_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="生产工单" :value="formData?.workOrderCode || '-'" />
        <wd-cell title="生产任务" :value="formData?.taskCode || '-'" />
        <wd-cell title="工作站" :value="formData?.workstationName || '-'" />
        <wd-cell title="工序" :value="formData?.processName || '-'" />
        <wd-cell title="是否质检" :value="formData?.checkFlag ? '是' : '否'" />
      </wd-cell-group>

      <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
        产品与数量
      </view>
      <wd-cell-group border>
        <wd-cell title="物料编码" :value="formData?.itemCode || '-'" />
        <wd-cell title="物料名称" :value="formData?.itemName || '-'" />
        <wd-cell title="规格型号" :value="formData?.itemSpecification || '-'" />
        <wd-cell title="单位" :value="formData?.unitMeasureName || '-'" />
        <wd-cell title="排产数量" :value="formatNumber(formData?.scheduledQuantity)" />
        <wd-cell title="报工数量" :value="formatNumber(formData?.feedbackQuantity)" />
        <wd-cell title="合格数量" :value="formatNumber(formData?.qualifiedQuantity)" />
        <wd-cell title="不良数量" :value="formatNumber(formData?.unqualifiedQuantity)" />
        <wd-cell title="待检数量" :value="formatNumber(formData?.uncheckQuantity)" />
        <wd-cell title="工废数量" :value="formatNumber(formData?.laborScrapQuantity)" />
        <wd-cell title="料废数量" :value="formatNumber(formData?.materialScrapQuantity)" />
        <wd-cell title="其他废品" :value="formatNumber(formData?.otherScrapQuantity)" />
      </wd-cell-group>

      <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
        人员与备注
      </view>
      <wd-cell-group border>
        <wd-cell title="报工人" :value="formData?.feedbackUserNickname || '-'" />
        <wd-cell title="报工时间" :value="formatDateTime(formData?.feedbackTime) || '-'" />
        <wd-cell title="审核人" :value="formData?.approveUserNickname || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <ItemConsumeList v-if="showTraceLists" :feedback-id="formData?.id" />
      <ProductProduceList v-if="showTraceLists" :feedback-id="formData?.id" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="showFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canEdit" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canSubmit" class="flex-1" type="primary" :loading="submitting" @click="handleSubmitFeedback">
          提交
        </wd-button>
        <wd-button v-if="canApprove" class="flex-1" type="success" @click="handleApprove">
          审批
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProFeedback } from '@/api/mes/pro/feedback'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteFeedback, getFeedback, submitFeedback } from '@/api/mes/pro/feedback'
import { useAccess } from '@/hooks/useAccess'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesProFeedbackStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ItemConsumeList from '../components/item-consume-list.vue'
import ProductProduceList from '../components/product-produce-list.vue'

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
const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ProFeedback>() // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const currentUserId = computed(() => userStore.userInfo?.userId)
const canEdit = computed(() =>
  hasAccessByCodes(['mes:pro-feedback:update']) && formData.value?.status === MesProFeedbackStatusEnum.PREPARE,
)
const canSubmit = computed(() =>
  hasAccessByCodes(['mes:pro-feedback:update']) && formData.value?.status === MesProFeedbackStatusEnum.PREPARE,
)
const canDelete = computed(() =>
  hasAccessByCodes(['mes:pro-feedback:delete']) && formData.value?.status === MesProFeedbackStatusEnum.PREPARE,
)
const canApprove = computed(() =>
  hasAccessByCodes(['mes:pro-feedback:approve'])
  && formData.value?.status === MesProFeedbackStatusEnum.APPROVING
  && formData.value?.approveUserId === currentUserId.value,
)
const showFooter = computed(() => canEdit.value || canSubmit.value || canDelete.value || canApprove.value)
const showTraceLists = computed(() =>
  !!formData.value?.id
  && formData.value.status !== MesProFeedbackStatusEnum.PREPARE
  && formData.value.status !== MesProFeedbackStatusEnum.APPROVING,
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/feedback/index')
}

/** 数值展示 */
function formatNumber(value?: number) {
  return value == null ? '-' : `${value}`
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getFeedback(Number(props.id))
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
    url: `/pages-mes/pro/feedback/form/index?id=${props.id}&mode=update`,
  })
}

/** 提交 */
async function handleSubmitFeedback() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提交报工单',
      msg: `确定提交「${formData.value.code || formData.value.id}」吗？提交后将不能修改。`,
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitFeedback(formData.value.id)
    toast.success('提交成功')
    uni.$emit('mes:pro:feedback:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 审批 */
function handleApprove() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/pro/feedback/form/index?id=${props.id}&mode=approve`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id || !formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除报工单',
      msg: `确定删除「${formData.value.code || formData.value.id}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteFeedback(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:pro:feedback:reload')
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
