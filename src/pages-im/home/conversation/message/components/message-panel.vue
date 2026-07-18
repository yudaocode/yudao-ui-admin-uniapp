<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <!-- #ifndef MP-WEIXIN -->
    <wd-navbar
      :title="navbarTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    >
      <template #right>
        <view class="flex items-center gap-30rpx pr-8rpx">
          <wd-icon v-if="!isChannel && !isQuitGroupConversation" name="phone" size="40rpx" color="#333" @click="openCallMenu" />
          <wd-icon v-if="!isChannel" name="more" size="44rpx" color="#333" @click="openSetting" />
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <wd-navbar :title="navbarTitle" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-26rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon v-if="!isChannel" name="more" size="42rpx" color="#333" @click="openSetting" />
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->

    <!-- 私聊非好友提示 -->
    <view
      v-if="conversationType === ImConversationType.PRIVATE && friendLoaded && !isFriend"
      class="flex items-center gap-16rpx border-b border-b-[#eee] bg-[#fff8e8] px-24rpx py-18rpx"
    >
      <wd-icon name="exclamation-circle" size="32rpx" color="#d48806" />
      <text class="min-w-0 flex-1 text-26rpx text-[#8f5b00]">对方还不是你的朋友</text>
      <text class="text-26rpx text-[#576b95]" @click="openFriendApply">添加朋友</text>
    </view>

    <!-- 群聊置顶与通话横幅 -->
    <!-- #ifdef H5 -->
    <RtcGroupCallBanner
      v-if="conversationType === ImConversationType.GROUP && !isQuitGroupConversation"
      :group-id="targetId"
    />
    <!-- #endif -->
    <GroupPinnedMessage
      v-if="!firstPageLoading && conversationType === ImConversationType.GROUP"
      :group-id="targetId"
      :can-manage="canManageGroup"
      @locate="scrollToPinnedMessage"
    />
    <GroupRequestPending
      v-if="conversationType === ImConversationType.GROUP"
      :group-id="targetId"
      :can-manage="canManageGroup"
    />

    <!-- 消息列表 -->
    <z-paging
      ref="pagingRef"
      v-model="messageList"
      use-chat-record-mode
      :fixed="false"
      class="min-h-0 flex-1 bg-[#ededed]"
      :default-page-size="MESSAGE_CHAT_PAGE_SIZE"
      bg-color="#ededed"
      bottom-bg-color="#fff"
      :hide-empty-view="historyLoadFailed"
      empty-view-text="暂无消息"
      @query="queryList"
      @scroll="handleChatScroll"
      @cell-style-change="cellStyle = $event"
    >
      <view class="px-24rpx py-20rpx">
        <view
          v-for="(item, index) in messageList"
          :id="`msg-${item.id || item.clientMessageId || index}`"
          :key="item.id || item.clientMessageId || index"
          :style="cellStyle"
          :class="highlightMessageId === item.id ? 'rounded-12rpx bg-[#fff1a8]' : ''"
        >
          <MessageItem
            :message="item"
            :conversation-type="conversationType"
            :target-id="targetId"
            :self-user-id="userStore.userInfo.userId"
            :self-name="userStore.userInfo.nickname"
            :self-avatar="userStore.userInfo.avatar"
            :peer-name="pageTitle"
            :peer-avatar="privateFriend?.avatar"
            :group-members="groupMembers"
            :message-map="messageMap"
            :private-max-read-message-id="privateMaxReadMessageId"
            :show-time="shouldShowTime(index)"
            :select-mode="selectMode"
            :selected="selectedIdSet.has(messageKey(item))"
            @longpress="messageActionRef?.open($event)"
            @scroll-to-quote="scrollToQuote"
            @material-click="handleMaterialClick"
            @merge-click="handleMergeClick"
            @card-click="handleCardClick"
            @mention-click="handleAvatarClick"
            @rtc-redial="handleRtcRedial"
            @toggle-select="toggleSelect"
            @receipt="updateMessageReceipt"
            @retry="handleRetryMessage"
            @avatar-click="handleAvatarClick"
          />
        </view>
        <!-- 历史消息重试 -->
        <view v-if="historyLoadFailed" :style="cellStyle" class="py-24rpx text-center">
          <wd-button size="small" variant="plain" @click="loadOlderMessagesAfterClear">
            重新加载历史消息
          </wd-button>
        </view>
      </view>

      <!-- 输入区域 -->
      <template #bottom>
        <MessageInput
          v-if="!selectMode && !isChannel"
          v-model="draftContent"
          :conversation-type="conversationType"
          :target-id="targetId"
          :group-members="groupMembers"
          :self-user-id="userStore.userInfo.userId"
          :active="active"
          :reply-target="replyTarget"
          :reply-sender-name="replySenderName"
          :reply-recalled="replyRecalled"
          :disabled-tip="inputDisabledTip"
          @send="handleSend"
          @clear-reply="clearReplyTarget"
          @upload-start="handleUploadStart"
          @upload-progress="handleUploadProgress"
          @upload-complete="handleUploadComplete"
          @upload-failed="handleUploadFailed"
        />
        <MessageMultiSelectBar
          v-else-if="selectMode && !isChannel"
          :messages="messageList"
          @forward="openForward"
          @delete="confirmDelete"
        />
      </template>
    </z-paging>

    <!-- @ 提醒与新消息浮层 -->
    <view class="fixed bottom-190rpx right-24rpx z-20 flex flex-col items-end gap-16rpx">
      <view
        v-if="mentionPromptVisible"
        class="rounded-full bg-white px-24rpx py-14rpx text-25rpx text-[#fa5151] shadow-lg"
        @click="locateMentionMessage"
      >
        有人@我
      </view>
      <view
        v-if="newMessageCount > 0"
        class="rounded-full bg-white px-24rpx py-14rpx text-25rpx text-[#576b95] shadow-lg"
        @click="backToLatest"
      >
        {{ newMessageCount }} 条新消息
      </view>
    </view>

    <!-- 合并转发详情弹窗 -->
    <MessageMergeDetailDialog
      ref="mergeDetailDialogRef"
      :conversation-type="conversationType"
      :target-id="targetId"
      :open-group-card-preview="openGroupCardPreview"
    />

    <!-- 群名片资料 -->
    <GroupCardPreview ref="groupCardPreviewRef" />

    <!-- 消息转发弹窗 -->
    <MessageForwardDialog
      ref="forwardDialogRef"
      :conversation-type="conversationType"
      :target-id="targetId"
    />

    <!-- 通话方式菜单 -->
    <wd-action-sheet v-model="callActionVisible" :actions="callActions" @select="handleCallAction" />

    <!-- 消息操作菜单 -->
    <MessageActionSheet
      ref="messageActionRef"
      :conversation-type="conversationType"
      :target-id="targetId"
      :group-members="groupMembers"
      :recall-message="recall"
      @reply="handleReplyMessage"
      @forward="openForward"
      @enter-select="enterSelectMode"
      @delete="confirmDelete"
      @recalled="markMessageRecalled"
      @reload-group-members="refreshGroupMembers"
      @reload-group-state="refreshGroup"
    />

    <!-- 发起群通话成员选择 -->
    <GroupMemberPicker
      ref="callMemberPickerRef"
      v-model="callInviteUserIds"
      title="选择通话成员"
      :members="groupMembers"
      :hide-ids="[userStore.userInfo.userId]"
      @confirm="handleCallMemberConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MessageDO } from '@/pages-im/utils/db'
