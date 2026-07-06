<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 保养记录详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="设备编码" :value="formData?.machineryCode || '-'" />
        <wd-cell title="设备名称" :value="formData?.machineryName || '-'" />
        <wd-cell title="品牌" :value="formData?.machineryBrand || '-'" />
        <wd-cell title="规格型号" :value="formData?.machinerySpecification || '-'" />
        <wd-cell title="计划编码" :value="formData?.planCode || '-'" />
        <wd-cell title="计划名称" :value="formData?.planName || '-'" />
        <wd-cell title="保养时间" :value="formatDateTime(formData?.maintenTime) || '-'" />
        <wd-cell title="保养人" :value="formData?.nickname || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_MAINTEN_RECORD_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
      <MaintenRecordLineList v-if="props.id" :record-id="Number(props.id)" readonly />
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
          @click="handleSubmitRecord"
        >
          提交
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DvMaintenRecord } from '@/api/mes/dv/maintenrecord'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteMaintenRecord, getMaintenRecord, submitMaintenRecord } from '@/api/mes/dv/maintenrecord'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesDvMaintenRecordStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import MaintenRecordLineList from '../components/mainten-record-line-list.vue'

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
const formData = ref<DvMaintenRecord>() // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-mainten-record:update'])
  && formData.value?.status === MesDvMaintenRecordStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-mainten-record:delete'])
  && formData.value?.status === MesDvMaintenRecordStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:dv-mainten-record:update'])
  && formData.value?.status === MesDvMaintenRecordStatusEnum.PREPARE
))
const hasFooter = computed(() => canUpdatePrepare.value || canDeletePrepare.value || canSubmitPrepare.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/maintenrecord/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMaintenRecord(Number(props.id))
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
    url: `/pages-mes/dv/maintenrecord/form/index?id=${props.id}`,
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
      msg: `确定要删除「${formData.value.machineryCode || formData.value.machineryName || formData.value.id}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMaintenRecord(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:dv:maintenrecord:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交保养记录 */
async function handleSubmitRecord() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该保养记录？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitMaintenRecord(Number(props.id))
    toast.success('提交成功')
    await getDetail()
    uni.$emit('mes:dv:maintenrecord:reload')
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:dv:maintenrecord:reload', reloadDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:dv:maintenrecord:reload', reloadDetail)
})
</script>
