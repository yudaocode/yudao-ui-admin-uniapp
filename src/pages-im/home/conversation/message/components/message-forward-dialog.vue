<template>
  <ForwardPicker
    v-model="visible"
    allow-create-group
    @confirm="handleConfirm"
    @create-group="createGroupAndForward"
  >
    <template #footer>
      <view class="shrink-0 border-t border-t-[#e5e7eb] bg-white px-24rpx pb-[calc(16rpx+env(safe-area-inset-bottom))] pt-16rpx">
        <view class="line-clamp-2 mb-12rpx text-24rpx text-[#999] leading-34rpx">
          {{ forwardPreview }}
        </view>
        <view class="flex items-center gap-12rpx rounded-12rpx bg-[#f5f6f7] px-20rpx py-16rpx">
          <wd-icon name="edit" size="30rpx" color="#9ca3af" />
          <wd-input
            v-model="leaveMessage"
            custom-class="min-w-0 flex-1"
            :maxlength="100"
            placeholder="给朋友留言（选填）"
            compact
            clearable
          />
          <wd-icon name="face-smile-fill" size="34rpx" color="#576b95" @click="emojiVisible = true" />
        </view>
      </view>
    </template>
  </ForwardPicker>
  <FacePicker v-model="emojiVisible" mode="emoji" @select-emoji="handleEmoji" />
</template>

<script lang="ts" setup>
import type { ConversationDO } from '@/pages-im/utils/db'
import type { Message } from '../../../types'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getClientConversationId } from '@/pages-im/utils/db'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import {
  buildMergeMessagePayload,
  removeQuotePayload,
  serializeMessage,
} from '@/pages-im/utils/message'
import { ImConversationType, ImMessageType } from '@/pages-im/utils/constants'
import { useUserStore } from '@/store/user'
import { useConversationStore } from '../../../store/conversationStore'
import { sendMessageToConversation } from '../../../composables/useMessageSender'
import { useMessageMultiSelect } from '../../../composables/useMessageMultiSelect'
import FacePicker from './face-picker.vue'
import ForwardPicker from './forward-picker.vue'

type MessageForwardMode = 'single' | 'merge'

interface MessageForwardDialogOpenOptions {
  messages: Message[] // 待转发消息
  mode: MessageForwardMode // 转发方式
  sourceConversation?: ConversationDO // 来源会话快照
}

const props = defineProps<{
  conversationType: number // 当前会话类型
  targetId: number // 当前会话目标编号
}>()

const toast = useToast()
const userStore = useUserStore()
const conversationStore = useConversationStore()
const { exit: exitSelectMode } = useMessageMultiSelect()
const visible = ref(false) // 转发弹窗
const emojiVisible = ref(false) // 留言表情面板
const messages = ref<Message[]>([]) // 待转发消息
const mode = ref<MessageForwardMode>('single') // 转发方式
const leaveMessage = ref('') // 转发留言
const sending = ref(false) // 是否正在发送
const creatingGroup = ref(false) // 是否正在新建群聊后续转
let taskUserId = 0 // 转发任务所属用户
let taskConversationType = 0 // 来源会话类型快照
let taskTargetId = 0 // 来源会话目标快照
let sourceConversation: ConversationDO | undefined // 来源会话快照

const forwardPreview = computed(() => { // 待转发内容预览
  if (messages.value.length === 0) {
    return ''
  }
  if (mode.value === 'merge') {
    return `合并转发：共 ${messages.value.length} 条消息`
  }
  const summaries = messages.value
    .slice(0, 2)
    .map(message => getMessageSummary(message.type, message.content))
  return messages.value.length > summaries.length
    ? `待转发：${summaries.join('、')} 等 ${messages.value.length} 条消息`
    : `待转发：${summaries.join('、')}`
})

/** 当前转发任务是否仍有效 */
function isTaskActive() {
  return taskUserId > 0
    && taskUserId === userStore.userInfo.userId
    && taskConversationType === props.conversationType
    && taskTargetId === props.targetId
}

/** 清理转发任务 */
function reset() {
  visible.value = false
  emojiVisible.value = false
  messages.value = []
  mode.value = 'single'
  leaveMessage.value = ''
  sending.value = false
  creatingGroup.value = false
  taskUserId = 0
  taskConversationType = 0
  taskTargetId = 0
  sourceConversation = undefined
}