import type { Message } from '../../../types'
import type { QuoteMessage } from '@/pages-im/utils/message'
import type { GroupCardPreviewOptions } from '../../../composables/useMessageContentActions'
import type { UploadMessageData } from '../../../composables/useMessageSender'
import {
  buildQuoteFromMessage,
  parseRecallMessageId,
} from '@/pages-im/utils/message'
import { MESSAGE_CHAT_PAGE_SIZE } from '@/pages-im/utils/config'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getClientConversationId } from '@/pages-im/utils/db'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import {
  CommonStatusEnum,
  ImConversationType,
  ImFriendAddSource,
  ImMessageType,
  ImRtcCallMediaType,
} from '@/pages-im/utils/constants'
import { useImRtc } from '../../../composables/useImRtc'
import { useMessageMultiSelect } from '../../../composables/useMessageMultiSelect'
import { useMessageList } from '../../../composables/useMessageList'
import { useMessagePuller } from '../../../composables/useMessagePuller'
import { useMessageSender } from '../../../composables/useMessageSender'
import { useConversationContext } from '../../../composables/useConversationContext'
import { useMessageContentActions } from '../../../composables/useMessageContentActions'
import { useConversationStore } from '../../../store/conversationStore'
import { useMessageStore } from '../../../store/messageStore'
import MessageInput from './message-input.vue'
import GroupCardPreview from './group-card-preview.vue'
import GroupPinnedMessage from './group-pinned-message.vue'
import GroupRequestPending from './group-request-pending.vue'
import MessageActionSheet from './message-action-sheet.vue'
import MessageForwardDialog from './message-forward-dialog.vue'
import MessageItem from './message-item.vue'
import MessageMergeDetailDialog from './message-merge-detail-dialog.vue'
import MessageMultiSelectBar from './message-multi-select-bar.vue'
import RtcGroupCallBanner from './rtc-group-call-banner.vue'
import GroupMemberPicker from '../../../contact/group/components/group-member-picker.vue'

