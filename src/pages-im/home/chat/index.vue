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
          <!-- #ifdef H5 -->
          <wd-icon v-if="!isChannel" name="phone" size="40rpx" color="#333" @click="openCallMenu" />
          <!-- #endif -->
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
      v-if="group?.pinnedMessages?.[0]"
      :message="group.pinnedMessages[0]"
      @locate="scrollToPinnedMessage"
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
            :self-user-id="userStore.userInfo.userId"
            :self-name="userStore.userInfo.nickname"
            :self-avatar="userStore.userInfo.avatar"
            :peer-name="pageTitle"
            :group-members="groupMembers"
            :private-max-read-message-id="privateMaxReadMessageId"
            :show-time="shouldShowTime(index)"
            :select-mode="selectMode"
            :selected="selectedIdSet.has(messageKey(item))"
            @longpress="handleMessageMore"
            @scroll-to-quote="scrollToQuote"
            @material-click="handleMaterialClick"
            @merge-click="handleMergeClick"
            @card-click="handleCardClick"
            @toggle-select="toggleSelect"
            @show-readers="handleShowReaders"
            @retry="retryMessage"
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
          :group-members="groupMembers"
          :self-user-id="userStore.userInfo.userId"
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
    <MergeDetail v-model="mergeVisible" :payload="mergePayload" />

    <!-- 转发选择弹窗 -->
    <ForwardPicker
      v-model="forwardVisible"
      allow-create-group
      @confirm="handleForwardConfirm"
      @create-group="createGroupAndForward"
    />

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
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import type { ImGroupRespVO } from '@/api/im/group'
import type { ImRtcGroupCallRespVO } from '@/api/im/rtc'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { MessageDO } from '@/pages-im/home/db/types'
import type { ChatMessage, SendRawOptions } from '../types'
import type {
  ImCardMessage,
  ImFileMessage,
  ImMaterialMessage,
  ImMergeMessage,
  ImQuoteMessage,
  ImTextMessage,
} from '@/pages-im/utils/message'
import {
  buildQuoteFromMessage,
  getQuoteFromMessage,
  parseMessage,
  parseRecallMessageId,
} from '@/pages-im/utils/message'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { MESSAGE_CHAT_PAGE_SIZE, MESSAGE_TIME_TIP_GAP_MS } from '@/pages-im/utils/config'
import { toTimestamp } from '@/pages-im/utils/time'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { onHide, onShow } from '@dcloudio/uni-app'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getMyFriendList } from '@/api/im/friend'
import { readChannelMessages } from '@/api/im/message/channel'
import { getClientConversationId } from '@/pages-im/home/db'
import { getGroupMemberList } from '@/api/im/group/member'
import { getGroup, pinGroupMessage, unpinGroupMessage } from '@/api/im/group'
import { getActiveCall } from '@/api/im/rtc'
import { applyJoinGroup, getUnhandledRequestList } from '@/api/im/group/request'
import {
  getGroupMessageList,
  getGroupReadUsers,
  readGroupMessages,
  recallGroupMessage,
} from '@/api/im/message/group'
import {
  getPrivateMaxReadMessageId,
  getPrivateMessageList,
  readPrivateMessages,
  recallPrivateMessage,
} from '@/api/im/message/private'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import {
  ImConversationType,
  ImFriendAddSource,
  ImGroupAddSource,
  ImGroupMemberRole,
  ImMessageStatus,
  ImMessageType,
  ImRtcCallMediaType,
} from '@/utils/constants'
import { useImConversations } from '../composables/useImConversations'
import { useImRtc } from '../composables/useImRtc'
import { connectImWebSocket } from '../composables/useImWebSocket'
import { useMessageForwarder } from '../composables/useMessageForwarder'
import { useMessageMultiSelect } from '../composables/useMessageMultiSelect'
import { useMessageSender } from '../composables/useMessageSender'
import ChatInput from './components/chat-input.vue'
import ForwardPicker from './components/forward-picker.vue'
import GroupPinnedMessage from './components/group-pinned-message.vue'
import GroupRequestPending from './components/group-request-pending.vue'
import MaterialDetail from './components/material-detail.vue'
import MergeDetail from './components/merge-detail.vue'
import MessageItem from './components/message-item.vue'
import ReadDetail from './components/read-detail.vue'
import RtcGroupCallBanner from './components/rtc-group-call-banner.vue'

interface SendData {
  type: number // 消息类型
  payload: Record<string, any> // 消息内容对象
  options?: SendRawOptions // 额外选项
}

