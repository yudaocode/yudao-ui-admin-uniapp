<template>
  <view class="yd-page-container yd-page-container-paging">
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
    <z-paging
      ref="pagingRef"
      v-model="messageList"
      use-chat-record-mode
      :fixed="false"
      class="min-h-0 flex-1 bg-[#ededed]"
      :default-page-size="PAGE_SIZE"
      bg-color="#ededed"
      bottom-bg-color="#fff"
      empty-view-text="暂无消息"
      empty-view-reload-text="重新加载"
      :show-empty-view-reload="historyLoadFailed"
      @query="queryList"
      @empty-view-reload="handleEmptyViewReload"
      @cell-style-change="cellStyle = $event"
    >
      <view class="px-24rpx py-20rpx">
        <view
          v-for="(item, index) in messageList"
          :id="`msg-${item.id || item.clientMessageId || index}`"
          :key="item.id || item.clientMessageId || index"
          :style="cellStyle"
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
            :selected="selectedIds.includes(messageKey(item))"
            @longpress="handleMessageMore"
            @scroll-to-quote="scrollToQuote"
            @material-click="handleMaterialClick"
            @merge-click="handleMergeClick"
            @toggle-select="toggleSelect"
            @show-readers="handleShowReaders"
          />
        </view>
      </view>

      <!-- 输入区域 -->
      <template #bottom>
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
      </template>
    </z-paging>

    <!-- 频道素材详情弹窗 -->
    <MaterialDetail v-model="materialVisible" :payload="materialPayload" />

    <!-- 合并转发详情弹窗 -->
    <MergeDetail v-model="mergeVisible" :payload="mergePayload" />

    <!-- 转发选择弹窗 -->
    <ForwardPicker v-model="forwardVisible" @confirm="handleForwardConfirm" />

    <!-- 群已读情况弹窗 -->
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

const PAGE_SIZE = 30 // 每页消息数
const MESSAGE_TIME_GAP = 5 * 60 * 1000 // 时间分隔间隔（5 分钟）
const toast = useToast()
const userStore = useUserStore()
const pagingRef = ref<any>() // 分页组件引用
const messageList = ref<ChatMessage[]>([]) // 消息列表（最新在前）
const firstPageLoading = ref(false) // 首屏消息加载状态
const pendingLatestMessages = ref<ChatMessage[]>([]) // 首屏加载期间待追加消息
const cellStyle = ref<Record<string, string>>({ transform: 'scaleY(-1)' }) // 聊天记录模式单元格倒置样式
const historyMaxId = ref<number>() // 历史消息游标（已加载最早消息编号）
const historyLoadFailed = ref(false) // 删除清空后的历史补拉失败状态
const groupMembers = ref<ImGroupMemberRespVO[]>([]) // 群成员
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

const conversationType = computed(() => Number(props.type || ImConversationType.PRIVATE)) // 当前会话类型
const targetId = computed(() => Number(props.targetId)) // 当前会话目标
const currentCcid = computed(() => getClientConversationId(conversationType.value, targetId.value)) // 当前会话主键
const pageTitle = computed(() => props.title ? decodeURIComponent(props.title) : '聊天') // 页面标题

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
  return messageList.value
    .filter(item => selectedIds.value.includes(messageKey(item)))
    .reverse()
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
      const nextMessages = messageList.value.filter(item => !keys.has(messageKey(item)))
      pagingRef.value?.resetTotalData(nextMessages)
      if (nextMessages.length === 0) {
        loadOlderMessagesAfterClear()
      }
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

/** 查询历史消息 */
async function queryMessages(maxId?: number, limit = PAGE_SIZE) {
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
    const messages = normalizeMessages(await queryMessages(historyMaxId.value, PAGE_SIZE))
    if (messages.length) {
      historyMaxId.value = messages.at(-1)?.id
    }
    const mergedMessages = normalizeMessages([...messageList.value, ...messages])
      .filter((message, index, rows) => rows.findIndex(item => isSameMessage(item, message)) === index)
    pagingRef.value?.resetTotalData(mergedMessages)
  } catch {
    historyLoadFailed.value = true
  }
}