interface SendExtOptions {
  atUserIds?: number[] // 群聊 @ 的用户编号列表
  receipt?: boolean // 是否需要消息回执
  quote?: QuoteMessage // 异步媒体上传前固定的引用消息
  quoteCaptured?: boolean // 是否已经固定并消费引用消息
}

interface SendData {
  type: number // 消息类型
  payload: Record<string, any> // 消息内容对象
  options?: SendExtOptions // 额外选项
}

const props = defineProps<{
  conversationType: number // 会话类型
  targetId: number // 会话目标编号
  locateMessageId?: number // 定位消息编号
  mentionMessageId?: number // @ 消息编号
  active: boolean // 页面是否可见
}>()

const toast = useToast()
const dialog = useDialog()
const userStore = useUserStore()
const messageStore = useMessageStore()
const {
  convertGroupMessage,
  convertPrivateMessage,
} = useMessagePuller()
const pagingRef = ref<any>() // 分页组件引用
const messageActionRef = ref<InstanceType<typeof MessageActionSheet>>() // 消息操作菜单引用
const forwardDialogRef = ref<InstanceType<typeof MessageForwardDialog>>() // 消息转发弹窗引用
const groupCardPreviewRef = ref<InstanceType<typeof GroupCardPreview>>() // 群名片资料引用
const mergeDetailDialogRef = ref<InstanceType<typeof MessageMergeDetailDialog>>() // 合并消息详情引用
const cellStyle = ref<Record<string, string>>({ transform: 'scaleY(-1)' }) // 聊天记录模式单元格倒置样式
const callActionVisible = ref(false) // 通话方式菜单显示状态
const callMemberPickerRef = ref<InstanceType<typeof GroupMemberPicker>>() // 群通话成员选择器引用
const callInviteUserIds = ref<number[]>([]) // 群通话邀请成员编号
const callMediaType = ref<number>() // 待发起的群通话媒体类型
const callActions = [ // 通话方式菜单项
  { name: '语音通话', value: ImRtcCallMediaType.VOICE },
  { name: '视频通话', value: ImRtcCallMediaType.VIDEO },
]
const replyTarget = ref<QuoteMessage>() // 回复目标
const conversationStore = useConversationStore()
const {
  setConversationDraft,
  getConversationDraft,
} = conversationStore
const {
  removeMessageList,
} = messageStore
const {
  state: messageMultiSelectState,
  selectedIdSet,
  toggle: toggleSelect,
  enter: enterSelectMode,
  exit: exitSelectMode,
} = useMessageMultiSelect()
const selectMode = computed(() => messageMultiSelectState.active) // 消息多选模式
const chatVisible = computed(() => props.active) // 当前聊天页是否可见
const conversationClearPending = ref(false) // 隐藏期间是否收到清空记录事件
const draftContent = ref('') // 当前输入草稿
let draftTimer: ReturnType<typeof setTimeout> | undefined
const { start: startRtcCall } = useImRtc()

const conversationType = computed(() => props.conversationType) // 当前会话类型
const targetId = computed(() => props.targetId) // 当前会话目标
const {
  privateFriend,
  groupMembers,
  friendLoaded,
  pageTitle,
  navbarTitle,
  isFriend,
  isChannel,
  isQuitGroup: isQuitGroupConversation,
  canManageGroup,
  inputDisabledTip,
  getPageContext,
  isPageContextActive,
  activate: activateConversation,
  deactivate,
  refreshGroup,
  refreshGroupMembers,
} = useConversationContext({
  conversationType,
  targetId,
  active: chatVisible,
})

/** 打开群名片资料 */
function openGroupCardPreview(options: GroupCardPreviewOptions) {
  groupCardPreviewRef.value?.open(options)
}

