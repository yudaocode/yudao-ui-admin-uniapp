<template>
  <view class="yd-page-container pb-[80rpx]">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="审批详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 区域：流程信息（基本信息） -->
    <view class="relative mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white">
      <!-- 审批状态图标（盖章效果） -->
      <wd-img
        v-if="processInstance?.status !== undefined"
        :src="getStatusIcon(processInstance?.status)"
        width="144rpx"
        height="144rpx"
        mode="aspectFit"
        class="absolute right-20rpx top-20rpx z-10"
      />
      <view class="p-24rpx">
        <!-- 标题 -->
        <view class="mb-16rpx pr-160rpx">
          <text class="text-32rpx text-[#333] font-bold">{{ processInstance?.name }}</text>
        </view>
        <!-- 发起人信息 -->
        <view class="flex items-center">
          <view class="mr-12rpx h-64rpx w-64rpx flex items-center justify-center rounded-full bg-[#1890ff] text-white">
            {{ processInstance?.startUser?.nickname?.[0] || '?' }}
          </view>
          <view>
            <text class="text-28rpx text-[#333]">{{ processInstance?.startUser?.nickname }}</text>
            <text v-if="processInstance?.startUser?.deptName" class="ml-8rpx text-24rpx text-[#999]">
              {{ processInstance?.startUser?.deptName }}
            </text>
          </view>
        </view>
        <!-- 提交时间 -->
        <view class="mt-16rpx text-24rpx text-[#999]">
          提交于 {{ formatDateTime(processInstance?.startTime) }}
        </view>
      </view>
    </view>

    <!-- Tabs 区域：详情内容 -->
    <view class="mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="详情" />
        <wd-tab title="进度" />
        <wd-tab title="评论" />
        <wd-tab title="流程图" />
      </wd-tabs>
    </view>

    <!-- 区域：审批详情（表单） -->
    <FormDetail
      v-show="tabType === 'detail'"
      ref="formDetailRef"
      :process-definition="processDefinition"
      :process-instance="processInstance"
      :form-fields-permission="formFieldsPermission"
    />

    <!-- 区域：审批进度 -->
    <view v-show="tabType === 'progress'" class="mx-24rpx mt-24rpx rounded-16rpx bg-white">
      <view class="p-24rpx">
        <view class="mb-16rpx flex">
          <text class="text-28rpx text-[#333] font-bold">审批进度</text>
        </view>
        <!-- 流程时间线 -->
        <ProcessInstanceTimeline :activity-nodes="activityNodes" />
      </view>
    </view>

    <!-- 区域：流程评论 -->
    <ProcessInstanceCommentList v-show="tabType === 'comment'" :id="props.id" ref="commentListRef" />

    <!-- 区域：流程图（仅 PC 预览，移动端不支持） -->
    <view v-show="tabType === 'diagram'" class="mx-24rpx mt-24rpx rounded-16rpx bg-white">
      <view class="p-24rpx">
        <view class="flex items-center justify-between">
          <view class="flex items-center">
            <text class="text-28rpx text-[#333] font-bold">流程图</text>
            <text class="ml-12rpx rounded-6rpx bg-[#fff7e6] px-10rpx py-2rpx text-20rpx text-[#fa8c16]">PC</text>
          </view>
          <wd-button
            icon="printer"
            size="small"
            type="primary"
            variant="plain"
            :round="false"
            @click="handlePrintTip"
          >
            打印
          </wd-button>
        </view>
        <text class="mt-16rpx block text-24rpx text-[#999] leading-36rpx">仅 PC 支持预览，请前往 PC 端查看 BPMN 或简易流程图。</text>
      </view>
    </view>

    <!-- 区域：底部操作栏 -->
    <ProcessInstanceOperationButton
      v-if="!revisionTaskId"
      ref="operationButtonRef"
      :validate-normal-form="validateNormalForm"
      :get-normal-form-variables="getNormalFormVariables"
    />
    <!-- 退回修改：当前用户是修改人时，修改表单后重新提交。按钮权限和后端 /bpm/task/resubmit 一致 -->
    <view v-if="revisionTaskId && hasAccessByCodes(['bpm:task:update', 'bpm:process-instance:query'])" class="yd-detail-footer">
      <wd-button
        type="primary"
        :round="false"
        block
        :loading="resubmitting"
        @click="handleResubmit"
      >
        重新提交
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ApprovalNodeInfo, ProcessDefinition, ProcessInstance } from '@/api/bpm/processInstance'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { computed, nextTick, onMounted, ref } from 'vue'
import { getApprovalDetail } from '@/api/bpm/processInstance'
import { resubmitTask } from '@/api/bpm/task'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { setTabParams } from '@/utils/url'
import ProcessInstanceCommentList from './components/comment-list.vue'
import FormDetail from './components/form-detail.vue'
import ProcessInstanceOperationButton from './components/operation-button.vue'
import ProcessInstanceTimeline from './components/time-line.vue'

