<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="OTA 任务详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="任务编号" :value="String(formData?.id || '-')" />
        <wd-cell title="任务名称" :value="formData?.name || '-'" />
        <wd-cell title="任务状态">
          <dict-tag :type="DICT_TYPE.IOT_OTA_TASK_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="升级范围">
          <dict-tag :type="DICT_TYPE.IOT_OTA_TASK_DEVICE_SCOPE" :value="formData?.deviceScope" />
        </wd-cell>
        <wd-cell title="设备总数" :value="String(formData?.deviceTotalCount || 0)" />
        <wd-cell title="成功数量" :value="String(formData?.deviceSuccessCount || 0)" />
        <wd-cell title="任务描述" :value="formData?.description || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="info" @click="handleRecords">
          记录
        </wd-button>
        <wd-button
          v-if="canCancelTask"
          class="flex-1"
          type="danger"
          :loading="canceling"
          :disabled="canceling"
          @click="handleCancel"
        >
          取消
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { OtaTask } from '@/api/iot/ota/task'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { cancelOtaTask, getOtaTask } from '@/api/iot/ota/task'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, IoTOtaTaskStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<OtaTask>() // 详情数据
const canceling = ref(false) // 取消状态
const canCancelTask = computed(() => { // 仅进行中任务可取消
  return formData.value?.status === IoTOtaTaskStatusEnum.IN_PROGRESS.value && hasAccessByCodes(['iot:ota-task:cancel'])
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/ota/task/index')
}

/** 加载任务详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getOtaTask(Number(props.id))
}

/** 查看升级记录 */
function handleRecords() {
  uni.navigateTo({ url: `/pages-iot/ota/record/index?taskId=${props.id}` })
}

/** 取消任务 */
async function handleCancel() {
  if (!props.id || canceling.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要取消该升级任务吗？' })
  } catch {
    return
  }
  canceling.value = true
  try {
    await cancelOtaTask(Number(props.id))
    toast.success('取消成功')
    uni.$emit('iot:ota-task:reload')
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