const props = defineProps<{
  targetId?: number | string
  title?: string
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
const pagingRef = ref<any>() // 分页组件引用
const messageList = ref<ChatMessage[]>([]) // 消息列表（最新在前）
const firstPageLoading = ref(false) // 首屏消息加载状态
const pendingLatestMessages = ref<ChatMessage[]>([]) // 首屏加载期间待追加消息
const cellStyle = ref<Record<string, string>>({ transform: 'scaleY(-1)' }) // 聊天记录模式单元格倒置样式
const historyMaxId = ref<number>() // 历史消息游标（已加载最早消息编号）
const historyLoadFailed = ref(false) // 删除清空后的历史补拉失败状态
const groupMembers = ref<ImGroupMemberRespVO[]>([]) // 群成员
const group = ref<ImGroupRespVO>() // 群详情
const activeGroupCall = ref<ImRtcGroupCallRespVO | null>(null) // 进行中的群通话
const pendingGroupRequestCount = ref(0) // 当前群待处理申请数
const privateMaxReadMessageId = ref<number>() // 私聊对方已读位置
const materialVisible = ref(false) // 素材详情弹窗
const materialPayload = ref<ImMaterialMessage>() // 素材消息内容
const mergeVisible = ref(false) // 合并转发详情弹窗
const mergePayload = ref<ImMergeMessage>() // 合并转发内容
const callActionVisible = ref(false) // 通话方式菜单显示状态
const callActions = [ // 通话方式菜单项
  { name: '语音通话', value: ImRtcCallMediaType.VOICE },
  { name: '视频通话', value: ImRtcCallMediaType.VIDEO },
]
const messageActionVisible = ref(false) // 消息操作菜单显示状态
const actionMessage = ref<ChatMessage>() // 当前操作的消息
const messageActions = ref<Array<{ name: string, value: string, color?: string }>>([]) // 消息操作菜单项
const readDetailVisible = ref(false) // 群已读弹窗
const readMembers = ref<ImGroupMemberRespVO[]>([]) // 已读成员
const unreadMembers = ref<ImGroupMemberRespVO[]>([]) // 未读成员
const replyTarget = ref<ImQuoteMessage>() // 回复目标
const {
  markConversationRead,
  setActiveConversation,
  setConversationDraft,
  getConversationDraft,
  getConversationClearBefore,
  getConversationDeletedMessageKeys,
  getConversationPendingMessages,
  getConversationStoredMessages,
  deleteConversationMessages,
  applyRecallMessage,
} = useImConversations()
const {
  selectMode,
  selectedIds,
  selectedIdSet,
  messageKey,
  toggleSelect,
  enterSelectMode,
  exitSelectMode,
  getSelectedMessages,
} = useMessageMultiSelect(messageList)
const chatVisible = ref(false) // 当前聊天页是否可见
const draftContent = ref('') // 当前输入草稿
const highlightMessageId = ref<number>() // 当前定位高亮的消息
const clearBeforeMessageId = ref(0) // 本地清理的历史边界
const deletedMessageKeys = ref(new Set<string>()) // 本地已删除消息标识
const recalledMessageIds = new Set<number>() // 分页期间已收到的撤回原消息编号
const isNearBottom = ref(true) // 是否停留在最新消息附近
const newMessageCount = ref(0) // 未自动滚动的新消息数
const mentionPromptVisible = ref(!!Number(props.mentionMessageId)) // @我定位提示
const friendLoaded = ref(false) // 好友关系是否加载完成
const isFriend = ref(true) // 私聊对象是否仍为好友
let draftTimer: ReturnType<typeof setTimeout> | undefined
let locateConsumed = false
let deletedKeysLoaded = false
const { start: startRtcCall, join: joinRtcCall } = useImRtc()

const conversationType = computed(() => Number(props.type || ImConversationType.PRIVATE)) // 当前会话类型
const isChannel = computed(() => conversationType.value === ImConversationType.CHANNEL) // 是否频道会话
const targetId = computed(() => Number(props.targetId)) // 当前会话目标
const currentCcid = computed(() => getClientConversationId(conversationType.value, targetId.value)) // 当前会话主键
const pageTitle = computed(() => props.title ? decodeURIComponent(props.title) : '聊天') // 页面标题
const navbarTitle = computed(() => conversationType.value === ImConversationType.GROUP && groupMembers.value.length
  ? `${pageTitle.value} (${groupMembers.value.filter(item => !item.quitTime).length})`
  : pageTitle.value) // 导航栏标题
const currentGroupMember = computed(() => groupMembers.value.find(item => item.userId === userStore.userInfo.userId)) // 当前群成员
const canManageGroup = computed(() =>
  currentGroupMember.value?.role === ImGroupMemberRole.OWNER || currentGroupMember.value?.role === ImGroupMemberRole.ADMIN,
)
const inputDisabledTip = computed(() => { // 群聊不可发送状态
  if (conversationType.value !== ImConversationType.GROUP) {
    return ''
  }
  if (!currentGroupMember.value || currentGroupMember.value.quitTime) {
    return '你已退出群聊，不能发送消息'
  }
  if (group.value?.status !== 0 && group.value?.status != null) {
    return group.value?.banned ? '该群聊已被封禁' : '该群聊已解散'
  }
  if (group.value?.banned) {
    return '该群聊已被封禁'
  }
  if (group.value?.mutedAll && !canManageGroup.value) {
    return '群主已开启全员禁言'
  }
  if (currentGroupMember.value.muteEndTime && new Date(currentGroupMember.value.muteEndTime).getTime() > Date.now()) {
    return `你已被禁言至 ${formatDateTime(currentGroupMember.value.muteEndTime)}`
  }
  return ''
})
const {
  forwardVisible,
  forwardActionVisible,
  forwardActions,
  openForward,
  forwardSelected,
  handleForwardAction,
  createGroupAndForward,
  onForwardGroupCreated,
  handleForwardConfirm,
} = useMessageForwarder({ getSelectedMessages, getMessageSenderName, exitSelectMode, pageTitle })
const { sendRawMessage, retryMessage } = useMessageSender({
  conversationType,
  targetId,
  replyTarget,
  addLatestMessage,
  replaceLocalMessage,
  clearReplyTarget,
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/friend/index')
}

/** 打开会话设置：群聊 → 群设置，私聊 → 好友资料 */
function openSetting() {
  if (isChannel.value) {
    return
  }
  if (conversationType.value === ImConversationType.GROUP) {
    uni.navigateTo({ url: `/pages-im/home/group/detail/index?id=${targetId.value}` })
  } else {
    uni.navigateTo({ url: `/pages-im/home/friend/detail/index?friendUserId=${targetId.value}` })
  }
}

/** 打开添加好友页 */
function openFriendApply() {
  uni.navigateTo({
    url: `/pages-im/home/friend/apply/index?toUserId=${targetId.value}&source=${ImFriendAddSource.SEARCH}`,
  })
}

/** 加载私聊好友关系 */
async function loadFriendRelation() {
  if (conversationType.value !== ImConversationType.PRIVATE) {
    return
  }
  try {
    const friends = await getMyFriendList()
    isFriend.value = friends.some(item => item.friendUserId === targetId.value && !item.deleteTime)
  } finally {
    friendLoaded.value = true
  }
}

/** 打开音视频通话菜单 */
function openCallMenu() {
  callActionVisible.value = true
}

/** 发起指定方式的通话 */
function handleCallAction({ item }: { item: { value: number } }) {
  startCall(item.value)
}

/** 发起音视频通话 */
async function startCall(mediaType: number) {
  const inviteeIds = conversationType.value === ImConversationType.GROUP
    ? groupMembers.value.filter(item => item.userId !== userStore.userInfo.userId && !item.quitTime).map(item => item.userId)
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
    name: pageTitle.value,
    avatar: group.value?.avatar,
  })
}

