<template>
  <!-- 遍历每个审批节点 -->
  <view
    v-for="(activity, index) in activityNodes"
    :key="activity.id || index"
    class="relative pb-24rpx pl-80rpx"
  >
    <!-- 时间线圆点 -->
    <view
      class="absolute left-12rpx top-8rpx h-52rpx w-52rpx flex items-center justify-center rounded-full bg-blue-500"
    >
      <!-- 节点类型图标 -->
      <wd-icon
        :name="getApprovalNodeTypeIcon(activity.nodeType)"
        size="32rpx"
        color="white"
      />
    </view>

    <!-- 状态小图标 -->
    <view
      v-if="showStatusIcon && statusIconNodeTypes.includes(activity.nodeType)"
      class="absolute left-48rpx top-44rpx h-16rpx w-16rpx flex items-center justify-center border-2 border-white rounded-full"
      :style="{ backgroundColor: getApprovalNodeColor(activity.status) }"
    >
      <wd-icon
        :name="getApprovalNodeIcon(activity.status, activity.nodeType)"
        size="12rpx"
        color="white"
      />
    </view>

    <!-- 连接线 -->
    <view
      v-if="index < activityNodes.length - 1"
      class="absolute bottom-0 left-38rpx top-64rpx w-2rpx bg-[#e5e5e5]"
    />

    <!-- 节点内容 -->
    <view class="ml-8rpx">
      <!-- 第一行：节点名称、时间 -->
      <view class="mb-8rpx flex items-center justify-between">
        <view class="flex items-center">
          <text class="text-28rpx text-[#333] font-bold">{{ activity.name }}</text>
          <text v-if="activity.status === BpmTaskStatusEnum.SKIP" class="ml-8rpx text-24rpx text-[#999]">
            【跳过】
          </text>
        </view>
        <text
          v-if="activity.status !== BpmTaskStatusEnum.NOT_START && getApprovalNodeTime(activity)"
          class="text-22rpx text-[#999]"
        >
          {{ getApprovalNodeTime(activity) }}
        </text>
      </view>

      <!-- 子流程节点 -->
      <view v-if="activity.nodeType === BpmNodeTypeEnum.CHILD_PROCESS_NODE" class="mb-16rpx">
        <wd-button
          type="primary"
          variant="plain"
          size="small"
          :disabled="!activity.processInstanceId"
          @click="handleChildProcess(activity)"
        >
          查看子流程
        </wd-button>
      </view>

      <!-- 需要自定义选择审批人 -->
      <view v-if="shouldShowCustomUserSelect(activity)" class="mb-16rpx">
        <view class="flex flex-wrap items-center">
          <!-- 添加用户按钮 -->
          <view
            class="mb-8rpx mr-16rpx h-48rpx w-48rpx flex items-center justify-center border-indigo-500 rounded-lg border-solid"
            @click="openCustomUserPicker(activity.id)"
          >
            <wd-icon name="user-add" size="32rpx" color="blue" />
          </view>
          <!-- 已选择的用户 -->
          <view
            v-for="(user, userIndex) in customApproveUsers[activity.id]"
            :key="user.id || userIndex"
            class="mb-8rpx mr-16rpx flex items-center rounded-32rpx bg-[#f5f5f5] pr-16rpx"
          >
            <view class="mr-8rpx h-48rpx w-48rpx flex items-center justify-center overflow-hidden rounded-full bg-[#1890ff] text-24rpx text-white">
              <wd-img
                v-if="shouldShowAvatar(user)"
                :src="user.avatar"
                width="48rpx"
                height="48rpx"
                mode="aspectFill"
                round
                @error="handleAvatarError(user)"
              />
              <text v-else>{{ getUserInitial(user) }}</text>
            </view>
            <text class="text-24rpx text-[#333]">{{ user.nickname }}</text>
          </view>
        </view>
      </view>

      <!-- 审批人员列表 -->
      <view v-else class="mb-16rpx">
        <!-- 情况一：遍历每个审批节点下的【进行中】task 任务 -->
        <view v-if="activity.tasks && activity.tasks.length > 0">
          <view
            v-for="(task, taskIndex) in activity.tasks"
            :key="taskIndex"
            class="mb-16rpx"
          >
            <!-- 审批人信息 -->
            <view v-if="task.assigneeUser || task.ownerUser" class="mb-8rpx flex items-center">
              <view class="relative mr-8rpx h-48rpx w-48rpx">
                <view class="h-48rpx w-48rpx flex items-center justify-center overflow-hidden rounded-full bg-[#1890ff] text-24rpx text-white">
                  <wd-img
                    v-if="shouldShowAvatar(getTaskUser(task))"
                    :src="getTaskUser(task)?.avatar"
                    width="48rpx"
                    height="48rpx"
                    mode="aspectFill"
                    round
                    @error="handleAvatarError(getTaskUser(task))"
                  />
                  <text v-else>{{ getUserInitial(getTaskUser(task)) }}</text>
                </view>

                <!-- 任务状态小图标 -->
                <view
                  v-if="showStatusIcon && shouldShowTaskStatusIcon(task.status)"
                  class="absolute right--4rpx top-36rpx h-16rpx w-16rpx flex items-center justify-center border-2 border-white rounded-full"
                  :style="{ backgroundColor: getApprovalNodeColor(task.status) }"
                >
                  <wd-icon
                    :name="getApprovalNodeIcon(task.status, activity.nodeType)"
                    size="12rpx"
                    color="white"
                  />
                </view>
              </view>

              <view class="flex-1">
                <view class="flex items-center justify-between">
                  <view class="flex items-center">
                    <text class="text-26rpx text-[#333]">
                      {{ task.assigneeUser?.nickname || task.ownerUser?.nickname }}
                    </text>
                    <text
                      v-if="task.assigneeUser?.deptName || task.ownerUser?.deptName"
                      class="ml-8rpx text-22rpx text-[#999]"
                    >
                      {{ task.assigneeUser?.deptName || task.ownerUser?.deptName }}
                    </text>
                  </view>
                </view>
                <view class="mt-4rpx flex items-center">
                  <text :class="getStatusTextClass(task.status)" class="text-24rpx">
                    {{ getStatusText(task.status) }}
                  </text>
                </view>
              </view>
            </view>

            <!-- 审批意见 -->
            <view
              v-if="shouldShowTaskEvidence(task, activity.nodeType, index)"
              class="mt-8rpx rounded-8rpx bg-[#f5f5f5] p-16rpx"
            >
              <view v-if="task.reason">
                <text class="text-24rpx text-[#666]">
                  {{ getTaskEvidenceReasonLabel(activity.nodeType) }}：{{ task.reason }}
                </text>
              </view>
              <view v-if="task.attachments?.length" class="mt-12rpx flex flex-wrap gap-12rpx">
                <view
                  v-for="attachment in task.attachments"
                  :key="attachment"
                  class="flex items-center"
                  @click="openAttachment(attachment)"
                >
                  <wd-img
                    v-if="isImageFile(attachment)"
                    :src="attachment"
                    width="88rpx"
                    height="88rpx"
                    mode="aspectFill"
                    radius="8rpx"
                  />
                  <view v-else class="max-w-520rpx flex items-center rounded-8rpx bg-white px-12rpx py-8rpx">
                    <wd-icon name="file" size="28rpx" color="#666" />
                    <text class="ml-8rpx truncate text-24rpx text-[#666]">
                      {{ getFileNameFromUrl(attachment) }}
                    </text>
                  </view>
                </view>
              </view>
              <view
                v-if="shouldShowTaskSignature(task, activity.nodeType)"
                class="mt-12rpx flex items-center"
              >
                <text class="text-24rpx text-[#666]">签名：</text>
                <wd-img
                  :src="task.signPicUrl"
                  width="288rpx"
                  height="96rpx"
                  mode="aspectFit"
                  radius="8rpx"
                  class="ml-8rpx bg-white"
                  enable-preview
                />
              </view>
            </view>
          </view>
        </view>

        <!-- 情况二：遍历每个审批节点下的【候选的】task 任务 -->
        <view v-if="activity.candidateUsers && activity.candidateUsers.length > 0">
          <view
            v-for="(user, userIndex) in activity.candidateUsers"
            :key="userIndex"
            class="mb-8rpx flex items-center"
          >
            <view class="relative mr-8rpx h-48rpx w-48rpx">
              <view class="h-48rpx w-48rpx flex items-center justify-center overflow-hidden rounded-full bg-[#1890ff] text-24rpx text-white">
                <wd-img
                  v-if="shouldShowAvatar(user)"
                  :src="user.avatar"
                  width="48rpx"
                  height="48rpx"
                  mode="aspectFill"
                  round
                  @error="handleAvatarError(user)"
                />
                <text v-else>{{ getUserInitial(user) }}</text>
              </view>

              <!-- 候选状态图标 -->
              <view
                v-if="showStatusIcon"
                class="absolute right--4rpx top-36rpx h-16rpx w-16rpx flex items-center justify-center border-2 border-white rounded-full"
                :style="{ backgroundColor: getApprovalNodeColor(BpmTaskStatusEnum.NOT_START) }"
              >
                <wd-icon name="clock-circle" size="12rpx" color="white" />
              </view>
            </view>

            <view class="flex-1">
              <text class="text-26rpx text-[#333]">{{ user.nickname }}</text>
              <text v-if="user.deptName" class="ml-8rpx text-22rpx text-[#999]">
                {{ user.deptName }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>

  <!-- 自定义审批人选择 -->
  <UserPicker
    ref="userPickerRef"
    v-model="selectedUserIds"
    title="选择用户"
    type="checkbox"
    @confirm="handleCustomUserConfirm"
  />
</template>

<script lang="ts" setup>
import type { ApprovalNodeInfo, ApprovalTaskInfo, User } from '@/api/bpm/processInstance'
import type { User as SystemUser } from '@/api/system/user'
import { nextTick, ref } from 'vue'
import { UserPicker } from '@/components/system-select'
import { BpmCandidateStrategyEnum, BpmNodeTypeEnum, BpmTaskStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { getFileNameFromUrl, isImageFile, openAttachment } from '@/utils/download'
import { isEmptyValue } from '@/utils/is'

const props = withDefaults(
  defineProps<{
    activityNodes: ApprovalNodeInfo[]
    enableApproveUserSelect?: boolean
    showStatusIcon?: boolean
  }>(),
  {
    showStatusIcon: true,
    enableApproveUserSelect: false,
  },
)

const emit = defineEmits<{
  selectUserConfirm: [activityId: string, userList: any[]]
}>()

// 状态图标映射
const statusIconMap: Record<string, { color: string, icon: string }> = {
  '-2': { color: '#909398', icon: 'skip-next' }, // 跳过
  '-1': { color: '#909398', icon: 'clock-circle' }, // 审批未开始
  '0': { color: '#f59e0b', icon: 'clock-circle' }, // 待审批
  '1': { color: '#f59e0b', icon: 'sync' }, // 审批中
  '2': { color: '#00b32a', icon: 'check' }, // 审批通过
  '3': { color: '#f46b6c', icon: 'close' }, // 审批不通过
  '4': { color: '#cccccc', icon: 'delete' }, // 已取消
  '5': { color: '#f46b6c', icon: 'arrow-left' }, // 退回
  '6': { color: '#448ef7', icon: 'clock-circle' }, // 委派中
  '7': { color: '#00b32a', icon: 'check' }, // 审批通过中
}

// 节点类型图标映射
const nodeTypeSvgMap: Record<number, { color: string, icon: string }> = {
  [BpmNodeTypeEnum.END_EVENT_NODE]: { color: '#909398', icon: 'poweroff' },
  [BpmNodeTypeEnum.START_USER_NODE]: { color: '#909398', icon: 'user' },
  [BpmNodeTypeEnum.USER_TASK_NODE]: { color: '#ff943e', icon: 'user' },
  [BpmNodeTypeEnum.TRANSACTOR_NODE]: { color: '#ff943e', icon: 'edit' },
  [BpmNodeTypeEnum.COPY_TASK_NODE]: { color: '#3296fb', icon: 'copy' },
  [BpmNodeTypeEnum.DELAY_TIMER_NODE]: { color: '#448ef7', icon: 'clock-circle' },
  [BpmNodeTypeEnum.TRIGGER_NODE]: { color: '#9b7feb', icon: 'thunderbolt' },
  [BpmNodeTypeEnum.CONDITION_NODE]: { color: '#14bb83', icon: 'filter' },
  [BpmNodeTypeEnum.CONDITION_BRANCH_NODE]: { color: '#14bb83', icon: 'branch' },
  [BpmNodeTypeEnum.PARALLEL_BRANCH_NODE]: { color: '#14bb83', icon: 'branch' },
  [BpmNodeTypeEnum.INCLUSIVE_BRANCH_NODE]: { color: '#14bb83', icon: 'branch' },
  [BpmNodeTypeEnum.ROUTER_BRANCH_NODE]: { color: '#14bb83', icon: 'share-alt' },
  [BpmNodeTypeEnum.CHILD_PROCESS_NODE]: { color: '#14bb83', icon: 'organization' },
}

const onlyStatusIconShow = [BpmTaskStatusEnum.NOT_START, BpmTaskStatusEnum.RUNNING, BpmTaskStatusEnum.WAIT] // 只有状态是 -1、0、1 才展示头像右小角状态小 icon
const statusIconNodeTypes = [
  BpmNodeTypeEnum.START_USER_NODE,
  BpmNodeTypeEnum.USER_TASK_NODE,
  BpmNodeTypeEnum.TRANSACTOR_NODE,
  BpmNodeTypeEnum.CHILD_PROCESS_NODE,
  BpmNodeTypeEnum.END_EVENT_NODE,
] // 仅这些节点类型展示状态 icon，分支/条件等节点不展示

// 响应式数据
const customApproveUsers = ref<Record<string, any[]>>({})
const failedAvatarKeys = ref<Set<string>>(new Set())
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 用户选择器
const selectedUserIds = ref<number[]>([]) // 当前选择的用户编号
const currentActivityId = ref<string>() // 当前审批节点编号

/** 获取审批节点类型图标 */
function getApprovalNodeTypeIcon(nodeType: number) {
  return nodeTypeSvgMap[nodeType]?.icon || 'clock-circle'
}

/** 获取审批节点图标 */
function getApprovalNodeIcon(taskStatus: number, nodeType: number) {
  if (taskStatus === BpmTaskStatusEnum.NOT_START) {
    return statusIconMap[taskStatus]?.icon || 'clock-circle'
  }
  // 仅任务类节点（发起人/审批人/办理人/子流程/结束）展示状态图标，分支/条件等节点不展示
  if (statusIconNodeTypes.includes(nodeType)) {
    return statusIconMap[taskStatus]?.icon || 'clock-circle'
  }
  return ''
}

/** 获取审批节点颜色 */
function getApprovalNodeColor(taskStatus: number) {
  return statusIconMap[taskStatus]?.color || '#909398'
}

/** 获取审批节点时间 */
function getApprovalNodeTime(node: ApprovalNodeInfo) {
  if (node.nodeType === BpmNodeTypeEnum.START_USER_NODE && node.startTime) {
    return formatDateTime(node.startTime)
  }
  if (node.endTime) {
    return formatDateTime(node.endTime)
  }
  if (node.startTime) {
    return formatDateTime(node.startTime)
  }
  return ''
}

/** 获取任务处理人 */
function getTaskUser(task: ApprovalTaskInfo) {
  return task.assigneeUser || task.ownerUser
}

/** 获取用户头像兜底文字 */
function getUserInitial(user?: Partial<User>) {
  return user?.nickname?.[0] || '?'
}

/** 是否显示用户头像 */
function shouldShowAvatar(user?: Partial<User>) {
  return !!user?.avatar && !failedAvatarKeys.value.has(getUserAvatarKey(user))
}

/** 标记头像加载失败 */
function handleAvatarError(user?: Partial<User>) {
  if (!user?.avatar) {
    return
  }
  const nextKeys = new Set(failedAvatarKeys.value)
  nextKeys.add(getUserAvatarKey(user))
  failedAvatarKeys.value = nextKeys
}

/** 获取用户头像缓存键 */
function getUserAvatarKey(user?: Partial<User>) {
  return `${user?.id || ''}:${user?.avatar || ''}`
}

/** 是否显示任务状态图标 */
function shouldShowTaskStatusIcon(status: number) {
  return onlyStatusIconShow.includes(status)
}

/** 判断是否需要显示自定义选择审批人 */
function shouldShowCustomUserSelect(activity: ApprovalNodeInfo) {
  // 已有任务时不再显示候选人选择
  return (
    isEmptyValue(activity.tasks)
    && ((BpmCandidateStrategyEnum.START_USER_SELECT === activity.candidateStrategy
      && isEmptyValue(activity.candidateUsers))
    || (props.enableApproveUserSelect
      && BpmCandidateStrategyEnum.APPROVE_USER_SELECT === activity.candidateStrategy
      && isEmptyValue(activity.candidateUsers)))
  )
}

/** 判断是否需要显示审批意见、附件和签名 */
function shouldShowTaskEvidence(task: ApprovalTaskInfo, nodeType: number, nodeIndex: number) {
  // 第一个发起人节点是系统自动通过的，不展示审批意见
  if (nodeType === BpmNodeTypeEnum.START_USER_NODE && nodeIndex === 0) {
    return false
  }
  return (
    Boolean(task.reason || task.attachments?.length || task.signPicUrl)
    && [
      BpmNodeTypeEnum.START_USER_NODE,
      BpmNodeTypeEnum.USER_TASK_NODE,
      BpmNodeTypeEnum.TRANSACTOR_NODE,
    ].includes(nodeType)
  )
}

/** 判断是否需要显示任务签名 */
function shouldShowTaskSignature(task: ApprovalTaskInfo, nodeType: number) {
  return !!task.signPicUrl
    && [BpmNodeTypeEnum.USER_TASK_NODE, BpmNodeTypeEnum.TRANSACTOR_NODE].includes(nodeType)
}

/** 获取任务留痕意见标题 */
function getTaskEvidenceReasonLabel(nodeType: number) {
  return nodeType === BpmNodeTypeEnum.TRANSACTOR_NODE ? '办理意见' : '审批意见'
}

/** 获取状态文本样式类 */
function getStatusTextClass(status: number) {
  const colorMap: Record<number, string> = {
    [BpmTaskStatusEnum.RUNNING]: 'text-[#ff943e]',
    [BpmTaskStatusEnum.APPROVE]: 'text-[#00b32a]',
    [BpmTaskStatusEnum.REJECT]: 'text-[#f46b6c]',
    [BpmTaskStatusEnum.CANCEL]: 'text-[#cccccc]',
    [BpmTaskStatusEnum.RETURN]: 'text-[#f46b6c]',
  }
  return colorMap[status] || 'text-[#666]'
}

/** 获取状态文本 */
function getStatusText(status: number) {
  const textMap: Record<number, string> = {
    [BpmTaskStatusEnum.NOT_START]: '未开始',
    [BpmTaskStatusEnum.RUNNING]: '待审批',
    [BpmTaskStatusEnum.APPROVE]: '已通过',
    [BpmTaskStatusEnum.REJECT]: '已拒绝',
    [BpmTaskStatusEnum.CANCEL]: '已取消',
    [BpmTaskStatusEnum.RETURN]: '已退回',
    [BpmTaskStatusEnum.SKIP]: '已跳过',
  }
  return textMap[status] || '未知'
}

/** 打开自定义审批人选择 */
async function openCustomUserPicker(activityId: string) {
  currentActivityId.value = activityId
  selectedUserIds.value = getSelectedUserIds(activityId)
  await nextTick()
  userPickerRef.value?.open()
}

/** 确认自定义审批人 */
function handleCustomUserConfirm(users: SystemUser[]) {
  if (!currentActivityId.value) {
    return
  }
  handleCustomUserSelectConfirm(currentActivityId.value, users)
}

/** 同步自定义审批人 */
function handleCustomUserSelectConfirm(activityId: string, users: SystemUser[]) {
  // 同步本地展示，并通知审批页提交下一节点审批人
  customApproveUsers.value[activityId] = users || []
  emit('selectUserConfirm', activityId, users)
}

/** 获取选中的用户ID数组 */
function getSelectedUserIds(activityId: string): number[] {
  const users = customApproveUsers.value[activityId] || []
  return users.map(user => user.id).filter(id => id !== undefined)
}

/** 跳转子流程 */
function handleChildProcess(activity: ApprovalNodeInfo) {
  if (!activity.processInstanceId) {
    return
  }
  uni.navigateTo({
    url: `/pages-bpm/processInstance/detail/index?id=${activity.processInstanceId}`,
  })
}

/** 设置自定义审批人 */
function setCustomApproveUsers(activityId: string, users: any[]) {
  customApproveUsers.value[activityId] = users || []
}

/** 批量设置多个节点的自定义审批人 */
function batchSetCustomApproveUsers(data: Record<string, any[]>) {
  // 审批表单变量变化后，父组件会重新下发下一节点审批人
  Object.keys(data).forEach((activityId) => {
    customApproveUsers.value[activityId] = data[activityId] || []
  })
}

// 暴露给父组件同步下一节点审批人
defineExpose({
  setCustomApproveUsers,
  batchSetCustomApproveUsers,
})
</script>