const {
  handleMaterialClick,
  handleCardClick,
  handleAvatarClick,
} = useMessageContentActions({
  conversationType,
  targetId,
  openGroupCardPreview,
})
const privateMaxReadMessageId = computed(() => // 私聊对方已读位置
  conversationType.value === ImConversationType.PRIVATE
    ? messageStore.getPrivateReadMaxId(targetId.value) || undefined
    : undefined)
const currentCcid = computed(() => getClientConversationId(conversationType.value, targetId.value)) // 当前会话主键

/** 获取消息唯一标识 */
function messageKey(item: Message) {
  return item.clientMessageId
}

const {
  messageList,
  firstPageLoading,
  historyLoadFailed,
  highlightMessageId,
  isNearBottom,
  newMessageCount,
  mentionPromptVisible,
  queryList,
  loadOlderMessagesAfterClear,
  locateHistoryMessage,
  locateMentionMessage,
  handleChatScroll,
  backToLatest,
  shouldShowTime,
  addLatestMessage,
  addStoredMessage,
  replaceLocalMessage,
  isLocalMessageDeleted,
  markMessageRecalled,
  updateMessageReceipt,
  removeDeletedMessages,
  resetAfterConversationClear,
} = useMessageList({
  pagingRef,
  getPageContext,
  isPageContextActive,
  getLocateMessageId: () => props.locateMessageId,
  getMentionMessageId: () => props.mentionMessageId,
  convertGroupMessage,
  convertPrivateMessage,
  markRead,
  syncPrivateReadStatus: syncPrivateReadStatusForList,
})
const messageMap = computed(() => new Map(messageList.value
  .filter(message => !!message.id)
  .map(message => [message.id!, message]))) // 当前已加载消息索引
const replySenderName = computed(() => replyTarget.value ? getQuoteSenderName(replyTarget.value) : '') // 回复发送人名称
const replyRecalled = computed(() => !!replyTarget.value?.messageId
  && messageMap.value.get(replyTarget.value.messageId)?.type === ImMessageType.RECALL) // 回复目标是否已撤回

/** 打开消息转发弹窗 */
function openForward(messages: Message[], merge = false) {
  const activeConversation = conversationStore.activeConversation
  forwardDialogRef.value?.open({
    messages,
    mode: merge ? 'merge' : 'single',
    sourceConversation: activeConversation
      ? { ...activeConversation, name: pageTitle.value || activeConversation.name }
      : undefined,
  })
}
const {
  sendRaw,
  startUploadMessage,
  updateUploadProgress,
  completeUploadMessage,
  failUploadMessage,
  retryMessage,
  readActive,
  syncPrivateReadStatus,
  recall,
} = useMessageSender({
  conversationType,
  targetId,
  replyTarget,
  addLatestMessage,
  replaceLocalMessage,
  isLocalMessageDeleted,
  getSendDisabledTip: () => inputDisabledTip.value,
  clearReplyTarget,
})

/** 同步私聊读位置给消息列表首屏流程 */
async function syncPrivateReadStatusForList() {
  await syncPrivateReadStatus()
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/conversation/index')
}

/** 打开会话设置：群聊 → 群设置，私聊 → 好友资料 */
function openSetting() {
  if (isChannel.value) {
    return
  }
  if (conversationType.value === ImConversationType.GROUP) {
    uni.navigateTo({ url: `/pages-im/home/contact/group/detail/index?id=${targetId.value}` })
  } else if (friendLoaded.value && !isFriend.value) {
    openFriendApply()
  } else {
    uni.navigateTo({ url: `/pages-im/home/contact/friend/detail/index?friendUserId=${targetId.value}` })
  }
}

/** 打开添加好友页 */
function openFriendApply() {
  uni.navigateTo({
    url: `/pages-im/home/contact/friend/apply/index?toUserId=${targetId.value}&source=${ImFriendAddSource.SEARCH}`,
  })
}

/** 打开音视频通话菜单 */
function openCallMenu() {
  if (isQuitGroupConversation.value) {
    toast.show('你已退出群聊，无法发起通话')
    return
  }
  if (conversationType.value === ImConversationType.GROUP
    && !groupMembers.value.some(item => item.userId !== userStore.userInfo.userId
      && item.status !== CommonStatusEnum.DISABLE)) {
    toast.show('暂无可邀请成员')
    return
  }
  callActionVisible.value = true
}