/** 空状态重新加载 */
function handleEmptyViewReload(callback: (reload?: boolean) => void) {
  if (!historyLoadFailed.value) {
    callback(true)
    return
  }
  callback(false)
  loadOlderMessagesAfterClear()
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
    const maxId = isFirstPage ? undefined : historyMaxId.value
    const data = await queryMessages(maxId, pageSize)
    const messages = normalizeMessages(data)
    if (messages.length) {
      historyMaxId.value = messages.at(-1)?.id
    }
    await pagingRef.value?.complete(messages)
    querySucceeded = true
  } catch {
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
  }
}

/** 加载群成员 */
async function loadGroupMembers() {
  if (conversationType.value !== ImConversationType.GROUP || !targetId.value) {
    return
  }
  groupMembers.value = await getGroupMemberList(targetId.value)
}

/** 标记已读 */
async function markRead(latest = messageList.value[0]) {
  if (!latest?.id) {
    return
  }
  if (conversationType.value === ImConversationType.GROUP) {
    await readGroupMessages(targetId.value, latest.id)
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
    const nextMessages = [...messageList.value]
    nextMessages[index] = recalled as ChatMessage
    pagingRef.value?.resetTotalData(nextMessages)
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
  addLatestMessage(message)
  // 自己发的消息 WebSocket 不会回推，手动同步到会话列表（更新摘要 + 落库 + 重排）
  const incoming = buildIncomingMessage(conversationType.value, message)
  if (incoming) {
    applyIncomingMessage(incoming)
  }
  if (quote && replyTarget.value === quote) {
    clearReplyTarget()
  }
}

/** 输入区发送：转发给 sendRawMessage */
function handleSend(data: SendData) {
  return sendRawMessage(data.type, data.payload, data.options)
}

/** 规范化聊天记录顺序：最新消息在前 */
function normalizeMessages(data: ChatMessage[]) {
  return [...data].sort((a, b) => (b.id || 0) - (a.id || 0))
}

/** 时间转毫秒 */
function toMillis(time?: number | string) {
  if (!time) {
    return 0
  }
  return typeof time === 'number' ? time : new Date(time).getTime()
}

/** 是否展示时间分隔（最早一条或与更早消息间隔超过 5 分钟） */
function shouldShowTime(index: number) {
  const current = messageList.value[index]
  const older = messageList.value[index + 1]
  return !older || toMillis(current.sendTime) - toMillis(older.sendTime) > MESSAGE_TIME_GAP
}

/** 是否为同一条消息 */
function isSameMessage(left: ChatMessage, right: ChatMessage) {
  return !!((right.id && left.id === right.id)
    || (right.clientMessageId && left.clientMessageId === right.clientMessageId))
}

/** 去重后追加最新消息并滚动到底部 */
function addLatestMessage(message: ChatMessage) {
  if (messageList.value.some(item => isSameMessage(item, message))
    || pendingLatestMessages.value.some(item => isSameMessage(item, message))) {
    return false
  }
  if (firstPageLoading.value) {
    pendingLatestMessages.value.push(message)
    return true
  }
  if (pagingRef.value) {
    pagingRef.value.addChatRecordData(message)
  } else {
    messageList.value = [message, ...messageList.value]
  }
  return true
}

/** 追加首屏加载期间收到的新消息 */
function flushPendingLatestMessages() {
  firstPageLoading.value = false
  const messages = normalizeMessages(pendingLatestMessages.value).reverse()
  pendingLatestMessages.value = []
  messages.forEach(message => addLatestMessage(message))
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
  markRead(payload)
}

/** 初始化 */
onMounted(() => {
  if (!targetId.value) {
    toast.show('会话参数不完整')
    return
  }
  uni.$on('im:message', onIncoming)
  loadGroupMembers()
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
