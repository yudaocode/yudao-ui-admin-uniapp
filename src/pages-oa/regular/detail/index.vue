<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="转正详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="标题" :value="formData?.title ?? '-'" />
        <wd-cell title="审批状态">
          <text v-if="formData?.status === OA_APPLY_STATUS.NOT_START" class="text-28rpx text-[#999]">未提交</text>
          <dict-tag v-else-if="formData" :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="紧急程度">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_APPLY_URGENCY" :value="formData.urgency" />
        </wd-cell>
        <wd-cell title="开始时间" :value="formatDateTime(formData?.startTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDateTime(formData?.endTime) || '-'" />
        <wd-cell title="试用期天数" :value="formData?.days != null ? `${formData.days} 天` : '-'" />
        <wd-cell title="申请人" :value="formData?.creatorName || '-'" />
        <wd-cell title="申请时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 试用期总结 -->
      <view v-for="section in sections" :key="section.label" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          {{ section.label }}
        </view>
        <view v-if="section.value" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ section.value }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无内容
        </view>
      </view>

      <!-- 审批进度入口 -->
      <view
        v-if="formData?.processInstanceId"
        class="mt-20rpx flex items-center justify-between rounded-12rpx bg-white p-24rpx"
        @click="handleViewProcess"
      >
        <text class="text-28rpx text-[#333]">审批进度</text>
        <wd-icon name="arrow-right" size="28rpx" color="#999" />
      </view>
    </view>

    <!-- 底部操作按钮：草稿可编辑、提交审批 -->
    <view v-if="formData?.status === OA_APPLY_STATUS.NOT_START" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:regular-apply:create'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:regular-apply:create'])"
          class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply"
        >
          提交审批
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { RegularApply } from '@/api/oa/regular'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getRegularApply, submitRegularApply } from '@/api/oa/regular'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { OA_APPLY_STATUS } from '../../utils/constants'

const props = defineProps<{
  id?: string
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
const formData = ref<RegularApply>() // 详情数据
const submitting = ref(false) // 提交审批状态
const sections = computed(() => [ // 试用期总结分区
  { label: '试用期心得', value: formData.value?.experience },
  { label: '岗位职责理解', value: formData.value?.understanding },
  { label: '试用期成长', value: formData.value?.growth },
  { label: '目前不足', value: formData.value?.deficiency },
  { label: '工作改进', value: formData.value?.improvement },
  { label: '产品意见建议', value: formData.value?.suggestion },
])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载转正申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getRegularApply(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑转正申请 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/regular/form/index?id=${props.id}`,
  })
}

/** 提交审批 */
async function handleSubmitApply() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要提交审批吗？',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitRegularApply(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:regular:reload')
    delay(handleBack)
  } finally {
    submitting.value = false
  }
}

/** 查看审批进度 */
function handleViewProcess() {
  uni.navigateTo({
    url: `/pages-bpm/processInstance/detail/index?id=${formData.value?.processInstanceId}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:regular:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:regular:reload', getDetail)
})
</script>