/** 发起指定方式的通话 */
function handleCallAction({ item }: { item: { value: number } }) {
  if (conversationType.value === ImConversationType.GROUP) {
    callMediaType.value = item.value
    callInviteUserIds.value = []
    callMemberPickerRef.value?.open([])
    return
  }
  startCall(item.value, [targetId.value])
}

/** 发起音视频通话 */
async function startCall(mediaType: number, inviteeIds: number[]) {
  if (inviteeIds.length === 0) {
    toast.show('暂无可邀请成员')
    return
  }
  await startRtcCall({
    conversationType: conversationType.value,
    mediaType,
    groupId: conversationType.value === ImConversationType.GROUP ? targetId.value : undefined,
    inviteeIds,
  })
}

/** 选择成员后发起群通话 */
function handleCallMemberConfirm(inviteeIds: number[]) {
  if (callMediaType.value == null || inviteeIds.length === 0) {
    return
  }
  startCall(callMediaType.value, inviteeIds)
}

/** 定位置顶消息 */
async function scrollToPinnedMessage(messageId: number) {
  await locateHistoryMessage(messageId)
}

/** 获取引用发送人名称 */
function getQuoteSenderName(quote: QuoteMessage) {
  if (quote.senderId === userStore.userInfo.userId) {
    return '我'
  }
  if (conversationType.value === ImConversationType.GROUP) {
    const member = groupMembers.value.find(member => member.userId === quote.senderId)
    return member ? getMemberDisplayName(member) : `用户 ${quote.senderId}`
  }
  return quote.senderId === targetId.value ? pageTitle.value : `用户 ${quote.senderId}`
}

/** 滚动到引用消息 */
async function scrollToQuote(messageId: number) {
  if (!messageId) {
    return
  }
  if (!messageMap.value.has(messageId)) {
    toast.show('原消息不在视野')
    return
  }
  await nextTick()
  pagingRef.value?.scrollIntoViewById(`msg-${messageId}`, 0, true)
}

/** 清空回复目标 */
function clearReplyTarget() {
  replyTarget.value = undefined
}

/** 回复消息 */
function handleReplyMessage(item: Message) {
  replyTarget.value = buildQuoteFromMessage(item)
}

/** 点击合并转发：打开详情 */
function handleMergeClick(content: string) {
  mergeDetailDialogRef.value?.open(content)
}

/** 重拨私聊通话 */
function handleRtcRedial(mediaType: number) {
  if (conversationType.value !== ImConversationType.PRIVATE || !targetId.value) {
    return
  }
  startRtcCall({
    conversationType: ImConversationType.PRIVATE,
    mediaType,
    inviteeIds: [targetId.value],
  })
}

