<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="pageTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    >
      <template #right>
        <view class="pr-8rpx" @click="openSetting">
          <wd-icon name="more" size="44rpx" color="#333" />
        </view>
      </template>
    </wd-navbar>

    <!-- 消息列表 -->
    <scroll-view
      class="min-h-0 flex-1 bg-[#ededed]"
      scroll-y
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view class="px-24rpx py-20rpx">
        <wd-button v-if="hasMore" block size="small" variant="plain" :loading="loadingMore" @click="loadMore">
          加载更早消息
        </wd-button>
        <view v-if="!loading && messageList.length === 0" class="py-120rpx">
          <wd-empty icon="content" tip="暂无消息" />
        </view>
        <MessageItem
          v-for="(item, index) in messageList"
          :id="`msg-${item.id || item.clientMessageId || index}`"
          :key="item.id || item.clientMessageId || index"
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
          :selected="selectedIds.includes(messageKey(item))"
          @longpress="handleMessageMore"
          @scroll-to-quote="scrollToQuote"
          @material-click="handleMaterialClick"
          @merge-click="handleMergeClick"
          @toggle-select="toggleSelect"
          @show-readers="handleShowReaders"
        />
        <view id="msg-bottom" />
      </view>
    </scroll-view>

    <!-- 输入区 -->
    <ChatInput
      v-if="!selectMode"
      :conversation-type="conversationType"
      :group-members="groupMembers"
      :self-user-id="userStore.userInfo.userId"
      :reply-title="getQuoteTitleByQuote(replyTarget)"
      @send="handleSend"
      @clear-reply="clearReplyTarget"
    />
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

    <!-- 频道素材详情 -->
    <MaterialDetail v-model="materialVisible" :payload="materialPayload" />

    <!-- 合并转发详情 -->
    <MergeDetail v-model="mergeVisible" :payload="mergePayload" />

    <!-- 转发选择 -->
    <ForwardPicker v-model="forwardVisible" @confirm="handleForwardConfirm" />

    <!-- 群已读情况 -->
    <ReadDetail v-model="readDetailVisible" :read-members="readMembers" :unread-members="unreadMembers" />
  </view>
</template>

<script lang="ts" setup>
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'
import type { ConversationDO } from '@/pages-im/home/db'
import type {
  ImFileMessage,
  ImMaterialMessage,
  ImMergeMessage,
  ImQuoteMessage,
  ImTextMessage,
} from '@/pages-im/utils/message'
import {
  buildQuoteFromMessage,
  generateClientMessageId,
  getMessageSummary,
  getQuoteFromMessage,
  parseMessage,
  removeQuotePayload,
  serializeMessage,
  withQuotePayload,
} from '@/pages-im/utils/message'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onHide, onShow } from '@dcloudio/uni-app'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { getClientConversationId } from '@/pages-im/home/db'
import { getGroupMemberList } from '@/api/im/group/member'
import {
  getGroupMessageList,
  getGroupReadUsers,
  readGroupMessages,
  recallGroupMessage,
  sendGroupMessage,
} from '@/api/im/message/group'
import {
  getPrivateMaxReadMessageId,
  getPrivateMessageList,
  readPrivateMessages,
  recallPrivateMessage,
  sendPrivateMessage,
} from '@/api/im/message/private'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { ImConversationType, ImMessageType } from '@/utils/constants'
import { useImConversations } from '../composables/useImConversations'
import { connectImWebSocket } from '../composables/useImWebSocket'
import ChatInput from './components/chat-input.vue'
import ForwardPicker from './components/forward-picker.vue'
import MaterialDetail from './components/material-detail.vue'
import MergeDetail from './components/merge-detail.vue'
import MessageItem from './components/message-item.vue'
import ReadDetail from './components/read-detail.vue'

type ChatMessage = ImPrivateMessageRespVO | ImGroupMessageRespVO

interface SendRawOptions {
  atUserIds?: number[] // @ 用户编号
  receipt?: boolean // 是否回执消息
}

