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
      <wd-icon name="warning" size="32rpx" color="#d48806" />
      <text class="min-w-0 flex-1 text-26rpx text-[#8f5b00]">对方还不是你的朋友</text>
      <text class="text-26rpx text-[#576b95]" @click="openFriendApply">添加朋友</text>
    </view>

    <!-- 群聊置顶与通话横幅 -->
    <!-- #ifdef H5 -->
    <RtcGroupCallBanner v-if="activeGroupCall" @join="joinActiveGroupCall" />
    <!-- #endif -->
    <GroupPinnedMessage
      v-if="group?.pinnedMessages?.length"
      :messages="group.pinnedMessages"
      :can-manage="canManageGroup"
      @locate="scrollToPinnedMessage"
      @remove="removePinnedMessage"
    />
    <GroupRequestPending
      v-if="pendingGroupRequestCount > 0"
      :count="pendingGroupRequestCount"
      @open="openGroupRequests"
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
            :private-max-read-message-id="privateMaxReadMessageId"
            :show-time="shouldShowTime(index)"
            :select-mode="selectMode"
            :selected="selectedIdSet.has(messageKey(item))"
            @longpress="handleMessageMore"
            @scroll-to-quote="scrollToQuote"
            @material-click="handleMaterialClick"
            @merge-click="handleMergeClick"
            @card-click="handleCardClick"
            @mention-click="handleAvatarClick"
            @rtc-redial="handleRtcRedial"
            @toggle-select="toggleSelect"
            @show-readers="handleShowReaders"
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
        <ChatInput
          v-if="!selectMode && !isChannel"
          v-model="draftContent"
          :conversation-type="conversationType"
          :target-id="targetId"
          :group-members="groupMembers"
          :self-user-id="userStore.userInfo.userId"
          :reply-target="replyTarget"
          :reply-title="getQuoteTitleByQuote(replyTarget)"
          :disabled-tip="inputDisabledTip"
          @send="handleSend"
          @clear-reply="clearReplyTarget"
        />
        <view
          v-else-if="!selectMode"
          class="shrink-0 border-t border-t-[#e5e5e5] bg-[#f7f7f7] px-24rpx py-24rpx pb-[calc(24rpx+env(safe-area-inset-bottom))] text-center text-26rpx text-[#888]"
        >
          频道消息仅由管理员发布
        </view>
        <!-- 多选操作栏 -->
        <view
          v-else
          class="flex shrink-0 items-center justify-around border-t border-t-[#eee] bg-white py-24rpx pb-[calc(24rpx+env(safe-area-inset-bottom))]"
        >
          <text class="text-28rpx text-[#666]" @click="exitSelectMode">取消</text>
          <text class="text-28rpx" :class="selectedIds.length ? 'text-[#1677ff]' : 'text-[#ccc]'" @click="forwardSelected">
            转发{{ selectedIds.length ? `(${selectedIds.length})` : '' }}
          </text>
          <text class="text-28rpx" :class="selectedIds.length ? 'text-[#fa5151]' : 'text-[#ccc]'" @click="deleteSelected">
            删除
          </text>
        </view>
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

    <!-- 频道素材详情弹窗 -->
    <MaterialDetail v-model="materialVisible" :payload="materialPayload" />

    <!-- 合并转发详情弹窗 -->
    <MergeDetail
      v-model="mergeVisible"
      :payload="mergePayload"
      @material-click="handleMaterialClick"
      @card-click="handleCardClick"
    />

    <!-- 转发选择弹窗 -->
    <ForwardPicker
      v-model="forwardVisible"
      allow-create-group
      @confirm="handleForwardConfirm"
      @create-group="createGroupAndForward"
    >
      <template #footer>
        <view class="border-t border-t-[#f2f3f5] px-24rpx py-16rpx">
          <wd-input v-model="forwardLeaveMessage" :maxlength="100" placeholder="给朋友留言" clearable />
        </view>
      </template>
    </ForwardPicker>

    <!-- 群已读情况弹窗 -->
    <ReadDetail v-model="readDetailVisible" :read-members="readMembers" :unread-members="unreadMembers" />

    <!-- 通话方式菜单 -->
    <wd-action-sheet v-model="callActionVisible" :actions="callActions" @select="handleCallAction" />

    <!-- 转发方式菜单 -->
    <wd-action-sheet v-model="forwardActionVisible" :actions="forwardActions" @select="handleForwardAction" />

    <!-- 消息操作菜单 -->
    <wd-action-sheet v-model="messageActionVisible" :actions="messageActions" @select="handleMessageActionSelect" />
  </view>