/** 加入正在进行的群通话 */
async function joinActiveGroupCall() {
  if (activeGroupCall.value) {
    await joinRtcCall(activeGroupCall.value.room, pageTitle.value)
  }
}

/** 定位置顶消息 */
async function scrollToPinnedMessage() {
  const message = group.value?.pinnedMessages?.[0]
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

/** 打开群申请列表 */
function openGroupRequests() {
  uni.navigateTo({ url: '/pages-im/home/request/index?tab=group' })
}

/** 是否自己发送 */
function isSelfMessage(item: ChatMessage) {
  return item.senderId === userStore.userInfo.userId
}

/** 获取引用发送人名称 */
function getQuoteSenderName(quote: ImQuoteMessage) {
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
function getQuoteTitleByQuote(quote?: ImQuoteMessage | null) {
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
  await nextTick()
  pagingRef.value?.scrollIntoViewById(`msg-${quote.messageId}`, 0, true)
}

/** 清空回复目标 */
function clearReplyTarget() {
  replyTarget.value = undefined
}

/** 回复消息 */
function handleReplyMessage(item: ChatMessage) {
  replyTarget.value = buildQuoteFromMessage(item)
}

/** 获取文本内容 */
function getTextContent(content: string) {
  return parseMessage<ImTextMessage>(content)?.content || content || ''
}

/** 点击频道素材：打开详情 */
function handleMaterialClick(payload: ImMaterialMessage) {
  if (!payload) {
    return
  }
  materialPayload.value = payload
  materialVisible.value = true
}

/** 点击合并转发：打开详情 */
function handleMergeClick(payload: ImMergeMessage) {
  if (!payload) {
    return
  }
  mergePayload.value = payload
  mergeVisible.value = true
}

/** 打开个人 / 群名片 */
async function handleCardClick(payload: ImCardMessage) {
  if (payload.targetType === ImConversationType.GROUP) {
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
  uni.navigateTo({
    url: `/pages-im/home/friend/apply/index?toUserId=${payload.targetId}&source=${ImFriendAddSource.CARD}`,
  })
}

/** 本地删除消息的持久标识 */
function deletedMessageKey(item: ChatMessage) {
  return item.id ? `id:${item.id}` : `client:${item.clientMessageId}`
}

/** 是否已在当前设备删除 */
function isLocallyDeleted(item: ChatMessage) {
  return deletedMessageKeys.value.has(deletedMessageKey(item))
}

/** 获取消息发送人名称 */
function getMessageSenderName(message: ChatMessage) {
  if (conversationType.value === ImConversationType.GROUP) {
    const member = groupMembers.value.find(item => item.userId === message.senderId)
    return member ? getMemberDisplayName(member) : `用户 ${message.senderId}`
  }
  return pageTitle.value
}

/** 删除选中消息（当前设备持久移除） */
async function confirmDelete(messages: ChatMessage[]) {
  if (messages.length === 0) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定删除选中的 ${messages.length} 条消息吗？` })
  } catch {
    return
  }
  await deleteConversationMessages(currentCcid.value, messages)
  messages.forEach(item => deletedMessageKeys.value.add(deletedMessageKey(item)))
  const keys = new Set(messages.map(messageKey))
  const nextMessages = messageList.value.filter(item => !keys.has(messageKey(item)))
  pagingRef.value?.resetTotalData(nextMessages)
  if (nextMessages.length === 0) {
    loadOlderMessagesAfterClear()
  }
  exitSelectMode()
}

/** 删除选中消息 */
function deleteSelected() {
  confirmDelete(getSelectedMessages())
}

/** 查看群消息已读成员 */
async function handleShowReaders(message: ChatMessage) {
  if (!message.id) {
    return
  }
  const readIds = await getGroupReadUsers({ groupId: targetId.value, messageId: message.id })
  const readSet = new Set(readIds)
  const receiverIds = (message as ImGroupMessageRespVO).receiverUserIds
  const receiverSet = receiverIds?.length ? new Set(receiverIds) : undefined
  const others = groupMembers.value.filter(item => item.userId !== message.senderId
    && !item.quitTime
    && item.status !== 1
    && (!receiverSet || receiverSet.has(item.userId)))
  readMembers.value = others.filter(item => readSet.has(item.userId))
  unreadMembers.value = others.filter(item => !readSet.has(item.userId))
  readDetailVisible.value = true
}

/** 查询历史消息 */
async function queryMessages(maxId?: number, limit = MESSAGE_CHAT_PAGE_SIZE): Promise<ChatMessage[]> {
  if (isChannel.value) {
    const stored = await getConversationStoredMessages(currentCcid.value, 5000)
    return stored
      .filter(item => !maxId || (item.id || 0) < maxId)
      .slice(-limit)
      .map(mapStoredMessage)
  }
  if (conversationType.value === ImConversationType.GROUP) {
    return getGroupMessageList({ groupId: targetId.value, maxId, limit })
  }
  return getPrivateMessageList({ receiverId: targetId.value, maxId, limit })
}

/** 删除清空后继续加载更早消息 */
async function loadOlderMessagesAfterClear() {
  if (!historyMaxId.value) {
    return
  }
  historyLoadFailed.value = false
  try {
    const response = await queryMessages(historyMaxId.value, MESSAGE_CHAT_PAGE_SIZE)
    const messages = normalizeMessages(normalizeRecallMessages(response)).filter(item => !isLocallyDeleted(item))
    const nextHistoryId = Math.min(...response.map(item => item.id || Number.MAX_SAFE_INTEGER))
    if (Number.isFinite(nextHistoryId)) {
      historyMaxId.value = nextHistoryId
    }
    const mergedMessages = normalizeMessages([...messageList.value, ...messages])
      .filter((message, index, rows) => rows.findIndex(item => isSameMessage(item, message)) === index)
    pagingRef.value?.resetTotalData(mergedMessages)
  } catch {
    historyLoadFailed.value = true
  }
}

/** 分页查询：第一页加载最新消息，后续按最早消息编号向前加载 */
async function queryList(pageNo: number, pageSize: number) {
  const isFirstPage = pageNo === 1
  let querySucceeded = false
  if (isFirstPage) {
    firstPageLoading.value = true
  }
  if (!targetId.value) {
    await pagingRef.value?.complete([])
    if (isFirstPage) {
      flushPendingLatestMessages()
    }
    return
  }
  try {
    await loadDeletedMessageKeys()
    clearBeforeMessageId.value ||= await getConversationClearBefore(currentCcid.value)
    const maxId = isFirstPage ? undefined : historyMaxId.value
    const firstResponse = await queryMessages(maxId, pageSize)
    let rawResponses = [...firstResponse]
    let responseCount = firstResponse.length
    let reachedClearBoundary = firstResponse.some(item => item.id <= clearBeforeMessageId.value)
    let data: ChatMessage[] = firstResponse.filter(item => item.id > clearBeforeMessageId.value && !isLocallyDeleted(item))
    const locateMessageId = Number(props.locateMessageId || props.mentionMessageId)
    if (isFirstPage && locateMessageId && !locateConsumed) {
      locateConsumed = true
      for (let guard = 0; guard < 50 && !data.some(item => item.id === locateMessageId); guard++) {
        const nextMaxId = Math.min(...rawResponses.map(item => item.id || Number.MAX_SAFE_INTEGER))
        if (!Number.isFinite(nextMaxId) || nextMaxId === Number.MAX_SAFE_INTEGER
          || responseCount < pageSize || reachedClearBoundary) {
          break
        }
        const earlierResponse = await queryMessages(nextMaxId, pageSize)
        const earlier = earlierResponse.filter(item => item.id > clearBeforeMessageId.value && !isLocallyDeleted(item))
        rawResponses = [...rawResponses, ...earlierResponse]
        responseCount = earlierResponse.length
        reachedClearBoundary ||= earlierResponse.some(item => item.id <= clearBeforeMessageId.value)
        data = [...data, ...earlier]
        if (earlierResponse.length < pageSize || reachedClearBoundary) {
          break
        }
      }
    }
    let messages = normalizeMessages(normalizeRecallMessages(data))
    if (isFirstPage) {
      const pendingMessages = (await getConversationPendingMessages(currentCcid.value)).map(mapStoredMessage)
      messages = normalizeMessages([...pendingMessages, ...messages])
        .filter((message, index, rows) => rows.findIndex(item => isSameMessage(item, message)) === index)
    }
    const nextHistoryId = Math.min(...rawResponses.map(item => item.id || Number.MAX_SAFE_INTEGER))
    if (Number.isFinite(nextHistoryId)) {
      historyMaxId.value = nextHistoryId
    }
    await pagingRef.value?.completeByNoMore(messages, responseCount < pageSize || reachedClearBoundary)
    querySucceeded = true
  } catch {
    if (isFirstPage) {
      const cachedMessages = (await getConversationStoredMessages(currentCcid.value, pageSize))
        .map(mapStoredMessage)
        .filter(item => (!item.id || item.id > clearBeforeMessageId.value) && !isLocallyDeleted(item))
      await pagingRef.value?.complete(normalizeMessages(normalizeRecallMessages(cachedMessages)))
      flushPendingLatestMessages()
      return
    }
    await pagingRef.value?.complete(false).catch(() => undefined)
    return
  } finally {
    if (isFirstPage && querySucceeded) {
      flushPendingLatestMessages()
    }
  }
  if (isFirstPage) {
    await markRead()
    await syncPrivateReadStatus()
    await locateInitialMessage()
  }
}

/** 加载当前设备已删除的消息标识 */
async function loadDeletedMessageKeys() {
  if (deletedKeysLoaded) {
    return
  }
  deletedMessageKeys.value = new Set(await getConversationDeletedMessageKeys(currentCcid.value))
  deletedKeysLoaded = true
}

/** 定位从聊天记录搜索进入的消息 */
async function locateInitialMessage() {
  const messageId = Number(props.locateMessageId)
  if (!messageId || !messageList.value.some(item => item.id === messageId)) {
    return
  }
  highlightMessageId.value = messageId
  await nextTick()
  pagingRef.value?.scrollIntoViewById(`msg-${messageId}`, 0, true)
  setTimeout(() => {
    if (highlightMessageId.value === messageId) {
      highlightMessageId.value = undefined
    }
  }, 1800)
}

/** 定位 @我的消息 */
async function locateMentionMessage() {
  const messageId = Number(props.mentionMessageId)
  mentionPromptVisible.value = false
  if (!messageId || !messageList.value.some(item => item.id === messageId)) {
    toast.show('该提醒消息已不在聊天记录中')
    return
  }
  highlightMessageId.value = messageId
  await nextTick()
  pagingRef.value?.scrollIntoViewById(`msg-${messageId}`, 0, true)
  setTimeout(() => {
    if (highlightMessageId.value === messageId) {
      highlightMessageId.value = undefined
    }
  }, 1800)
}

/** 记录聊天滚动位置 */
function handleChatScroll(event: any) {
  isNearBottom.value = Number(event.detail?.scrollTop ?? event.scrollTop ?? 0) < 80
  if (isNearBottom.value) {
    newMessageCount.value = 0
  }
}

/** 回到最新消息 */
async function backToLatest() {
  newMessageCount.value = 0
  isNearBottom.value = true
  pagingRef.value?.scrollToBottom(true)
  await markRead()
}

/** 加载群成员 */
async function loadGroupMembers() {
  if (conversationType.value !== ImConversationType.GROUP || !targetId.value) {
    return
  }
  const [memberList, groupDetail, activeCall] = await Promise.all([
    getGroupMemberList(targetId.value),
    getGroup(targetId.value),
    getActiveCall(targetId.value),
  ])
  groupMembers.value = memberList
  group.value = groupDetail
  activeGroupCall.value = activeCall
  if (canManageGroup.value) {
    const requests = await getUnhandledRequestList()
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
  const [groupDetail, activeCall] = await Promise.all([getGroup(targetId.value), getActiveCall(targetId.value)])
  group.value = groupDetail
  activeGroupCall.value = activeCall
}

/** 标记已读 */
async function markRead(latest = messageList.value[0]) {
  if (!latest?.id) {
    return
  }
  if (conversationType.value === ImConversationType.GROUP) {
    await readGroupMessages(targetId.value, latest.id)
  } else if (isChannel.value) {
    await readChannelMessages(targetId.value, latest.id)
  } else {
    await readPrivateMessages(targetId.value, latest.id)
  }
  // 同步清除会话列表未读
  await markConversationRead(conversationType.value, targetId.value, latest.id)
}

/** 同步私聊已读位置 */
async function syncPrivateReadStatus() {
  if (conversationType.value !== ImConversationType.PRIVATE || !targetId.value) {
    return
  }
  privateMaxReadMessageId.value = await getPrivateMaxReadMessageId(targetId.value) || undefined
}

/** 消息更多操作 */
function handleMessageMore(item: ChatMessage) {
  const actions: Array<{ name: string, value: string, color?: string }> = []
  if (!isChannel.value && item.type !== ImMessageType.RECALL) {
    actions.push({ name: '回复', value: 'reply' })
  }
  if (item.type === ImMessageType.TEXT) {
    actions.push({ name: '复制', value: 'copy' })
  }
  if (item.type !== ImMessageType.RECALL) {
    actions.push({ name: '转发', value: 'forward' })
  }
  if (canRecallMessage(item)) {
    actions.push({ name: '撤回', value: 'recall' })
  }
  if (conversationType.value === ImConversationType.GROUP && canManageGroup.value && item.id && item.type !== ImMessageType.RECALL) {
    actions.push({ name: isPinnedMessage(item.id) ? '取消置顶' : '置顶', value: 'pin' })
  }
  if (item.type === ImMessageType.FILE) {
    actions.push({ name: '复制文件链接', value: 'copyFileUrl' })
  }
  actions.push({ name: '多选', value: 'multiSelect' })
  actions.push({ name: '删除', value: 'delete', color: '#fa5151' })
  if (actions.length === 0) {
    return
  }
  actionMessage.value = item
  messageActions.value = actions
  messageActionVisible.value = true
}

/** 处理消息菜单操作 */
function handleMessageActionSelect({ item }: { item: { value: string } }) {
  if (actionMessage.value) {
    handleMessageAction(actionMessage.value, item.value)
  }
}

/** 是否可撤回 */
function canRecallMessage(item: ChatMessage) {
  return !isChannel.value && !!item.id && isSelfMessage(item) && item.type !== ImMessageType.RECALL
}

/** 执行消息操作 */
async function handleMessageAction(item: ChatMessage, action: string) {
  if (action === 'reply') {
    handleReplyMessage(item)
  } else if (action === 'copy') {
    uni.setClipboardData({ data: getTextContent(item.content) })
  } else if (action === 'copyFileUrl') {
    const file = parseMessage<ImFileMessage>(item.content)
    if (file?.url) {
      uni.setClipboardData({ data: file.url })
    }
  } else if (action === 'recall') {
    await handleRecallMessage(item)
  } else if (action === 'pin') {
    await handlePinMessage(item)
  } else if (action === 'forward') {
    openForward([item])
  } else if (action === 'multiSelect') {
    enterSelectMode(item)
  } else if (action === 'delete') {
    confirmDelete([item])
  }
}

/** 是否为群置顶消息 */
function isPinnedMessage(messageId: number) {
  return !!group.value?.pinnedMessages?.some(item => item.id === messageId)
}

/** 置顶或取消置顶群消息 */
async function handlePinMessage(item: ChatMessage) {
  if (!item.id || !group.value?.id) {
    return
  }
  if (isPinnedMessage(item.id)) {
    await unpinGroupMessage({ id: group.value.id, messageId: item.id })
    toast.success('已取消置顶')
  } else {
    await pinGroupMessage({ id: group.value.id, messageId: item.id })
    toast.success('已置顶')
  }
  await loadGroupState()
}

/** 撤回消息 */
async function handleRecallMessage(item: ChatMessage) {
  if (!item.id) {
    return
  }
  const signal = conversationType.value === ImConversationType.GROUP
    ? await recallGroupMessage(item.id)
    : await recallPrivateMessage(item.id)
  recalledMessageIds.add(item.id)
  await applyRecallMessage(conversationType.value, targetId.value, signal.content, userStore.userInfo.userId)
  const index = messageList.value.findIndex(message => message.id === item.id)
  if (index >= 0) {
    const nextMessages = [...messageList.value]
    nextMessages[index] = {
      ...nextMessages[index],
      type: ImMessageType.RECALL,
      content: '',
      status: ImMessageStatus.RECALL,
    } as ChatMessage
    pagingRef.value?.resetTotalData(nextMessages)
  }
  toast.success('已撤回')
}

/** 替换本地发送占位消息 */
function replaceLocalMessage(clientMessageId: string, message: ChatMessage) {
  const pendingIndex = pendingLatestMessages.value.findIndex(item => item.clientMessageId === clientMessageId)
  if (pendingIndex >= 0) {
    const nextMessages = [...pendingLatestMessages.value]
    nextMessages[pendingIndex] = message
    pendingLatestMessages.value = nextMessages
    return
  }
  const index = messageList.value.findIndex(item => item.clientMessageId === clientMessageId)
  if (index < 0) {
    addLatestMessage(message, true)
    return
  }
  const nextMessages = [...messageList.value]
  nextMessages[index] = message
  pagingRef.value?.resetTotalData(nextMessages)
}

/** 输入区发送：转发给 sendRawMessage */
function handleSend(data: SendData) {
  return sendRawMessage(data.type, data.payload, data.options)
}

/** 构造当前草稿 */
function buildDraft() {
  if (!draftContent.value && !replyTarget.value) {
    return undefined
  }
  return { plain: draftContent.value, reply: replyTarget.value }
}

/** 延迟保存输入与回复草稿 */
watch([draftContent, replyTarget], () => {
  if (draftTimer) {
    clearTimeout(draftTimer)
  }
  draftTimer = setTimeout(() => {
    setConversationDraft(currentCcid.value, buildDraft())
  }, 250)
}, { deep: true })

/** 规范化聊天记录顺序：最新消息在前 */
function normalizeMessages(data: ChatMessage[]) {
  return [...data].sort((a, b) => {
    if (a.id && b.id) {
      return b.id - a.id
    }
    return toTimestamp(b.sendTime) - toTimestamp(a.sendTime)
  })
}

/** 把撤回信号归一化到原消息，并移除信号消息 */
function normalizeRecallMessages(data: ChatMessage[]) {
  data.forEach((message) => {
    const messageId = message.type === ImMessageType.RECALL
      ? parseRecallMessageId(message.content)
      : 0
    if (messageId) {
      recalledMessageIds.add(messageId)
    }
  })
  return data
    .filter(message => message.type !== ImMessageType.RECALL || !parseRecallMessageId(message.content))
    .map(message => message.status === ImMessageStatus.RECALL || (!!message.id && recalledMessageIds.has(message.id))
      ? {
          ...message,
          type: ImMessageType.RECALL,
          content: '',
          status: ImMessageStatus.RECALL,
        } as ChatMessage
      : message)
}

/** 本地消息记录转聊天接口结构 */
function mapStoredMessage(message: MessageDO): ChatMessage {
  return {
    ...message,
    sendTime: new Date(message.sendTime).toISOString(),
    groupId: message.conversationType === ImConversationType.GROUP ? message.targetId : undefined,
    channelId: message.conversationType === ImConversationType.CHANNEL ? message.targetId : undefined,
    receiverId: message.conversationType === ImConversationType.PRIVATE ? message.targetId : undefined,
  } as unknown as ChatMessage
}

/** 是否展示时间分隔（最早一条或与更早消息间隔超过 5 分钟） */
function shouldShowTime(index: number) {
  const current = messageList.value[index]
  const older = messageList.value[index + 1]
  return !older || toTimestamp(current.sendTime) - toTimestamp(older.sendTime) > MESSAGE_TIME_TIP_GAP_MS
}

/** 是否为同一条消息 */
function isSameMessage(left: ChatMessage, right: ChatMessage) {
  return !!((right.id && left.id === right.id)
    || (right.clientMessageId && left.clientMessageId === right.clientMessageId))
}

/** 去重后追加最新消息 */
function addLatestMessage(message: ChatMessage, forceBottom = false) {
  if (messageList.value.some(item => isSameMessage(item, message))
    || pendingLatestMessages.value.some(item => isSameMessage(item, message))) {
    return false
  }
  if (firstPageLoading.value) {
    pendingLatestMessages.value.push(message)
    return true
  }
  const toBottom = forceBottom || isNearBottom.value
  if (pagingRef.value) {
    pagingRef.value.addChatRecordData(message, toBottom, true)
  } else {
    messageList.value = [message, ...messageList.value]
  }
  if (!toBottom && message.senderId !== userStore.userInfo.userId) {
    newMessageCount.value += 1
  }
  return true
}

/** 追加首屏加载期间收到的新消息 */
function flushPendingLatestMessages() {
  firstPageLoading.value = false
  const messages = normalizeMessages(normalizeRecallMessages(pendingLatestMessages.value)).reverse()
  pendingLatestMessages.value = []
  messages.forEach(message => addLatestMessage(message, true))
}

/** 收到实时消息：属于当前会话且页面可见时追加气泡 */
function onIncoming(data: { message?: { clientConversationId?: string }, payload?: ChatMessage }) {
  const message = data?.message
  const payload = data?.payload
  if (!chatVisible.value || !message || !payload || message.clientConversationId !== currentCcid.value) {
    return
  }
  if (!addLatestMessage(payload)) {
    return
  }
  if (isNearBottom.value) {
    markRead(payload)
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
    if (messageId) {
      recalledMessageIds.add(messageId)
      pendingLatestMessages.value = pendingLatestMessages.value.map(message => message.id === messageId
        ? {
            ...message,
            type: ImMessageType.RECALL,
            content: '',
            status: ImMessageStatus.RECALL,
          } as ChatMessage
        : message)
    }
    const index = messageList.value.findIndex(item => item.id === messageId)
    if (index >= 0) {
      const nextMessages = [...messageList.value]
      nextMessages[index] = {
        ...nextMessages[index],
        type: ImMessageType.RECALL,
        content: '',
        status: ImMessageStatus.RECALL,
      } as ChatMessage
      pagingRef.value?.resetTotalData(nextMessages)
    }
  } else if (data.contentType === ImMessageType.READ && conversationType.value === ImConversationType.PRIVATE) {
    privateMaxReadMessageId.value = Math.max(
      privateMaxReadMessageId.value || 0,
      Number(payload.readId || payload.messageId || payload.maxReadMessageId || payload.id || 0),
    )
  } else if (data.contentType === ImMessageType.RECEIPT && conversationType.value === ImConversationType.PRIVATE) {
    privateMaxReadMessageId.value = Math.max(
      privateMaxReadMessageId.value || 0,
      Number(payload.messageId || payload.id || 0),
    )
  } else if (data.contentType === ImMessageType.RECEIPT) {
    const index = messageList.value.findIndex(item => item.id === Number(payload.messageId || payload.id))
    if (index >= 0) {
      const nextMessages = [...messageList.value]
      nextMessages[index] = {
        ...nextMessages[index],
        readCount: payload.readCount,
        receiptStatus: payload.receiptStatus,
      } as ChatMessage
      pagingRef.value?.resetTotalData(nextMessages)
    }
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
  historyMaxId.value = undefined
  clearBeforeMessageId.value = messageList.value[0]?.id || 0
  messageList.value = []
  pagingRef.value?.reload()
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
  uni.$on('im:forward-group-created', onForwardGroupCreated)
  const draft = getConversationDraft(currentCcid.value)
  draftContent.value = draft?.plain || ''
  replyTarget.value = draft?.reply
  loadGroupMembers()
  loadFriendRelation()
})

/** 进入页面：标记活跃会话 + 建立实时连接 */
onShow(() => {
  chatVisible.value = true
  if (!userStore.userInfo.userId) {
    return
  }
  setActiveConversation(conversationType.value, targetId.value)
  connectImWebSocket()
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
  uni.$off('im:forward-group-created', onForwardGroupCreated)
  if (draftTimer) {
    clearTimeout(draftTimer)
  }
  void setConversationDraft(currentCcid.value, buildDraft()).catch(() => undefined)
})
</script>
