<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 维修工单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="维修单编号" :value="formData?.code || '-'" />
        <wd-cell title="维修单名称" :value="formData?.name || '-'" />
        <wd-cell title="设备编码" :value="formData?.machineryCode || '-'" />
        <wd-cell title="设备名称" :value="formData?.machineryName || '-'" />
        <wd-cell title="品牌" :value="formData?.machineryBrand || '-'" />
        <wd-cell title="规格型号" :value="formData?.machinerySpecification || '-'" />
        <wd-cell title="报修日期" :value="formatDateTime(formData?.requireDate) || '-'" />
        <wd-cell title="维修完成日期" :value="formatDateTime(formData?.finishDate) || '-'" />
        <wd-cell title="维修人员" :value="formData?.acceptedUserNickname || '-'" />
        <wd-cell title="验收日期" :value="formatDateTime(formData?.confirmDate) || '-'" />
        <wd-cell title="验收人员" :value="formData?.confirmUserNickname || '-'" />
        <wd-cell title="维修结果">
          <dict-tag v-if="formData?.result != null" :type="DICT_TYPE.MES_DV_REPAIR_RESULT" :value="formData.result" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_DV_REPAIR_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
      <RepairLineList v-if="props.id" :repair-id="Number(props.id)" readonly />
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
          v-if="canDeletePrepare"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
        <wd-button
          v-if="canSubmitPrepare"
          class="flex-1"
          type="success"
          :loading="submitting"
          @click="handleSubmitRepair"
        >
          提交
        </wd-button>
        <wd-button
          v-if="canConfirmRepair"
          class="flex-1"
          type="success"
          @click="handleConfirm"
        >
          完成维修
        </wd-button>
        <wd-button
          v-if="canFinishRepair"
          class="flex-1"
          type="success"
          @click="handleFinish"
        >
          验收
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DvRepair } from '@/api/mes/dv/repair'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteRepair, getRepair, submitRepair } from '@/api/mes/dv/repair'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesDvRepairStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import RepairLineList from '../components/repair-line-list.vue'

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
const formData = ref<DvRepair>() // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-repair:update'])
  && formData.value?.status === MesDvRepairStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-repair:delete'])
  && formData.value?.status === MesDvRepairStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:dv-repair:update'])
  && formData.value?.status === MesDvRepairStatusEnum.PREPARE
))
const canConfirmRepair = computed(() => (
  hasAccessByCodes(['mes:dv-repair:update'])
  && formData.value?.status === MesDvRepairStatusEnum.CONFIRMED
))
const canFinishRepair = computed(() => (
  hasAccessByCodes(['mes:dv-repair:update'])
  && formData.value?.status === MesDvRepairStatusEnum.APPROVING
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canConfirmRepair.value
  || canFinishRepair.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/repair/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getRepair(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 刷新详情 */
function reloadDetail() {
  if (deleting.value) {
    return
  }
  getDetail()
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/dv/repair/form/index?id=${props.id}`,
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
    await deleteRepair(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:dv:repair:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交维修工单 */
async function handleSubmitRepair() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该维修工单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitRepair(Number(props.id))
    toast.success('提交成功')
    await getDetail()
    uni.$emit('mes:dv:repair:reload')
  } finally {
    submitting.value = false
  }
}

/** 完成维修 */
function handleConfirm() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/dv/repair/form/index?id=${props.id}&mode=confirm`,
  })
}

/** 验收 */
function handleFinish() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/dv/repair/form/index?id=${props.id}&mode=finish`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:dv:repair:reload', reloadDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:dv:repair:reload', reloadDetail)
})
</script>