interface SendData {
  type: number // 消息类型
  payload: Record<string, any> // 消息内容对象
  options?: SendRawOptions // 额外选项
}

const props = defineProps<{
  targetId?: number | string
  title?: string
  type?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const PAGE_SIZE = 30
const MESSAGE_TIME_GAP = 5 * 60 * 1000 // 时间分隔间隔（5 分钟）
const toast = useToast()
const userStore = useUserStore()
const loading = ref(false) // 初始加载状态
const loadingMore = ref(false) // 加载更早状态
const hasMore = ref(false) // 是否还有更早消息
const messageList = ref<ChatMessage[]>([]) // 消息列表
const groupMembers = ref<ImGroupMemberRespVO[]>([]) // 群成员
const scrollIntoView = ref('msg-bottom') // 滚动锚点
const privateMaxReadMessageId = ref<number>() // 私聊对方已读位置
const materialVisible = ref(false) // 素材详情弹窗
const materialPayload = ref<ImMaterialMessage>() // 素材消息内容
const mergeVisible = ref(false) // 合并转发详情弹窗
const mergePayload = ref<ImMergeMessage>() // 合并转发内容
const selectMode = ref(false) // 消息多选模式
const selectedIds = ref<string[]>([]) // 已选消息标识
const forwardVisible = ref(false) // 转发选择弹窗
const forwardMessages = ref<ChatMessage[]>([]) // 待转发消息
const readDetailVisible = ref(false) // 群已读弹窗
const readMembers = ref<ImGroupMemberRespVO[]>([]) // 已读成员
const unreadMembers = ref<ImGroupMemberRespVO[]>([]) // 未读成员
const replyTarget = ref<ImQuoteMessage>() // 回复目标
const { markConversationRead, setActiveConversation, buildIncomingMessage, applyIncomingMessage } = useImConversations()
const chatVisible = ref(false) // 当前聊天页是否可见

/** 当前会话类型 */
const conversationType = computed(() => Number(props.type || ImConversationType.PRIVATE))

/** 当前会话目标 */
const targetId = computed(() => Number(props.targetId))

/** 当前会话主键 */
const currentCcid = computed(() => getClientConversationId(conversationType.value, targetId.value))

/** 页面标题 */
const pageTitle = computed(() => props.title ? decodeURIComponent(props.title) : '聊天')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/friend/index')
}

/** 打开会话设置：群聊 → 群设置，私聊 → 好友资料 */
function openSetting() {
  if (conversationType.value === ImConversationType.GROUP) {
    uni.navigateTo({ url: `/pages-im/home/group/detail/index?id=${targetId.value}` })
  } else {
    uni.navigateTo({ url: `/pages-im/home/friend/detail/index?friendUserId=${targetId.value}` })
  }
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
    return member?.displayUserName || member?.nickname || `用户 ${quote.senderId}`
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
  scrollIntoView.value = ''
  await nextTick()
  scrollIntoView.value = `msg-${quote.messageId}`
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

/** 消息唯一标识 */
function messageKey(item: ChatMessage) {
  return String(item.id || item.clientMessageId)
}

/** 多选切换 */
function toggleSelect(item: ChatMessage) {
  const key = messageKey(item)
  const index = selectedIds.value.indexOf(key)
  if (index >= 0) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(key)
  }
}

/** 进入多选模式 */
function enterSelectMode(item: ChatMessage) {
  selectMode.value = true
  selectedIds.value = [messageKey(item)]
}

/** 退出多选模式 */
function exitSelectMode() {
  selectMode.value = false
  selectedIds.value = []
}

/** 当前选中的消息 */
function getSelectedMessages() {
  return messageList.value.filter(item => selectedIds.value.includes(messageKey(item)))
}

/** 打开转发选择 */
function openForward(messages: ChatMessage[]) {
  if (messages.length === 0) {
    return
  }
  forwardMessages.value = [...messages]
  forwardVisible.value = true
}