/** 打开转发弹窗 */
function open(options: MessageForwardDialogOpenOptions) {
  if (sending.value || options.messages.length === 0) {
    return
  }
  messages.value = [...options.messages]
  mode.value = options.mode
  leaveMessage.value = ''
  creatingGroup.value = false
  taskUserId = userStore.userInfo.userId
  taskConversationType = props.conversationType
  taskTargetId = props.targetId
  sourceConversation = options.sourceConversation ? { ...options.sourceConversation } : undefined
  visible.value = true
}

/** 插入转发留言表情 */
function handleEmoji(value: string) {
  if (leaveMessage.value.length + value.length <= 100) {
    leaveMessage.value += value
  }
}

/** 发送一条转发消息 */
function sendForwardMessage(target: ConversationDO, type: number, content: string) {
  return sendMessageToConversation(target, type, content, {}, taskUserId)
}

/** 给单个目标发送合并或逐条转发消息 */
async function forwardToTarget(target: ConversationDO) {
  let success = true
  if (mode.value === 'merge') {
    if (!sourceConversation) {
      return false
    }
    const payload = buildMergeMessagePayload(messages.value, sourceConversation)
    success = await sendForwardMessage(target, ImMessageType.MERGE, serializeMessage(payload))
  } else {
    for (const message of messages.value) {
      success = await sendForwardMessage(target, message.type, removeQuotePayload(message.content))
      if (!success) {
        break
      }
    }
  }
  if (!success) {
    return false
  }
  const leaveText = leaveMessage.value.trim()
  return leaveText
    ? sendForwardMessage(target, ImMessageType.TEXT, leaveText)
    : true
}

/** 确认转发到目标会话 */
async function handleConfirm(targets: ConversationDO[]) {
  if (!isTaskActive() || sending.value) {
    return
  }
  sending.value = true
  const results: Array<{ target: ConversationDO, success: boolean }> = []
  for (const target of targets) {
    if (!isTaskActive()) {
      sending.value = false
      return
    }
    try {
      results.push({ target, success: await forwardToTarget(target) })
    } catch {
      results.push({ target, success: false })
    }
  }
  await conversationStore.pushRecentForwardConversationKeyList(
    targets.map(item => item.clientConversationId),
    taskUserId,
  )
  if (!isTaskActive()) {
    sending.value = false
    return
  }
  const failedNames = results
    .filter(item => !item.success)
    .map(item => item.target.name || '未命名会话')
  if (failedNames.length === 0) {
    toast.success('已转发')
  } else if (failedNames.length === targets.length) {
    toast.error(`转发失败：${failedNames.join('、')}`)
  } else {
    toast.warning(`已转发，但 ${failedNames.join('、')} 失败`)
  }
  exitSelectMode()
  reset()
}

/** 打开新建群聊页，创建成功后继续转发 */
function createGroupAndForward() {
  if (!isTaskActive()) {
    return
  }
  creatingGroup.value = true
  leaveMessage.value = ''
  uni.navigateTo({
    url: '/pages-im/home/contact/group/form/index',
    events: {
      created: onGroupCreated,
    },
  })
}

/** 接收新建群聊结果并完成转发 */
async function onGroupCreated(groupInfo: { id: number, name?: string, avatar?: string }) {
  creatingGroup.value = false
  if (!groupInfo?.id || messages.value.length === 0 || !isTaskActive()) {
    return
  }
  await handleConfirm([{
    clientConversationId: getClientConversationId(ImConversationType.GROUP, groupInfo.id),
    type: ImConversationType.GROUP,
    targetId: groupInfo.id,
    name: groupInfo.name || '新群聊',
    avatar: groupInfo.avatar || '',
    unreadCount: 0,
    lastContent: '',
    lastSendTime: 0,
  }])
}

/** 用户关闭弹窗时取消当前任务 */
watch(visible, (value) => {
  if (!value && !creatingGroup.value && !sending.value && messages.value.length > 0) {
    reset()
  }
})

/** 卸载时取消当前任务 */
onUnmounted(reset)

defineExpose({ open })
</script>
