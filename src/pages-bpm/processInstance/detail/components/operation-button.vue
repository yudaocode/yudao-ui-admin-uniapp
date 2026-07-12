<!-- 操作按钮 -->
<template>
  <!-- 有待审批的任务 -->
  <view v-if="runningTask" class="yd-detail-footer">
    <view class="w-full flex items-center">
      <!-- 左侧操作按钮 -->
      <view v-for="(action, idx) in leftOperations" :key="idx" class="mr-32rpx w-60rpx flex flex-col items-center" @click="handleOperation(action.operationType)">
        <wd-icon :name="action.iconName" size="40rpx" color="#1890ff" />
        <text class="mt-4rpx text-22rpx text-[#333]">{{ action.displayName }}</text>
      </view>
      <!-- 更多操作按钮 -->
      <view v-if="moreOperations.length > 0" class="mr-32rpx w-60rpx flex flex-col items-center" @click="handleShowMore">
        <wd-icon name="more" size="40rpx" color="#1890ff" />
        <text class="mt-4rpx text-22rpx text-[#333]">更多</text>
      </view>
      <!-- 更多操作 ActionSheet -->
      <wd-action-sheet v-if="moreOperations.length > 0" v-model="showMoreActions" :actions="moreOperations" title="请选择操作" @select="handleMoreAction" />

      <!-- 右侧操作按钮 -->
      <view class="flex flex-1 gap-16rpx">
        <wd-button
          v-for="(action, idx) in rightOperations"
          :key="idx"
          :variant="action.variant"
          :type="action.btnType"
          :round="false"
          class="flex-1"
          custom-style="min-width: 200rpx; width: 200rpx;"
          @click="handleOperation(action.operationType)"
        >
          {{ action.displayName }}
        </wd-button>
      </view>
    </view>
  </view>
  <!-- 无待审批任务，仅流程发起人可取消 -->
  <view v-if="!runningTask && isShowProcessStartCancel()" class="yd-detail-footer">
    <wd-button
      variant="plain"
      type="primary"
      :round="false"
      block
      @click="handleOperation(BpmTaskOperationButtonTypeEnum.PROCESS_START_CANCEL)"
    >
      取消
    </wd-button>
  </view>

  <!-- 评论弹窗 -->
  <wd-popup v-model="commentVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="p-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        评论
      </view>
      <wd-textarea
        v-model="commentForm.message"
        placeholder="请输入评论内容"
        :maxlength="500"
        show-word-limit
        clearable
      />
      <view class="mt-24rpx flex gap-16rpx">
        <wd-button class="flex-1" variant="plain" @click="closeComment">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="commentSubmitting" @click="handleCommentSubmit">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Action } from '@wot-ui/ui/components/wd-action-sheet/types'
import type { ButtonType, ButtonVariant } from '@wot-ui/ui/components/wd-button/types'
import type { ProcessInstance } from '@/api/bpm/processInstance'
import type { Task } from '@/api/bpm/task'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createComment } from '@/api/bpm/comment'
import { useUserStore } from '@/store'
import {
  BpmProcessInstanceStatus,
  BpmTaskOperationButtonTypeEnum,
  BpmTaskStatusEnum,
  OPERATION_BUTTON_NAME,
} from '@/utils/constants'

const props = defineProps<{
  validateNormalForm?: () => Promise<boolean>
  getNormalFormVariables?: () => Record<string, any>
}>()

const showMoreActions = ref(false)

type MoreOperationType = Action & {
  operationType: number
}

interface LeftOperationType {
  operationType: number
  iconName: string
  displayName: string
}