/** 转发选中消息 */
function forwardSelected() {
  openForward(getSelectedMessages())
}

/** 确认转发到目标会话 */
async function handleForwardConfirm(targets: ConversationDO[]) {
  for (const target of targets) {
    for (const message of forwardMessages.value) {
      const content = removeQuotePayload(message.content)
      if (target.type === ImConversationType.GROUP) {
        await sendGroupMessage({ clientMessageId: generateClientMessageId(), groupId: target.targetId, type: message.type, content })
      } else {
        await sendPrivateMessage({ clientMessageId: generateClientMessageId(), receiverId: target.targetId, type: message.type, content })
      }
    }
  }
  toast.success('转发成功')
  exitSelectMode()
}

/** 删除选中消息（本地移除） */
function confirmDelete(messages: ChatMessage[]) {
  if (messages.length === 0) {
    return
  }
  uni.showModal({
    title: '提示',
    content: `确定删除选中的 ${messages.length} 条消息吗？`,
    success: ({ confirm }) => {
      if (!confirm) {
        return
      }
      const keys = new Set(messages.map(messageKey))
      messageList.value = messageList.value.filter(item => !keys.has(messageKey(item)))
      exitSelectMode()
    },
  })
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
  const others = groupMembers.value.filter(item => item.userId !== userStore.userInfo.userId && !item.quitTime)
  readMembers.value = others.filter(item => readSet.has(item.userId))
  unreadMembers.value = others.filter(item => !readSet.has(item.userId))
  readDetailVisible.value = true
}

/** 滚动到底部 */
async function scrollToBottom() {
  await nextTick()
  scrollIntoView.value = ''
  await nextTick()
  scrollIntoView.value = 'msg-bottom'
}

/** 查询历史消息 */
async function queryMessages(maxId?: number) {
  if (conversationType.value === ImConversationType.GROUP) {
    return getGroupMessageList({ groupId: targetId.value, maxId, limit: PAGE_SIZE })
  }
  return getPrivateMessageList({ receiverId: targetId.value, maxId, limit: PAGE_SIZE })
}

/** 加载最新消息 */
async function loadMessages() {
  if (!targetId.value) {
    return
  }
  loading.value = true
  try {
    if (conversationType.value === ImConversationType.GROUP) {
      groupMembers.value = await getGroupMemberList(targetId.value)
    }
    const data = await queryMessages()
    messageList.value = normalizeMessages(data)
    hasMore.value = data.length >= PAGE_SIZE
    await markRead()
    await syncPrivateReadStatus()
    await scrollToBottom()
  } finally {
    loading.value = false
  }
}

/** 加载更早消息 */
async function loadMore() {
  const firstId = messageList.value[0]?.id
  if (!firstId || loadingMore.value) {
    return
  }
  loadingMore.value = true
  try {
    const data = await queryMessages(firstId)
    const older = normalizeMessages(data)
    messageList.value = [...older, ...messageList.value]
    hasMore.value = data.length >= PAGE_SIZE
  } finally {
    loadingMore.value = false
  }
}

/** 标记已读 */
async function markRead() {
  const last = messageList.value[messageList.value.length - 1]
  if (!last?.id) {
    return
  }
  if (conversationType.value === ImConversationType.GROUP) {
    await readGroupMessages(targetId.value, last.id)
  } else {
    await readPrivateMessages(targetId.value, last.id)
  }
  // 同步清除会话列表未读
  await markConversationRead(conversationType.value, targetId.value, last.id)
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
  const actions: Array<{ name: string, value: string }> = []
  if (item.type !== ImMessageType.RECALL) {
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
  if (item.type === ImMessageType.FILE) {
    actions.push({ name: '复制文件链接', value: 'copyFileUrl' })
  }
  actions.push({ name: '多选', value: 'multiSelect' })
  actions.push({ name: '删除', value: 'delete' })
  if (actions.length === 0) {
    return
  }
  uni.showActionSheet({
    itemList: actions.map(action => action.name),
    success: ({ tapIndex }) => {
      const action = actions[tapIndex]
      handleMessageAction(item, action.value)
    },
  })
}

/** 是否可撤回 */
function canRecallMessage(item: ChatMessage) {
  return !!item.id && isSelfMessage(item) && item.type !== ImMessageType.RECALL
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
  } else if (action === 'forward') {
    openForward([item])
  } else if (action === 'multiSelect') {
    enterSelectMode(item)
  } else if (action === 'delete') {
    confirmDelete([item])
  }
}