const props = defineProps<{
  id: string // 流程实例的编号
  taskId?: string // 任务编号
  activityId?: string // 活动编号（抄送查看场景定位）
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { hasAccessByCodes } = useAccess()
const revisionTaskId = ref<string>() // 退回修改中的任务编号：当前用户是修改人时，由后端返回
const revisionId = ref<string>() // 退回修改的批次编号：重新提交时传递，避免过期的页面提交
const resubmitting = ref(false) // 重新提交状态
const processInstance = ref<ProcessInstance>()
const processDefinition = ref<ProcessDefinition>()
const formFieldsPermission = ref<Record<string, string>>({})

const activityNodes = ref<ApprovalNodeInfo[]>([]) // 审批节点信息
const tabIndex = ref(0) // 当前选中的详情页签下标
const tabTypes = ['detail', 'progress', 'comment', 'diagram'] as const
const tabType = computed(() => tabTypes[tabIndex.value] || 'detail') // 当前选中的详情页签类型

const operationButtonRef = ref() // 操作按钮组件 ref
const formDetailRef = ref<InstanceType<typeof FormDetail>>() // 流程表单 ref
const commentListRef = ref<InstanceType<typeof ProcessInstanceCommentList>>() // 评论列表组件 ref

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/bpm/index')
}

/** 获取状态图标 */
function getStatusIcon(status?: number): string {
  // 状态映射： 1-审批中, 2-审批通过, 3-审批不通过, 4-已取消, 7-审批通过中. -1 未开始不会出现
  const iconMap: Record<number, string> = {
    [BpmProcessInstanceStatus.RUNNING]: '/static/my-icons/bpm/bpm-running.svg', // 待审批
    [BpmProcessInstanceStatus.APPROVE]: '/static/my-icons/bpm/bpm-approve.svg', // 审批通过
    [BpmProcessInstanceStatus.REJECT]: '/static/my-icons/bpm/bpm-reject.svg', // 审批不通过
    [BpmProcessInstanceStatus.CANCEL]: '/static/my-icons/bpm/bpm-cancel.svg', // 已取消
    [BpmProcessInstanceStatus.APPROVING]: '/static/my-icons/bpm/bpm-running.svg', // 审批通过中
  }
  return iconMap[status ?? BpmProcessInstanceStatus.RUNNING] || iconMap[BpmProcessInstanceStatus.RUNNING]
}

/** 打印提示 */
function handlePrintTip() {
  toast.show('请前往 PC 打印')
}

/** 加载流程实例 */
async function loadProcessInstance() {
  const data = await getApprovalDetail({
    processInstanceId: props.id,
    activityId: props.activityId,
    taskId: props.taskId,
  })
  if (!data || !data.processInstance) {
    toast.show('查询不到审批详情信息')
    return
  }
  processInstance.value = data.processInstance
  processDefinition.value = data.processDefinition
  formFieldsPermission.value = data.formFieldsPermission || {}
  revisionTaskId.value = data.revisionTaskId
  revisionId.value = data.revisionId
  // 获取审批节点，显示 Timeline 的数据
  activityNodes.value = data.activityNodes

  // 初始化操作栏，并统一刷新评论列表。修改人重新提交后，操作栏重新挂载，需要等待渲染
  await nextTick()
  operationButtonRef.value?.init(data.processInstance, data.todoTask)
  commentListRef.value?.getList()
}

/** 校验流程表单中当前节点允许编辑的字段 */
async function validateNormalForm() {
  const result = await formDetailRef.value?.validate()
  return result?.valid !== false
}

/** 获取流程表单中当前节点允许编辑的变量 */
function getNormalFormVariables() {
  return formDetailRef.value?.getWritableVariables() || {}
}

/** 退回修改后，重新提交 */
async function handleResubmit() {
  if (!revisionTaskId.value) {
    return
  }
  // 移动端无法完整编辑的字段，提交会丢失或改写数据，需要前往 PC 端修改
  const unsupportedField = formDetailRef.value?.getUnsupportedWritableField()
  if (unsupportedField) {
    toast.show(`「${unsupportedField}」暂不支持在移动端修改，请前往 PC 端重新提交`)
    return
  }
  if (!await validateNormalForm()) {
    toast.show('表单校验不通过，请先完善表单')
    return
  }
  resubmitting.value = true
  try {
    // 只提交可编辑的字段，后端会按退回目标节点的表单字段权限校验
    await resubmitTask({
      taskId: revisionTaskId.value,
      revisionId: revisionId.value!,
      variables: getNormalFormVariables(),
    })
    toast.success('重新提交成功，等待审批人继续审批')
    uni.$emit('bpm:task:reload')
    // 只有待办权限的修改人，提交后不能再查看该流程详情，所以回到待办列表
    if (!hasAccessByCodes(['bpm:process-instance:query'])) {
      delay(() => {
        setTabParams({ tab: 'todo' })
        uni.switchTab({ url: '/pages/bpm/index' })
      })
      return
    }
    // 刷新后，后端不再返回 revisionTaskId，切换回普通的操作栏
    await loadProcessInstance()
  } finally {
    resubmitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  if (!props.id) {
    toast.show('参数错误')
    return
  }
  uni.$on('bpm:processInstance:reload', loadProcessInstance)
  loadProcessInstance()
})

/** 页面卸载时注销刷新监听 */
onUnload(() => {
  uni.$off('bpm:processInstance:reload', loadProcessInstance)
})
</script>