interface RightOperationType {
  operationType: number
  btnType: ButtonType
  displayName: string
  variant: ButtonVariant
}
const operationIconsMap: Record<number, string> = {
  [BpmTaskOperationButtonTypeEnum.COMMENT]: 'message',
  [BpmTaskOperationButtonTypeEnum.TRANSFER]: 'swap',
  [BpmTaskOperationButtonTypeEnum.ADD_SIGN]: 'user-add',
  [BpmTaskOperationButtonTypeEnum.DELEGATE]: 'send',
  [BpmTaskOperationButtonTypeEnum.RETURN]: 'arrow-left',
  [BpmTaskOperationButtonTypeEnum.COPY]: 'copy',
  [BpmTaskOperationButtonTypeEnum.DELETE_SIGN]: 'minus',
  [BpmTaskOperationButtonTypeEnum.PROCESS_START_CANCEL]: 'close-circle',
}
const optionalOperationTypes = [
  BpmTaskOperationButtonTypeEnum.COMMENT,
  BpmTaskOperationButtonTypeEnum.TRANSFER,
  BpmTaskOperationButtonTypeEnum.COPY,
  BpmTaskOperationButtonTypeEnum.DELEGATE,
  BpmTaskOperationButtonTypeEnum.ADD_SIGN,
  BpmTaskOperationButtonTypeEnum.RETURN,
] // 可选操作按钮（未配置时默认显示）

const toast = useToast()
const userStore = useUserStore()
const leftOperations = ref<LeftOperationType[]>([]) // 左侧操作按钮
const rightOperations = ref<RightOperationType[]>([]) // 右侧操作按钮
const moreOperations = ref<MoreOperationType[]>([]) // 更多操作
const runningTask = ref<Task>()
const processInstance = ref<ProcessInstance>()
const reasonRequire = ref<boolean>(false)
const commentVisible = ref(false) // 评论弹窗是否显示
const commentSubmitting = ref(false) // 评论提交中
const commentForm = reactive({ message: '' }) // 评论表单

/** 初始化 */
function init(theProcessInstance: ProcessInstance, task: Task) {
  resetOperations()
  processInstance.value = theProcessInstance
  runningTask.value = task
  if (task) {
    reasonRequire.value = task.reasonRequire ?? false

    // 处理中任务：右侧优先展示拒绝、通过，其他按钮进入左侧或更多操作
    if (isHandleTaskStatus()) {
      if (isShowButton(BpmTaskOperationButtonTypeEnum.REJECT)) {
        addRightOperation(BpmTaskOperationButtonTypeEnum.REJECT, 'danger', 'plain')
      }
      if (isShowButton(BpmTaskOperationButtonTypeEnum.APPROVE)) {
        addRightOperation(BpmTaskOperationButtonTypeEnum.APPROVE, 'primary', 'base')
      }
      // 遍历可选操作按钮，未配置 buttonsSetting 时默认显示
      optionalOperationTypes.forEach((operationType) => {
        if (isShowButton(operationType) && !isRightOperation(operationType)) {
          addLeftOrMoreOperation(operationType)
        }
      })
    }

    // 加签子任务支持减签
    if (isShowDeleteSign()) {
      addLeftOrMoreOperation(BpmTaskOperationButtonTypeEnum.DELETE_SIGN)
    }
  }

  // 发起人取消优先放右侧；右侧已满时进入左侧或更多操作
  if (isShowProcessStartCancel()) {
    if (rightOperations.value.length < 2) {
      addRightOperation(BpmTaskOperationButtonTypeEnum.PROCESS_START_CANCEL, 'primary', 'plain')
    } else {
      addLeftOrMoreOperation(BpmTaskOperationButtonTypeEnum.PROCESS_START_CANCEL)
    }
  }
}

/** 重置操作按钮 */
function resetOperations() {
  showMoreActions.value = false
  leftOperations.value = []
  rightOperations.value = []
  moreOperations.value = []
  reasonRequire.value = false
  commentVisible.value = false
  commentForm.message = ''
}

/** 添加右侧操作按钮 */
function addRightOperation(operationType: BpmTaskOperationButtonTypeEnum, btnType: ButtonType, variant: ButtonVariant) {
  if (isRightOperation(operationType)) {
    return
  }
  rightOperations.value.push({
    operationType,
    displayName: getButtonDisplayName(operationType),
    btnType,
    variant,
  })
}

