<template>
  <view class="yd-page-container pb-[76rpx]">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="发起请假"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />
    <view class="mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white">
      <!-- 表单内容 -->
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border title="请假信息">
          <yd-form-picker
            v-model="formData.type"
            label="请假类型"
            prop="type"
            :dict-type="DICT_TYPE.BPM_OA_LEAVE_TYPE"
            placeholder="请选择请假类型"
          />
          <wd-form-item
            title="开始时间"
            title-width="200rpx"
            prop="startTime"
            is-link
            :value="formatDateTime(formData.startTime)"
            placeholder="请选择开始时间"
            @click="pickerVisible.startTime = true"
          />
          <wd-datetime-picker
            v-model="formData.startTime"
            v-model:visible="pickerVisible.startTime"
            title="请选择开始时间"
          />
          <wd-form-item
            title="结束时间"
            title-width="200rpx"
            prop="endTime"
            is-link
            :value="formatDateTime(formData.endTime)"
            placeholder="请选择结束时间"
            @click="pickerVisible.endTime = true"
          />
          <wd-datetime-picker
            v-model="formData.endTime"
            v-model:visible="pickerVisible.endTime"
            title="请选择结束时间"
          />
          <wd-form-item title="请假原因" title-width="200rpx" prop="reason">
            <wd-textarea
              v-model="formData.reason"
              placeholder="请输入请假原因"
              :maxlength="200"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>
    <!-- 流程预览卡片 -->
    <view class="mx-24rpx mb-120rpx mt-24rpx rounded-16rpx bg-white">
      <view class="p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-28rpx text-[#333] font-bold">流程预览</text>
          <wd-loading v-if="processTimeLineLoading" size="32rpx" />
        </view>

        <!-- 流程时间线 -->
        <ProcessInstanceTimeline
          v-if="activityNodes.length > 0"
          :activity-nodes="activityNodes"
          :show-status-icon="false"
          @select-user-confirm="selectUserConfirm"
        />

        <!-- 无流程数据提示 -->
        <view v-else-if="!processTimeLineLoading" class="py-40rpx text-center">
          <text class="text-24rpx text-[#999]">暂无流程预览数据</text>
        </view>
      </view>
    </view>

    <!-- 底部提交按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" class="flex-1" :loading="formLoading" @click="handleSubmit">
          提交
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Leave } from '@/api/bpm/oa/leave'
import type { ApprovalNodeInfo } from '@/api/bpm/processInstance'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getProcessDefinition } from '@/api/bpm/definition'
import { createLeave, getLeave } from '@/api/bpm/oa/leave'
import { getApprovalDetail } from '@/api/bpm/processInstance'
import ProcessInstanceTimeline from '@/pages-bpm/processInstance/detail/components/time-line.vue'
import { delay, navigateBackPlus } from '@/utils'
import { BpmCandidateStrategyEnum, BpmNodeIdEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const formLoading = ref(false) // 表单提交状态
const processTimeLineLoading = ref(false) // 流程预览加载状态

// 流程相关数据
const processDefineKey = 'oa_leave' // 流程定义 Key
const processDefinitionId = ref('')
const activityNodes = ref<ApprovalNodeInfo[]>([]) // 审批节点信息
const startUserSelectTasks = ref<any[]>([]) // 发起人需要选择审批人的用户任务列表
const startUserSelectAssignees = ref<any>({}) // 发起人选择审批人的数据
const tempStartUserSelectAssignees = ref<any>({}) // 临时保存的审批人数据
let previewPromise: Promise<void> | undefined // 进行中的流程预览重算

const formData = ref<Partial<Leave>>({
  type: undefined,
  startTime: undefined,
  endTime: undefined,
  reason: undefined,
}) // 表单数据
const formSchema = createFormSchema({
  type: [{ required: true, message: '请选择请假类型' }],
  startTime: [{ required: true, message: '请选择开始时间' }],
  endTime: [{ required: true, message: '请选择结束时间' }],
  reason: [{ required: true, message: '请输入请假原因' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({})

// 计算请假天数
const leaveDays = computed(() => {
  if (!formData.value.startTime || !formData.value.endTime) {
    return 0
  }
  const start = new Date(formData.value.startTime)
  const end = new Date(formData.value.endTime)
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
})

/** 返回上一页 */
async function handleBack() {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要返回吗？请先保存您填写的信息！',
    })
  } catch {
    return
  }
  navigateBackPlus('/pages-bpm/oa/leave/index')
}

/** 获取流程审批详情 */
async function getProcessApprovalDetail() {
  if (!processDefinitionId.value) {
    return
  }

  processTimeLineLoading.value = true
  try {
    const data = await getApprovalDetail({
      processDefinitionId: processDefinitionId.value,
      activityId: BpmNodeIdEnum.START_USER_NODE_ID,
      processVariablesStr: JSON.stringify({
        day: leaveDays.value,
      }),
    })

    if (!data) {
      toast.show('查询不到审批详情信息！')
      return
    }

    // 获取审批节点，显示 Timeline 的数据
    activityNodes.value = data.activityNodes || []

    // 获取发起人自选的任务
    startUserSelectTasks.value = data.activityNodes?.filter(
      (node: ApprovalNodeInfo) =>
        BpmCandidateStrategyEnum.START_USER_SELECT === node.candidateStrategy,
    ) || []

    // 恢复之前的选择审批人
    if (startUserSelectTasks.value.length > 0) {
      for (const node of startUserSelectTasks.value) {
        startUserSelectAssignees.value[node.id]
          = tempStartUserSelectAssignees.value[node.id]
            && tempStartUserSelectAssignees.value[node.id].length > 0
            ? tempStartUserSelectAssignees.value[node.id]
            : []
      }
    }
  } finally {
    processTimeLineLoading.value = false
  }
}

/** 选择审批人确认 */
function selectUserConfirm(id: string, userList: any[]) {
  startUserSelectAssignees.value[id] = userList?.map((item: any) => item.id) || []
}

/** 刷新流程预览 */
function refreshPreview() {
  tempStartUserSelectAssignees.value = { ...startUserSelectAssignees.value }
  startUserSelectAssignees.value = {}
  previewPromise = getProcessApprovalDetail()
  return previewPromise
}

/** 提交前等待流程预览，失败返回 false */
async function flushPreview(): Promise<boolean> {
  if (!previewPromise) {
    refreshPreview()
  }
  try {
    await previewPromise
    return true
  } catch {
    previewPromise = undefined
    return false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  if (formData.value.startTime! >= formData.value.endTime!) {
    toast.show('结束时间必须大于开始时间')
    return
  }

  // 提交前等待流程预览
  const previewOk = await flushPreview()
  if (!previewOk) {
    toast.show('流程预览加载失败，请重试')
    return
  }

  // 校验指定审批人
  if (startUserSelectTasks.value.length > 0) {
    for (const userTask of startUserSelectTasks.value) {
      if (
        Array.isArray(startUserSelectAssignees.value[userTask.id])
        && startUserSelectAssignees.value[userTask.id].length === 0
      ) {
        toast.show(`请选择${userTask.name}的审批人`)
        return
      }
    }
  }

  formLoading.value = true
  try {
    const submitData = { ...formData.value }
    // 设置指定审批人
    if (startUserSelectTasks.value.length > 0) {
      submitData.startUserSelectAssignees = startUserSelectAssignees.value
    }

    await createLeave(submitData)
    toast.success('提交成功')
    uni.$emit('bpm:oa-leave:reload')
    uni.$emit('bpm:task:reload')
    delay(() => navigateBackPlus('/pages-bpm/oa/leave/index'))
  } finally {
    formLoading.value = false
  }
}

// 监听表单数据变化，重新预测流程节点
watch(
  () => [formData.value.startTime, formData.value.endTime, formData.value.type],
  (newValue, oldValue) => {
    if (!oldValue || !oldValue.some(v => v !== undefined)) {
      return
    }
    if (newValue && newValue.some(v => v !== undefined)) {
      refreshPreview()
    }
  },
  { deep: true },
)

/** 重新发起时回填请假信息 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getLeave(Number(props.id))
  formData.value.type = data.type
  formData.value.reason = data.reason
  formData.value.startTime = data.startTime
  formData.value.endTime = data.endTime
}

// 组件初始化
onMounted(async () => {
  // 重新发起时回填请假信息
  await getDetail()

  // 获取流程定义详情
  const processDefinitionDetail = await getProcessDefinition(undefined, processDefineKey)
  if (!processDefinitionDetail) {
    toast.show('OA 请假的流程模型未配置，请检查！')
    return
  }
  processDefinitionId.value = processDefinitionDetail.id

  // 获取流程审批详情
  previewPromise = getProcessApprovalDetail()
  await previewPromise
})
</script>
