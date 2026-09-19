<template>
  <view class="yd-page-container pb-160rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="离职详情"
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
        <wd-cell title="工作交接人" :value="handoverUserName" />
        <wd-cell title="有未完成报销" :value="formData?.hasPendingReimbursement ? '是' : '否'" />
        <wd-cell title="申请人" :value="formData?.creatorName || '-'" />
        <wd-cell title="申请时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 申请原因 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          申请原因
        </view>
        <view v-if="formData?.reason" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.reason }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无原因
        </view>
      </view>

      <!-- 未完成事宜 -->
      <view v-if="formData?.unfinishedWork" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          未完成事宜
        </view>
        <view class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.unfinishedWork }}
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="formData?.processInstanceId || formData?.status === OA_APPLY_STATUS.NOT_START" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="formData?.status === OA_APPLY_STATUS.NOT_START">
          <wd-button
            v-if="hasAccessByCodes(['oa:resign-apply:create'])"
            class="flex-1" type="warning" @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:resign-apply:create'])"
            class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply"
          >
            提交审批
          </wd-button>
        </template>
        <wd-button
          v-if="formData?.processInstanceId"
          class="flex-1" type="primary" @click="handleViewProcess"
        >
          审批进度
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ResignApply } from '@/api/oa/resign'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getResignApply, submitResignApply } from '@/api/oa/resign'
import { getSimpleUserList } from '@/api/system/user'
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
const formData = ref<ResignApply>() // 详情数据
const submitting = ref(false) // 提交审批状态
const userList = ref<any[]>([]) // 用户列表，用于交接人姓名回显
const handoverUserName = computed(() => { // 交接人姓名
  const user = userList.value.find(item => item.id === formData.value?.handoverUserId)
  return user?.nickname || '-'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载离职申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getResignApply(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑离职申请 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/resign/form/index?id=${props.id}`,
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
    await submitResignApply(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:resign:reload')
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
  uni.$on('oa:resign:reload', getDetail)
  getDetail()
  getSimpleUserList().then((list) => {
    userList.value = list
  })
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:resign:reload', getDetail)
})
</script>