/** 添加左侧或更多操作按钮 */
function addLeftOrMoreOperation(operationType: number) {
  if (leftOperations.value.length >= 2) {
    moreOperations.value.push({
      name: getButtonDisplayName(operationType),
      operationType,
    })
    return
  }

  leftOperations.value.push({
    operationType,
    iconName: operationIconsMap[operationType],
    displayName: getButtonDisplayName(operationType),
  })
}

/** 是否已在右侧按钮中 */
function isRightOperation(operationType: number) {
  return rightOperations.value.some(action => action.operationType === operationType)
}

/** 跳转到相应的操作页面 */
async function handleOperation(operationType: number) {
  switch (operationType) {
    case BpmTaskOperationButtonTypeEnum.APPROVE: {
      const variablesCacheKey = await saveNormalFormVariables()
      if (variablesCacheKey === undefined) {
        return
      }
      const variablesQuery = variablesCacheKey ? `&variablesCacheKey=${encodeURIComponent(variablesCacheKey)}` : ''
      uni.navigateTo({ url: `/pages-bpm/processInstance/detail/audit/index?processInstanceId=${processInstance.value.id}&taskId=${runningTask.value?.id}&pass=true${variablesQuery}` })
      break
    }
    case BpmTaskOperationButtonTypeEnum.REJECT:
      uni.navigateTo({ url: `/pages-bpm/processInstance/detail/audit/index?processInstanceId=${processInstance.value.id}&taskId=${runningTask.value?.id}&pass=false` })
      break
    case BpmTaskOperationButtonTypeEnum.COMMENT:
      openComment()
      break
    case BpmTaskOperationButtonTypeEnum.DELEGATE:
      uni.navigateTo({
        url: `/pages-bpm/processInstance/detail/reassign/index?processInstanceId=${runningTask.value.processInstanceId}&taskId=${runningTask.value.id}&type=delegate`,
      })
      break
    case BpmTaskOperationButtonTypeEnum.TRANSFER:
      uni.navigateTo({
        url: `/pages-bpm/processInstance/detail/reassign/index?processInstanceId=${runningTask.value.processInstanceId}&taskId=${runningTask.value.id}&type=transfer`,
      })
      break
    case BpmTaskOperationButtonTypeEnum.ADD_SIGN:
      uni.navigateTo({
        url: `/pages-bpm/processInstance/detail/add-sign/index?processInstanceId=${runningTask.value.processInstanceId}&taskId=${runningTask.value.id}`,
      })
      break
    case BpmTaskOperationButtonTypeEnum.RETURN:
      uni.navigateTo({
        url: `/pages-bpm/processInstance/detail/return/index?processInstanceId=${runningTask.value.processInstanceId}&taskId=${runningTask.value.id}`,
      })
      break
    case BpmTaskOperationButtonTypeEnum.COPY:
      uni.navigateTo({
        url: `/pages-bpm/processInstance/detail/copy/index?processInstanceId=${runningTask.value.processInstanceId}&taskId=${runningTask.value.id}`,
      })
      break
    case BpmTaskOperationButtonTypeEnum.DELETE_SIGN:
      uni.navigateTo({
        url: `/pages-bpm/processInstance/detail/delete-sign/index?processInstanceId=${runningTask.value.processInstanceId}&taskId=${runningTask.value.id}&children=${encodeURIComponent(JSON.stringify(runningTask.value.children || []))}`,
      })
      break
    case BpmTaskOperationButtonTypeEnum.PROCESS_START_CANCEL: {
      const taskIdQuery = runningTask.value?.id ? `&taskId=${runningTask.value.id}` : ''
      uni.navigateTo({
        url: `/pages-bpm/processInstance/detail/process-cancel/index?processInstanceId=${processInstance.value.id}${taskIdQuery}`,
      })
      break
    }
  }
}