</template>

<script lang="ts" setup>
import type { MessageDO } from '@/pages-im/utils/db'
import type { GroupMember, Message } from '../../types'
import type {
  CardMessage,
  FileMessage,
  MaterialMessage,
  MergeMessage,
  QuoteMessage,
  TextMessage,
} from '@/pages-im/utils/message'
import {
  buildQuoteFromMessage,
  canForwardMessage,
  canRecallMessage,
  extractAddableFace,
  getQuoteFromMessage,
  parseMessage,
  parseRecallMessageId,
} from '@/pages-im/utils/message'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { MESSAGE_CHAT_PAGE_SIZE } from '@/pages-im/utils/config'
import { toTimestamp } from '@/pages-im/utils/time'
import {
  getFriendDisplayName,
  getGroupDisplayName,
  getMemberDisplayName,
  isGroupQuit,
} from '@/pages-im/utils/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { onHide, onShow } from '@dcloudio/uni-app'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getClientConversationId } from '@/pages-im/utils/db'
import {
  cancelMuteMember,
  muteMember,
  pinGroupMessage,
  unpinGroupMessage,
} from '@/api/im/group'
import { removeGroupMember } from '@/api/im/group/member'
import { getActiveCall } from '@/api/im/rtc'
import { applyJoinGroup } from '@/api/im/group/request'
import { getGroupReadUsers } from '@/api/im/message/group'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import {
  CommonStatusEnum,
  IM_AT_ALL_USER_ID,
  ImConversationType,
  ImFriendAddSource,
  ImGroupAddSource,
  ImGroupMemberRole,
  ImMessageType,
  ImRtcCallMediaType,
} from '@/pages-im/utils/constants'
import { useImRtc } from '../../composables/useImRtc'
import { useMessageForwarder } from '../../composables/useMessageForwarder'
import { useMessageMultiSelect } from '../../composables/useMessageMultiSelect'
import { useMessageList } from '../../composables/useMessageList'
import { useMessagePuller } from '../../composables/useMessagePuller'
import { useRtcStore } from '../../store/rtcStore'
import { useMessageSender } from '../../composables/useMessageSender'
import { useMediaUploader } from '../../composables/useMediaUploader'
import { useMuteOverlay } from '../../composables/useMuteOverlay'
import { useConversationStore } from '../../store/conversationStore'
import { useChannelStore } from '../../store/channelStore'
import { useFaceStore } from '../../store/faceStore'
import { useFriendStore } from '../../store/friendStore'
import { useGroupRequestStore } from '../../store/groupRequestStore'
import { useGroupStore } from '../../store/groupStore'
import { useImRuntimeStore } from '../../store/runtimeStore'
import { useMessageStore } from '../../store/messageStore'
import ChatInput from './components/chat-input.vue'
import ForwardPicker from './components/forward-picker.vue'
import GroupPinnedMessage from './components/group-pinned-message.vue'
import GroupRequestPending from './components/group-request-pending.vue'
import MaterialDetail from './components/material-detail.vue'
import MergeDetail from './components/merge-detail.vue'
import MessageItem from './components/message-item.vue'
import ReadDetail from './components/read-detail.vue'
import RtcGroupCallBanner from './components/rtc-group-call-banner.vue'

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
  targetId?: number | string
  type?: number | string
  locateMessageId?: number | string
  mentionMessageId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const userStore = useUserStore()