/** 删除选中消息（当前设备持久移除） */
async function confirmDelete(messages: Message[]) {
  if (messages.length === 0) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定删除选中的 ${messages.length} 条消息吗？` })
  } catch {
    return
  }
  const remainingCount = removeDeletedMessages(messages)
  await removeMessageList(currentCcid.value, messages)
  if (remainingCount === 0) {
    await loadOlderMessagesAfterClear()
  }
  exitSelectMode()
}

/** 标记已读 */
async function markRead(latest = messageList.value[0]) {
  await readActive(latest?.id || 0)
}

/** 输入区发送：转发给 sendRaw */
function handleSend(data: SendData) {
  if (inputDisabledTip.value) {
    toast.show(inputDisabledTip.value)
    return false
  }
  return sendRaw(data.type, data.payload, data.options)
}

/** 添加上传占位消息 */
function handleUploadStart(data: UploadMessageData, resolve: (accepted: boolean) => void) {
  resolve(startUploadMessage(data))
}

/** 更新上传进度 */
function handleUploadProgress(clientMessageId: string, progress: number) {
  updateUploadProgress(clientMessageId, progress)
}

/** 完成上传并发送消息 */
function handleUploadComplete(data: UploadMessageData) {
  void completeUploadMessage(data)
}

/** 标记上传失败 */
function handleUploadFailed(clientMessageId: string) {
  void failUploadMessage(clientMessageId)
}

/** 重试失败消息 */
function handleRetryMessage(item: Message) {
  if (inputDisabledTip.value) {
    toast.show(inputDisabledTip.value)
    return
  }
  void retryMessage(item)
}

/** 构造当前草稿 */
function buildDraft() {
  if (!draftContent.value && !replyTarget.value) {
    return undefined
  }
  return { html: '', plain: draftContent.value, reply: replyTarget.value }
}

/** 延迟保存输入与回复草稿 */
watch([draftContent, replyTarget], () => {
  if (draftTimer) {
    clearTimeout(draftTimer)
  }
  draftTimer = setTimeout(() => {
    setConversationDraft({ type: conversationType.value, targetId: targetId.value }, buildDraft())
  }, 250)
}, { deep: true })

/** 收到实时消息：属于当前会话且页面可见时追加气泡 */
function onIncoming(data: { message?: MessageDO }) {
  const message = data?.message
  if (!chatVisible.value || !message || message.clientConversationId !== currentCcid.value) {
    return
  }
  const payload = addStoredMessage(message)
  if (!payload) {
    return
  }
  if (isNearBottom.value) {
    markRead(payload)
  }
}

/** 重连后刷新当前会话的群通话与私聊回执状态 */
function onStateResync() {
  if (!chatVisible.value) {
    return
  }
  if (conversationType.value === ImConversationType.GROUP) {
    void refreshGroup()
  } else if (conversationType.value === ImConversationType.PRIVATE) {
    void syncPrivateReadStatus()
  }
}

/** 接收当前会话的实时状态事件 */
function onImEvent(data: { conversationType?: number, contentType?: number, payload?: any }) {
  if (!chatVisible.value || data.conversationType !== conversationType.value || !data.payload) {
    return
  }
  const payload = data.payload
  const eventTargetId = conversationType.value === ImConversationType.GROUP
    ? Number(payload.groupId)
    : conversationType.value === ImConversationType.CHANNEL
      ? Number(payload.channelId)
      : Number(payload.senderId === userStore.userInfo.userId ? payload.receiverId : payload.senderId)
  if (eventTargetId && eventTargetId !== targetId.value) {
    return
  }
  if (data.contentType === ImMessageType.RECALL) {
    const messageId = parseRecallMessageId(payload.content) || Number(payload.messageId)
    markMessageRecalled(messageId)
  } else if (data.contentType === ImMessageType.RECEIPT && conversationType.value === ImConversationType.PRIVATE) {
    return
  } else if (data.contentType === ImMessageType.RECEIPT) {
    updateMessageReceipt(
      Number(payload.messageId || payload.id),
      payload.readCount,
      payload.receiptStatus,
    )
  } else if (data.contentType && data.contentType >= ImMessageType.GROUP_CREATE && data.contentType <= ImMessageType.GROUP_BANNED) {
    refreshGroupMembers()
  } else if (data.contentType === ImMessageType.RTC_CALL_START || data.contentType === ImMessageType.RTC_CALL_END) {
    refreshGroup()
  }
}

/** 响应资料页清空当前聊天记录 */
function onConversationCleared(clientConversationId: string) {
  if (clientConversationId !== currentCcid.value) {
    return
  }
  draftContent.value = ''
  replyTarget.value = undefined
  conversationClearPending.value = !chatVisible.value
  resetAfterConversationClear(chatVisible.value)
}

/** 初始化 */
onMounted(() => {
  uni.$on('im:message', onIncoming)
  uni.$on('im:event', onImEvent)
  uni.$on('im:conversation-cleared', onConversationCleared)
  uni.$on('im:state:resync', onStateResync)
  const draft = getConversationDraft({ type: conversationType.value, targetId: targetId.value })
  draftContent.value = draft?.plain || ''
  replyTarget.value = draft?.reply
})

/** 激活聊天面板 */
async function activate() {
  const context = getPageContext()
  await activateConversation()
  if (!isPageContextActive(context)) {
    return
  }
  if (conversationClearPending.value) {
    conversationClearPending.value = false
    pagingRef.value?.reload()
  }
}

/** 响应页面可见状态 */
watch(() => props.active, (active) => {
  if (active) {
    void activate()
  } else {
    deactivate()
  }
}, { immediate: true, flush: 'sync' })

/** 卸载 */
onUnmounted(() => {
  deactivate()
  uni.$off('im:message', onIncoming)
  uni.$off('im:event', onImEvent)
  uni.$off('im:conversation-cleared', onConversationCleared)
  uni.$off('im:state:resync', onStateResync)
  if (draftTimer) {
    clearTimeout(draftTimer)
  }
  void setConversationDraft(
    { type: conversationType.value, targetId: targetId.value },
    buildDraft(),
  ).catch(() => undefined)
})
</script>