/** 暂存流程表单中当前节点可编辑的变量，审批提交页会读取并提交 */
async function saveNormalFormVariables() {
  // 先校验流程表单，避免带着无效变量进入审批页
  const valid = await props.validateNormalForm?.()
  if (valid === false) {
    toast.show('表单校验不通过，请先完善表单')
    return undefined
  }

  const variables = props.getNormalFormVariables?.() || {}
  const cacheKey = getNormalFormVariablesCacheKey()
  if (Object.keys(variables).length === 0) {
    // 没有可编辑变量时清理旧缓存
    uni.removeStorageSync(cacheKey)
    return ''
  }

  // 审批页通过 cacheKey 读取变量并随审批请求提交
  uni.setStorageSync(cacheKey, variables)
  return cacheKey
}

/** 获取流程表单变量缓存键 */
function getNormalFormVariablesCacheKey() {
  return `bpm-normal-form-variables:${processInstance.value?.id || ''}:${runningTask.value?.id || ''}`
}

/** 显示更多操作 */
function handleShowMore() {
  showMoreActions.value = true
}

/** 处理更多操作选择 */
function handleMoreAction(action: { item: MoreOperationType }) {
  handleOperation(action.item.operationType)
  showMoreActions.value = false
}

/** 获取按钮的显示名称 */
function getButtonDisplayName(btnType: number) {
  let displayName = OPERATION_BUTTON_NAME.get(btnType)
  if (
    btnType !== BpmTaskOperationButtonTypeEnum.COMMENT
    && runningTask.value?.buttonsSetting
    && runningTask.value?.buttonsSetting[btnType]
  ) {
    displayName = runningTask.value.buttonsSetting[btnType].displayName
  }
  return displayName
}

/** 是否显示按钮 */
function isShowButton(btnType: number): boolean {
  if (btnType === BpmTaskOperationButtonTypeEnum.COMMENT) {
    return true
  }
  let isShow = true
  if (
    runningTask.value?.buttonsSetting
    && runningTask.value?.buttonsSetting[btnType]
  ) {
    isShow = runningTask.value.buttonsSetting[btnType].enable
  }
  return isShow
}

/** 任务是否为处理中状态 */
function isHandleTaskStatus() {
  let canHandle = false
  if (BpmTaskStatusEnum.RUNNING === runningTask.value?.status) {
    canHandle = true
  }
  return canHandle
}

/** 流程状态是否为结束状态 */
function isEndProcessStatus(status: number) {
  let isEndStatus = false
  if (
    BpmProcessInstanceStatus.APPROVE === status
    || BpmProcessInstanceStatus.REJECT === status
    || BpmProcessInstanceStatus.CANCEL === status
  ) {
    isEndStatus = true
  }
  return isEndStatus
}

/** 流程发起人是否为当前用户 */
function isProcessStartUser() {
  let isStartUser = false
  if (userStore.userInfo?.userId === processInstance.value?.startUser?.id) {
    isStartUser = true
  }
  return isStartUser
}

/** 是否显示减签 */
function isShowDeleteSign() {
  return runningTask.value?.children?.length > 0
}

/** 是否显示流程发起人取消 */
function isShowProcessStartCancel() {
  return isProcessStartUser() && !isEndProcessStatus(processInstance.value?.status)
}

/** 打开评论弹窗 */
function openComment() {
  commentForm.message = ''
  commentVisible.value = true
}

/** 关闭评论弹窗 */
function closeComment() {
  commentVisible.value = false
  commentForm.message = ''
}

/** 提交流程评论 */
async function handleCommentSubmit() {
  const content = commentForm.message.trim()
  if (!content) {
    toast.show('评论内容不能为空')
    return
  }
  if (!runningTask.value?.id) {
    toast.show('当前任务不存在')
    return
  }
  commentSubmitting.value = true
  try {
    await createComment(runningTask.value.id, content)
    toast.success('评论成功')
    closeComment()
    uni.$emit('bpm:processInstance:reload')
  } finally {
    commentSubmitting.value = false
  }
}

/** 暴露方法 */
defineExpose({ init })
</script>