/** 撤回消息 */
async function handleRecallMessage(item: ChatMessage) {
  if (!item.id) {
    return
  }
  const recalled = conversationType.value === ImConversationType.GROUP
    ? await recallGroupMessage(item.id)
    : await recallPrivateMessage(item.id)
  const index = messageList.value.findIndex(message => message.id === item.id)
  if (index >= 0) {
    messageList.value[index] = recalled as ChatMessage
  }
  toast.success('已撤回')
}

/** 发送原始消息 */
async function sendRawMessage(type: number, payload: Record<string, any>, options: SendRawOptions = {}) {
  const quote = replyTarget.value
  const content = serializeMessage(withQuotePayload(payload, quote))
  const message = conversationType.value === ImConversationType.GROUP
    ? await sendGroupMessage({
        clientMessageId: generateClientMessageId(),
        groupId: targetId.value,
        type,
        content,
        atUserIds: options.atUserIds,
        receipt: options.receipt,
      })
    : await sendPrivateMessage({
        clientMessageId: generateClientMessageId(),
        receiverId: targetId.value,
        type,
        content,
      })
  messageList.value.push(message)
  // 自己发的消息 WebSocket 不会回推，手动同步到会话列表（更新摘要 + 落库 + 重排）
  const incoming = buildIncomingMessage(conversationType.value, message)
  if (incoming) {
    applyIncomingMessage(incoming)
  }
  if (quote && replyTarget.value === quote) {
    clearReplyTarget()
  }
  await scrollToBottom()
}

/** 输入区发送：转发给 sendRawMessage */
function handleSend(data: SendData) {
  return sendRawMessage(data.type, data.payload, data.options)
}

/** 规范化消息顺序 */
function normalizeMessages(data: ChatMessage[]) {
  return [...data].sort((a, b) => (a.id || 0) - (b.id || 0))
}

/** 时间转毫秒 */
function toMillis(time?: number | string) {
  if (!time) {
    return 0
  }
  return typeof time === 'number' ? time : new Date(time).getTime()
}

/** 是否展示时间分隔（首条或距上一条超过 5 分钟） */
function shouldShowTime(index: number) {
  if (index === 0) {
    return true
  }
  const current = messageList.value[index]
  const previous = messageList.value[index - 1]
  return toMillis(current.sendTime) - toMillis(previous.sendTime) > MESSAGE_TIME_GAP
}

/** 收到实时消息：属于当前会话且页面可见时追加气泡 */
function onIncoming(data: { message?: { clientConversationId?: string }, payload?: ChatMessage }) {
  const message = data?.message
  const payload = data?.payload
  if (!chatVisible.value || !message || !payload || message.clientConversationId !== currentCcid.value) {
    return
  }
  const exists = messageList.value.some(item =>
    (payload.id && item.id === payload.id)
    || (payload.clientMessageId && item.clientMessageId === payload.clientMessageId))
  if (exists) {
    return
  }
  messageList.value = normalizeMessages([...messageList.value, payload])
  scrollToBottom()
  markRead()
}

/** 初始化 */
onMounted(() => {
  if (!targetId.value) {
    toast.show('会话参数不完整')
    return
  }
  uni.$on('im:message', onIncoming)
  loadMessages()
})

/** 进入页面：标记活跃会话 + 建立实时连接 */
onShow(() => {
  chatVisible.value = true
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
})
</script>