const faceStore = useFaceStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const channelStore = useChannelStore()
const rtcStore = useRtcStore()
const messageStore = useMessageStore()
const {
  convertGroupMessage,
  convertPrivateMessage,
} = useMessagePuller()
const { getLocalImageInfo } = useMediaUploader()
const pagingRef = ref<any>() // 分页组件引用
const cellStyle = ref<Record<string, string>>({ transform: 'scaleY(-1)' }) // 聊天记录模式单元格倒置样式
const groupMembers = ref<GroupMember[]>([]) // 群成员
const pendingGroupRequestCount = ref(0) // 当前群待处理申请数
const materialVisible = ref(false) // 素材详情弹窗
const materialPayload = ref<MaterialMessage>() // 素材消息内容
const mergeVisible = ref(false) // 合并转发详情弹窗
const mergePayload = ref<MergeMessage>() // 合并转发内容
const callActionVisible = ref(false) // 通话方式菜单显示状态
const callActions = [ // 通话方式菜单项
  { name: '语音通话', value: ImRtcCallMediaType.VOICE },
  { name: '视频通话', value: ImRtcCallMediaType.VIDEO },
]
const messageActionVisible = ref(false) // 消息操作菜单显示状态
const actionMessage = ref<Message>() // 当前操作的消息
const messageActions = ref<Array<{ name: string, value: string, color?: string }>>([]) // 消息操作菜单项
const pinningMessageId = ref<number>() // 正在变更置顶状态的消息编号
const readDetailVisible = ref(false) // 群已读弹窗
const readMembers = ref<GroupMember[]>([]) // 已读成员
const unreadMembers = ref<GroupMember[]>([]) // 未读成员
const readLoadingMessageId = ref<number>() // 正在查询已读成员的消息编号
const replyTarget = ref<QuoteMessage>() // 回复目标
const conversationStore = useConversationStore()
const {
  setActiveConversation,
  setConversationDraft,
  getConversationDraft,
  ensureConversation,
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
const selectedIds = computed(() => messageMultiSelectState.selectedClientMessageIds) // 已选消息编号
const chatVisible = ref(false) // 当前聊天页是否可见
const draftContent = ref('') // 当前输入草稿
const friendLoaded = ref(false) // 好友关系是否加载完成
let draftTimer: ReturnType<typeof setTimeout> | undefined
const { start: startRtcCall, join: joinRtcCall } = useImRtc()

const conversationType = computed(() => Number(props.type || ImConversationType.PRIVATE)) // 当前会话类型
const isChannel = computed(() => conversationType.value === ImConversationType.CHANNEL) // 是否频道会话
const targetId = computed(() => Number(props.targetId)) // 当前会话目标
const privateFriend = computed(() => { // 当前有效私聊好友
  const friend = friendStore.getFriend(targetId.value)
  return friend && friendStore.isActiveFriend(targetId.value) ? friend : undefined
})
const isFriend = computed(() => friendStore.isActiveFriend(targetId.value)) // 私聊对象是否仍为好友
const group = computed(() => groupStore.getGroup(targetId.value)) // 当前群聊资料
const channel = computed(() => channelStore.getChannel(targetId.value)) // 当前频道资料
const isQuitGroupConversation = computed(() => conversationType.value === ImConversationType.GROUP
  && isGroupQuit(group.value)) // 是否历史退群群聊
const privateMaxReadMessageId = computed(() => // 私聊对方已读位置
  conversationType.value === ImConversationType.PRIVATE
    ? messageStore.getPrivateReadMaxId(targetId.value) || undefined
    : undefined)
const activeGroupCall = computed(() => rtcStore.getGroupCall(targetId.value)) // 当前群活跃通话
const currentCcid = computed(() => getClientConversationId(conversationType.value, targetId.value)) // 当前会话主键
const pageTitle = computed(() => { // 页面标题
  if (conversationType.value === ImConversationType.GROUP && group.value) {
    return getGroupDisplayName(group.value) || '群聊'
  }
  if (conversationType.value === ImConversationType.PRIVATE && privateFriend.value) {
    return getFriendDisplayName(privateFriend.value)
  }
  if (conversationType.value === ImConversationType.CHANNEL) {
    return channel.value?.name || '频道'
  }
  return conversationStore.getConversation(conversationType.value, targetId.value)?.name || '聊天'
})

/** 获取消息唯一标识 */
function messageKey(item: Message) {
  return item.clientMessageId
}

const navbarTitle = computed(() => conversationType.value === ImConversationType.GROUP && groupMembers.value.length
  ? `${pageTitle.value} (${groupMembers.value.filter(item => item.status !== CommonStatusEnum.DISABLE).length})`
  : pageTitle.value) // 导航栏标题
const currentGroupMember = computed(() => groupMembers.value.find(item => item.userId === userStore.userInfo.userId)) // 当前群成员
const canManageGroup = computed(() =>
  currentGroupMember.value?.role === ImGroupMemberRole.OWNER || currentGroupMember.value?.role === ImGroupMemberRole.ADMIN,
)
const muteOverlay = useMuteOverlay()
const inputDisabledTip = computed(() => { // 当前不可发送原因
  if (chatVisible.value
    && !conversationStore.isActiveConversation(conversationType.value, targetId.value)) {
    return '当前会话已失效'
  }
  return muteOverlay.value?.text || ''
})

/** 快照当前聊天页账号与会话 */
function getPageContext() {
  return {
    userId: userStore.userInfo.userId,
    conversationType: conversationType.value,
    targetId: targetId.value,
  }
}

/** 判断异步结果是否仍属于当前聊天页 */
function isPageContextActive(context: ReturnType<typeof getPageContext>) {
  return chatVisible.value
    && context.userId === userStore.userInfo.userId
    && context.conversationType === conversationType.value
    && context.targetId === targetId.value
}
const {
  messageList,
  historyLoadFailed,
  highlightMessageId,
  isNearBottom,
  newMessageCount,
  mentionPromptVisible,
  queryList,
  loadOlderMessagesAfterClear,
  locateMentionMessage,
  handleChatScroll,
  backToLatest,
  shouldShowTime,
  addLatestMessage,
  addStoredMessage,
  replaceLocalMessage,
  markMessageRecalled,
  updateMessageReceipt,
  removeDeletedMessages,
  resetAfterConversationClear,
} = useMessageList({
  pagingRef,
  getPageContext,
  isPageContextActive,
  getLocateMessageId: () => Number(props.locateMessageId),
  getMentionMessageId: () => Number(props.mentionMessageId),
  convertGroupMessage,
  convertPrivateMessage,
  markRead,
  syncPrivateReadStatus: syncPrivateReadStatusForList,
})

/** 获取当前选中的消息，并恢复为正序 */
function getSelectedMessages() {
  return messageList.value
    .filter(item => selectedIdSet.value.has(item.clientMessageId))
    .reverse()
}
const {
  forwardVisible,
  forwardLeaveMessage,
  forwardActionVisible,
  forwardActions,
  openForward,
  forwardSelected,
  handleForwardAction,
  createGroupAndForward,
  handleForwardConfirm,
} = useMessageForwarder({
  getSelectedMessages,
  exitSelectMode,
  pageTitle,
})
const {
  sendRawMessage,
  retryMessage,
  readActive,
  syncPrivateReadStatus,
  recallMessage,
} = useMessageSender({
  conversationType,
  targetId,
  replyTarget,
  addLatestMessage,
  replaceLocalMessage,
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

/** 加载私聊好友关系 */
async function loadFriendRelation() {
  if (conversationType.value !== ImConversationType.PRIVATE) {
    return
  }
  const context = getPageContext()
  try {
    const friends = await useFriendStore().fetchFriendList()
    if (!isPageContextActive(context)) {
      return
    }
    const friend = friends.find(item => item.friendUserId === context.targetId
      && item.status !== CommonStatusEnum.DISABLE)
    await ensureConversation({
      type: context.conversationType,
      targetId: context.targetId,
      name: friend
        ? getFriendDisplayName(friend)
        : conversationStore.getConversation(context.conversationType, context.targetId)?.name || '聊天',
      avatar: friend?.avatar || '',
      silent: friend?.silent,
    })
  } finally {
    if (isPageContextActive(context)) {
      friendLoaded.value = true
    }
  }
}

/** 打开音视频通话菜单 */
function openCallMenu() {
  if (isQuitGroupConversation.value) {
    toast.show('你已退出群聊，无法发起通话')
    return
  }
  callActionVisible.value = true
}

/** 发起指定方式的通话 */
function handleCallAction({ item }: { item: { value: number } }) {
  startCall(item.value)
}

/** 发起音视频通话 */
async function startCall(mediaType: number) {
  const inviteeIds = conversationType.value === ImConversationType.GROUP
    ? groupMembers.value
        .filter(item => item.userId !== userStore.userInfo.userId
          && item.status !== CommonStatusEnum.DISABLE)
        .map(item => item.userId)
    : [targetId.value]
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

/** 加入正在进行的群通话 */
async function joinActiveGroupCall() {
  if (activeGroupCall.value) {
    await joinRtcCall(activeGroupCall.value.room)
  }
}

/** 定位置顶消息 */
async function scrollToPinnedMessage(message: Message) {
  if (!message?.id) {
    return
  }
  if (!messageList.value.some(item => item.id === message.id)) {
    toast.show('该消息不在当前加载范围，请上滑加载历史消息')
    return
  }
  await nextTick()
  pagingRef.value?.scrollIntoViewById(`msg-${message.id}`, 0, true)
}

/** 取消置顶群消息 */
async function removePinnedMessage(message: Message) {
  if (!group.value?.id || !message.id || !canManageGroup.value || pinningMessageId.value != null) {
    return
  }
  pinningMessageId.value = message.id
  try {
    await unpinGroupMessage({ id: group.value.id, messageId: message.id })
    toast.success('已取消置顶')
    await loadGroupState()
  } finally {
    pinningMessageId.value = undefined
  }
}

/** 打开群申请列表 */
function openGroupRequests() {
  if (!targetId.value) {
    return
  }
  uni.navigateTo({ url: `/pages-im/home/contact/request/index?tab=group&groupId=${targetId.value}` })
}

/** 是否自己发送 */
function isSelfMessage(item: Message) {
  return item.senderId === userStore.userInfo.userId
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

/** 获取引用展示文案 */
function getQuoteTitleByQuote(quote?: QuoteMessage | null) {
  if (!quote) {
    return ''
  }
  return `${getQuoteSenderName(quote)}：${getMessageSummary(quote.type, quote.content)}`
}

/** 滚动到引用消息 */
async function scrollToQuote(content: string) {
  const quote = getQuoteFromMessage(content)
  if (!quote?.messageId) {
    return
  }
  if (!messageList.value.some(item => item.id === quote.messageId)) {
    toast.show('原消息不在视野')
    return
  }
  await nextTick()
  pagingRef.value?.scrollIntoViewById(`msg-${quote.messageId}`, 0, true)
}

/** 清空回复目标 */
function clearReplyTarget() {
  replyTarget.value = undefined
}

/** 回复消息 */
function handleReplyMessage(item: Message) {
  replyTarget.value = buildQuoteFromMessage(item)
}

/** 获取文本内容 */
function getTextContent(content: string) {
  return parseMessage<TextMessage>(content)?.content || content || ''
}

/** 点击频道素材：打开详情 */
function handleMaterialClick(payload: MaterialMessage) {
  if (!payload) {
    return
  }
  materialPayload.value = payload
  materialVisible.value = true
}

/** 点击合并转发：打开详情 */
function handleMergeClick(payload: MergeMessage) {
  if (!payload) {
    return
  }
  mergePayload.value = payload
  mergeVisible.value = true
}

/** 打开个人 / 群名片 */
async function handleCardClick(payload: CardMessage) {
  if (payload.targetType === ImConversationType.GROUP) {
    await groupStore.fetchGroupList()
    if (groupStore.groups.some(item => item.id === payload.targetId && !isGroupQuit(item))) {
      uni.navigateTo({ url: `/pages-im/home/contact/group/detail/index?id=${payload.targetId}` })
      return
    }
    let value: string | number | undefined
    try {
      const result = await dialog.prompt({
        title: payload.name || '申请加入群聊',
        inputValue: '你好，我想加入群聊',
        inputProps: { placeholder: '请输入申请理由' },
      })
      value = result.value
    } catch {
      return
    }
    await applyJoinGroup({
      groupId: payload.targetId,
      applyContent: String(value || '你好，我想加入群聊'),
      addSource: ImGroupAddSource.SHARE_LINK,
    })
    toast.success('申请已发送')
    return
  }
  if (payload.targetId === userStore.userInfo.userId) {
    toast.show('这是你自己的名片')
    return
  }
  await friendStore.fetchFriendList()
  if (friendStore.getActiveFriendList.some(item => item.friendUserId === payload.targetId)) {
    uni.navigateTo({ url: `/pages-im/home/contact/friend/detail/index?friendUserId=${payload.targetId}` })
    return
  }
  uni.navigateTo({
    url: `/pages-im/home/contact/friend/apply/index?toUserId=${payload.targetId}&source=${ImFriendAddSource.CARD}`,
  })
}

/** 打开消息发送人资料 */
async function handleAvatarClick(userId: number) {
  if (!userId || userId === IM_AT_ALL_USER_ID || userId === userStore.userInfo.userId) {
    return
  }
  await friendStore.fetchFriendList()
  if (friendStore.getActiveFriendList.some(item => item.friendUserId === userId)) {
    uni.navigateTo({ url: `/pages-im/home/contact/friend/detail/index?friendUserId=${userId}` })
    return
  }
  const sourceExtra = conversationType.value === ImConversationType.GROUP && group.value?.name
    ? `&sourceExtra=${encodeURIComponent(group.value.name)}`
    : ''
  const addSource = conversationType.value === ImConversationType.GROUP
    ? ImFriendAddSource.GROUP
    : ImFriendAddSource.SEARCH
  uni.navigateTo({
    url: `/pages-im/home/contact/friend/apply/index?toUserId=${userId}&source=${addSource}${sourceExtra}`,
  })
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
  await removeMessageList(currentCcid.value, messages)
  if (removeDeletedMessages(messages) === 0) {
    await loadOlderMessagesAfterClear()
  }
  exitSelectMode()
}

/** 删除选中消息 */
function deleteSelected() {
  confirmDelete(getSelectedMessages())
}

/** 查看群消息已读成员 */
async function handleShowReaders(message: Message) {
  if (!message.id || readLoadingMessageId.value != null) {
    return
  }
  const context = getPageContext()
  readLoadingMessageId.value = message.id
  try {
    const readIds = await getGroupReadUsers({ groupId: targetId.value, messageId: message.id })
    if (!isPageContextActive(context)) {
      return
    }
    const readSet = new Set(readIds)
    const receiverIds = message.receiverUserIds
    const receiverSet = receiverIds?.length ? new Set(receiverIds) : undefined
    const others = groupMembers.value.filter(item => item.userId !== message.senderId
      && item.status !== CommonStatusEnum.DISABLE
      && (!receiverSet || receiverSet.has(item.userId)))
    readMembers.value = others.filter(item => readSet.has(item.userId))
    unreadMembers.value = others.filter(item => !readSet.has(item.userId))
    readDetailVisible.value = true
  } finally {
    if (readLoadingMessageId.value === message.id) {
      readLoadingMessageId.value = undefined
    }
  }
}

/** 加载群成员 */
async function loadGroupMembers() {
  if (conversationType.value !== ImConversationType.GROUP || !targetId.value) {
    return
  }
  const context = getPageContext()
  await useGroupStore().loadGroupMemberList(targetId.value)
  if (!isPageContextActive(context)) {
    return
  }
  const cachedGroup = useGroupStore().getGroup(targetId.value)
  groupMembers.value = cachedGroup?.members || []
  const [memberList, groupDetail, activeCall] = await Promise.all([
    !cachedGroup?.membersLoaded || cachedGroup.membersExpired
      ? useGroupStore().fetchGroupMemberList(targetId.value)
      : Promise.resolve(cachedGroup.members || []),
    useGroupStore().fetchGroupInfo(targetId.value, true),
    getActiveCall(targetId.value),
  ])
  if (!isPageContextActive(context)) {
    return
  }
  groupMembers.value = memberList
  if (activeCall) {
    rtcStore.setGroupCall(activeCall)
  } else {
    rtcStore.removeGroupCall(targetId.value)
  }
  if (groupDetail) {
    await ensureConversation({
      type: ImConversationType.GROUP,
      targetId: targetId.value,
      name: getGroupDisplayName(groupDetail),
      avatar: groupDetail.avatar || '',
      silent: groupDetail.silent,
    })
  }
  if (canManageGroup.value) {
    const groupRequestStore = useGroupRequestStore()
    await groupRequestStore.fetchUnhandledGroupRequestList()
    if (!isPageContextActive(context)) {
      return
    }
    const requests = groupRequestStore.unhandledList
    pendingGroupRequestCount.value = requests.filter(item => item.groupId === targetId.value).length
  } else {
    pendingGroupRequestCount.value = 0
  }
}

/** 刷新群资料和活跃通话 */
async function loadGroupState() {
  if (conversationType.value !== ImConversationType.GROUP || !targetId.value) {
    return
  }
  const context = getPageContext()
  const [groupDetail, activeCall] = await Promise.all([
    useGroupStore().fetchGroupInfo(targetId.value, true),
    getActiveCall(targetId.value),
  ])
  if (!isPageContextActive(context)) {
    return
  }
  if (activeCall) {
    rtcStore.setGroupCall(activeCall)
  } else {
    rtcStore.removeGroupCall(targetId.value)
  }
  if (groupDetail) {
    await ensureConversation({
      type: ImConversationType.GROUP,
      targetId: targetId.value,
      name: getGroupDisplayName(groupDetail),
      avatar: groupDetail.avatar || '',
      silent: groupDetail.silent,
    })
  }
}

/** 标记已读 */
async function markRead(latest = messageList.value[0]) {
  await readActive(latest?.id || 0)
}

/** 消息更多操作 */
function handleMessageMore(item: Message) {
  const actions: Array<{ name: string, value: string, color?: string }> = []
  const canForward = canForwardMessage(item)
  if (!isChannel.value && canForward && item.type !== ImMessageType.MERGE) {
    actions.push({ name: '引用', value: 'reply' })
  }
  if (!isChannel.value && item.type === ImMessageType.TEXT) {
    actions.push({ name: '复制', value: 'copy' })
  }
  if (canForward) {
    actions.push({ name: '转发', value: 'forward' })
  }
  if (canRecallMessage(item, conversationType.value, userStore.userInfo.userId)) {
    actions.push({ name: '撤回', value: 'recall' })
  }
  if (conversationType.value === ImConversationType.GROUP
    && canManageGroup.value
    && canForward
    && !isPinnedMessage(item.id)) {
    actions.push({ name: '置顶', value: 'pin' })
  }
  if (!isChannel.value && item.type === ImMessageType.FILE) {
    actions.push({ name: '复制文件链接', value: 'copyFileUrl' })
  }
  if (!isChannel.value && canForward && (item.type === ImMessageType.IMAGE || item.type === ImMessageType.FACE)) {
    actions.push({ name: '添加到表情', value: 'addFace' })
  }
  const senderMember = getManageableSender(item)
  if (senderMember) {
    if (toTimestamp(senderMember.muteEndTime) > Date.now()) {
      actions.push({ name: '解除禁言', value: 'unmuteSender' })
    } else {
      actions.push({ name: '禁言 10 分钟', value: 'muteSender10' })
      actions.push({ name: '禁言 1 小时', value: 'muteSender60' })
    }
    actions.push({ name: '移出群聊', value: 'removeSender', color: '#fa5151' })
  }
  if (!isChannel.value && canForward) {
    actions.push({ name: '多选', value: 'multiSelect' })
  }
  if (!canRecallMessage(item, conversationType.value, userStore.userInfo.userId)) {
    actions.push({ name: '删除', value: 'delete', color: '#fa5151' })
  }
  if (actions.length === 0) {
    return
  }
  actionMessage.value = item
  messageActions.value = actions
  messageActionVisible.value = true
}

/** 处理消息菜单操作 */
async function handleMessageActionSelect({ item }: { item: { value: string } }) {
  if (actionMessage.value) {
    await handleMessageAction(actionMessage.value, item.value)
  }
}

/** 执行消息操作 */
async function handleMessageAction(item: Message, action: string) {
  if (action === 'reply') {
    handleReplyMessage(item)
  } else if (action === 'copy') {
    uni.setClipboardData({ data: getTextContent(item.content) })
  } else if (action === 'copyFileUrl') {
    const file = parseMessage<FileMessage>(item.content)
    if (file?.url) {
      uni.setClipboardData({ data: file.url })
    }
  } else if (action === 'addFace') {
    await handleAddFace(item)
  } else if (action === 'muteSender10' || action === 'muteSender60') {
    await handleMuteSender(item, action === 'muteSender60' ? 3600 : 600)
  } else if (action === 'unmuteSender') {
    await handleUnmuteSender(item)
  } else if (action === 'removeSender') {
    await handleRemoveSender(item)
  } else if (action === 'recall') {
    await handleRecallMessage(item)
  } else if (action === 'pin') {
    await handlePinMessage(item)
  } else if (action === 'forward') {
    openForward([item])
  } else if (action === 'multiSelect') {
    enterSelectMode(item)
  } else if (action === 'delete') {
    await confirmDelete([item])
  }
}

/** 获取当前用户可管理的消息发送成员 */
function getManageableSender(item: Message) {
  if (conversationType.value !== ImConversationType.GROUP || isSelfMessage(item) || !currentGroupMember.value) {
    return undefined
  }
  const sender = groupMembers.value.find(member =>
    member.userId === item.senderId
    && member.status !== CommonStatusEnum.DISABLE)
  if (!sender?.role || !currentGroupMember.value.role || currentGroupMember.value.role >= sender.role) {
    return undefined
  }
  return sender
}

/** 禁言消息发送成员 */
async function handleMuteSender(item: Message, mutedSeconds: number) {
  if (!group.value?.id || !getManageableSender(item)) {
    return
  }
  await muteMember({ id: group.value.id, userId: item.senderId, mutedSeconds })
  toast.success('已禁言')
  await loadGroupMembers()
}

/** 解除消息发送成员的禁言 */
async function handleUnmuteSender(item: Message) {
  if (!group.value?.id || !getManageableSender(item)) {
    return
  }
  try {
    await dialog.confirm({ title: '解除禁言', msg: '确定解除该成员的禁言吗？' })
  } catch {
    return
  }
  await cancelMuteMember({ id: group.value.id, userId: item.senderId })
  toast.success('已解除禁言')
  await loadGroupMembers()
}

/** 将消息发送成员移出群聊 */
async function handleRemoveSender(item: Message) {
  const sender = getManageableSender(item)
  if (!group.value?.id || !sender) {
    return
  }
  try {
    await dialog.confirm({ title: '移出群聊', msg: `确定将“${getMemberDisplayName(sender)}”移出群聊吗？` })
  } catch {
    return
  }
  await removeGroupMember({ groupId: group.value.id, memberUserIds: [item.senderId] })
  toast.success('已移出群聊')
  await loadGroupMembers()
}

/** 将图片或表情消息添加到个人收藏 */
async function handleAddFace(item: Message) {
  const payload = extractAddableFace(item)
  if (!payload?.url) {
    return
  }
  const imageInfo = payload.width && payload.height ? undefined : await getLocalImageInfo(payload.url)
  if (await faceStore.addFaceUserItem({
    url: payload.url,
    name: payload.name,
    width: payload.width || imageInfo?.width || 0,
    height: payload.height || imageInfo?.height || 0,
  })) {
    toast.success('已添加到表情')
  }
}

/** 是否为群置顶消息 */
function isPinnedMessage(messageId: number) {
  return !!group.value?.pinnedMessages?.some(item => item.id === messageId)
}

/** 置顶群消息 */
async function handlePinMessage(item: Message) {
  if (!item.id || !group.value?.id || isPinnedMessage(item.id) || pinningMessageId.value != null) {
    return
  }
  try {
    await dialog.confirm({ title: '置顶消息', msg: '将在当前群成员的聊天中置顶' })
  } catch {
    return
  }
  pinningMessageId.value = item.id
  try {
    await pinGroupMessage({ id: group.value.id, messageId: item.id })
    toast.success('已置顶')
    await loadGroupState()
  } finally {
    pinningMessageId.value = undefined
  }
}

/** 撤回消息 */
async function handleRecallMessage(item: Message) {
  if (!item.id || !canRecallMessage(item, conversationType.value, userStore.userInfo.userId)) {
    return
  }
  try {
    await dialog.confirm({ title: '撤回消息', msg: '确定撤回该消息吗？' })
  } catch {
    return
  }
  if (!await recallMessage(item)) {
    return
  }
  markMessageRecalled(item.id)
  toast.success('已撤回')
}

/** 输入区发送：转发给 sendRawMessage */
function handleSend(data: SendData) {
  if (inputDisabledTip.value) {
    toast.show(inputDisabledTip.value)
    return false
  }
  return sendRawMessage(data.type, data.payload, data.options)
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
    void loadGroupState()
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
    loadGroupMembers()
  } else if (data.contentType === ImMessageType.RTC_CALL_START || data.contentType === ImMessageType.RTC_CALL_END) {
    loadGroupState()
  }
}

/** 响应资料页清空当前聊天记录 */
function onConversationCleared(clientConversationId: string) {
  if (clientConversationId !== currentCcid.value) {
    return
  }
  draftContent.value = ''
  replyTarget.value = undefined
  resetAfterConversationClear()
}

/** 初始化 */
onMounted(() => {
  if (!targetId.value) {
    toast.show('会话参数不完整')
    return
  }
  uni.$on('im:message', onIncoming)
  uni.$on('im:event', onImEvent)
  uni.$on('im:conversation-cleared', onConversationCleared)
  uni.$on('im:state:resync', onStateResync)
  const draft = getConversationDraft({ type: conversationType.value, targetId: targetId.value })
  draftContent.value = draft?.plain || ''
  replyTarget.value = draft?.reply
})

/** 进入页面：标记活跃会话并确保 IM 运行时已启动 */
onShow(async () => {
  chatVisible.value = true
  const context = getPageContext()
  if (context.userId <= 0) {
    return
  }
  setActiveConversation({ type: context.conversationType, targetId: context.targetId })
  await useImRuntimeStore().ensure()
  if (!isPageContextActive(context)) {
    return
  }
  if (context.conversationType === ImConversationType.GROUP) {
    await loadGroupMembers()
  } else if (context.conversationType === ImConversationType.PRIVATE) {
    await loadFriendRelation()
  } else if (context.conversationType === ImConversationType.CHANNEL) {
    await channelStore.fetchChannelList()
    if (!isPageContextActive(context)) {
      return
    }
    await ensureConversation({
      type: context.conversationType,
      targetId: context.targetId,
      name: channel.value?.name || '频道',
      avatar: channel.value?.avatar || '',
    })
  }
})

/** 离开页面：取消活跃会话标记 */
onHide(() => {
  chatVisible.value = false
  setActiveConversation(null)
})

/** 卸载 */
onUnmounted(() => {
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
