<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      placeholder safe-area-inset-top fixed
    >
      <template #left>
        <view class="flex items-center gap-12rpx">
          <view class="h-56rpx w-56rpx flex items-center justify-center" @click.stop="handleBack">
            <wd-icon name="left" size="40rpx" color="#333" />
          </view>
          <view class="h-56rpx w-56rpx flex items-center justify-center" @click.stop="handleConversationMore">
            <wd-icon name="more" size="38rpx" color="#333" />
          </view>
        </view>
      </template>
      <template #title>
        <view class="max-w-400rpx flex items-center justify-center" @click="conversationVisible = true">
          <text class="truncate text-32rpx text-[#333] font-semibold">
            {{ activeConversation?.title || 'AI 助手' }}
          </text>
        </view>
      </template>
    </wd-navbar>

    <!-- 消息列表 -->
    <view class="min-h-0 flex-1 overflow-hidden">
      <ChatMessageList
        :messages="displayMessageList"
        :active-conversation="activeConversation"
        :in-progress="conversationInProgress"
        :scroll-into-view="scrollIntoView"
        :suggestions="promptSuggestions"
        @suggestion="handleSuggestion"
        @message-more="handleMessageMore"
      />
    </view>

    <!-- 输入栏 -->
    <view class="shrink-0">
      <ChatInput
        v-model:prompt="prompt"
        v-model:attachment-urls="attachmentUrls"
        v-model:enable-context="enableContext"
        v-model:enable-web-search="enableWebSearch"
        :in-progress="conversationInProgress"
        @send="handleSend"
        @stop="stopStream"
      />
    </view>

    <!-- 对话列表 -->
    <ConversationDrawer
      v-model="conversationVisible"
      :conversations="conversationList"
      :active-conversation-id="String(activeConversation?.id || '')"
      @select="handleSelectConversation"
      @more="handleConversationItemMore"
      @new="handleNewConversation"
      @role="handleOpenRolePicker"
      @clear="handleClearUnpinnedConversations"
    />

    <!-- 角色选择 -->
    <RolePicker v-model="rolePickerVisible" @select="handleRoleSelect" />

    <ConversationSettings
      v-model="settingsVisible"
      v-model:form="settingsForm"
      :loading="settingsLoading"
      @save="handleSaveSettings"
    />

    <!-- 对话操作菜单 -->
    <wd-action-sheet
      v-model="conversationActionVisible"
      :actions="conversationActions"
      @select="handleConversationAction"
    />
    <!-- 新建对话菜单 -->
    <wd-action-sheet
      v-model="newConversationActionVisible"
      :actions="newConversationActions"
      @select="handleNewConversationAction"
    />
    <!-- 对话列表项操作菜单 -->
    <wd-action-sheet
      v-model="conversationItemActionVisible"
      :actions="conversationItemActions"
      @select="handleConversationItemAction"
    />
    <!-- 消息操作菜单 -->
    <wd-action-sheet
      v-model="messageActionVisible"
      :actions="messageActions"
      @select="handleMessageAction"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ChatConversation } from '@/api/ai/chat/conversation'
import type { ChatMessage } from '@/api/ai/chat/message'
import type { ChatRole } from '@/api/ai/model/chatRole'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  createChatConversationMy,
  deleteChatConversationMy,
  deleteChatConversationMyByUnpinned,
  getChatConversationMy,
  getChatConversationMyList,
  updateChatConversationMy,
} from '@/api/ai/chat/conversation'
import {
  deleteByConversationId,
  deleteChatMessage,
  getChatMessageListByConversationId,
  sendChatMessageStream,
} from '@/api/ai/chat/message'
import { navigateBackPlus } from '@/utils'
import ChatInput from './components/chat-input.vue'
import ChatMessageList from './components/chat-message-list.vue'
import ConversationDrawer from './components/conversation-drawer.vue'
import ConversationSettings from './components/conversation-settings.vue'
import RolePicker from './components/role-picker.vue'

const AI_CHAT_LAST_CONVERSATION_ID_KEY = 'ai:chat:last-conversation-id'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const conversationList = ref<ChatConversation[]>([]) // 对话列表
const activeConversation = ref<ChatConversation>() // 当前对话
const messageList = ref<ChatMessage[]>([]) // 消息列表
const conversationVisible = ref(false) // 对话弹窗显示状态
const settingsVisible = ref(false) // 设置弹窗显示状态
const rolePickerVisible = ref(false) // 角色弹窗显示状态
const conversationActionVisible = ref(false) // 对话操作菜单
const newConversationActionVisible = ref(false) // 新建对话菜单
const conversationItemActionVisible = ref(false) // 对话列表项操作菜单
const messageActionVisible = ref(false) // 消息操作菜单
const settingsLoading = ref(false) // 设置提交状态
const conversationInProgress = ref(false) // 对话生成状态
const prompt = ref('') // 输入内容
const attachmentUrls = ref<string[]>([]) // 待发送附件
const enableContext = ref(true) // 是否启用上下文
const enableWebSearch = ref(false) // 是否启用联网搜索
const streamController = ref<AbortController>() // 流式请求控制器
const scrollIntoView = ref('bottom-anchor') // 滚动锚点
const actionConversation = ref<ChatConversation>() // 当前操作的对话
const actionMessage = ref<ChatMessage>() // 当前操作的消息
let initialConversationId = String(uni.getStorageSync(AI_CHAT_LAST_CONVERSATION_ID_KEY) || '') || undefined // 上次打开的对话编号
const promptSuggestions = [ // 空状态推荐问题
  '帮我梳理今天最重要的三件事',
  '用通俗的方式解释一个复杂概念',
  '帮我润色一段准备发送的文字',
]
const settingsForm = ref<ChatConversation>({
  id: undefined,
  systemMessage: '',
  modelId: undefined as number | undefined,
  temperature: 0.7,
  maxTokens: 4096,
  maxContexts: 10,
}) // 对话设置表单
const displayMessageList = computed(() => {
  if (messageList.value.length > 0) {
    return messageList.value
  }
  if (!activeConversation.value?.systemMessage) {
    return []
  }
  return [{
    conversationId: activeConversation.value.id,
    type: 'system',
    content: activeConversation.value.systemMessage,
  }] as ChatMessage[]
})
const newConversationActions = [ // 新建对话方式
  { name: '空白对话', value: 'blank' },
  { name: '选择聊天角色', value: 'role' },
]
const conversationActions = computed(() => { // 页面级对话操作
  const actions = [
    { name: '会话列表', value: 'list' },
    { name: '新建对话', value: 'new' },
    { name: '角色仓库', value: 'role' },
  ]
  if (activeConversation.value?.id) {
    actions.push(
      { name: '对话设置', value: 'settings' },
      { name: '清空消息', value: 'clear' },
      { name: '删除对话', value: 'delete' },
    )
  }
  return actions
})
const conversationItemActions = computed(() => { // 对话列表项操作
  const actions = [{
    name: actionConversation.value?.pinned ? '取消置顶' : '置顶',
    value: 'toggle-pinned',
  }]
  if (
    actionConversation.value?.id
    && String(actionConversation.value.id) === String(activeConversation.value?.id)
  ) {
    actions.unshift(
      { name: '对话设置', value: 'settings' },
      { name: '清空消息', value: 'clear' },
    )
  }
  actions.push(
    { name: '重命名', value: 'rename' },
    { name: '删除', value: 'delete' },
  )
  return actions
})
const messageActions = computed(() => { // 消息操作
  const actions = [{ name: '复制', value: 'copy' }]
  if (actionMessage.value?.id) {
    actions.push({ name: '删除', value: 'delete' })
  }
  if (actionMessage.value?.type === 'user') {
    actions.push(
      { name: '编辑', value: 'edit' },
      { name: '重发', value: 'resend' },
    )
  }
  return actions
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 打开对话操作菜单 */
function handleConversationMore() {
  conversationActionVisible.value = true
}

/** 对话操作 */
function handleConversationAction({ item }: { item: { value: string } }) {
  conversationActionVisible.value = false
  if (item.value === 'list') {
    conversationVisible.value = true
  } else if (item.value === 'new') {
    handleNewConversation()
  } else if (item.value === 'role') {
    handleOpenRolePicker()
  } else if (item.value === 'settings') {
    void openConversationSettings()
  } else if (item.value === 'clear') {
    void handleClearMessages()
  } else if (item.value === 'delete' && activeConversation.value) {
    void deleteConversation(activeConversation.value)
  }
}

/** 打开新建对话方式 */
function handleNewConversation() {
  if (conversationInProgress.value) {
    toast.warning('对话生成中，暂不能新建')
    return
  }
  conversationVisible.value = false
  newConversationActionVisible.value = true
}

/** 打开角色仓库 */
function handleOpenRolePicker() {
  conversationVisible.value = false
  rolePickerVisible.value = true
}

/** 新建对话操作 */
function handleNewConversationAction({ item }: { item: { value: string } }) {
  if (item.value === 'blank') {
    void handleCreateConversation()
  } else if (item.value === 'role') {
    rolePickerVisible.value = true
  }
}

/** 使用推荐问题 */
function handleSuggestion(content: string) {
  prompt.value = content
  void handleSend()
}

/** 加载对话列表 */
async function loadConversations() {
  try {
    conversationList.value = await getChatConversationMyList()
    if (!activeConversation.value && conversationList.value.length > 0) {
      const conversation = conversationList.value.find(item => String(item.id) === initialConversationId) || conversationList.value[0]
      initialConversationId = undefined
      await handleSelectConversation(conversation, false)
    } else if (conversationList.value.length === 0) {
      uni.removeStorageSync(AI_CHAT_LAST_CONVERSATION_ID_KEY)
    }
  } catch {
    conversationList.value = []
    activeConversation.value = undefined
    messageList.value = []
  }
}

/** 选择对话 */
async function handleSelectConversation(item: ChatConversation, closePopup = true) {
  if (conversationInProgress.value) {
    toast.warning('对话生成中，暂不能切换')
    return
  }
  activeConversation.value = item.id ? await getConversationDetail(item.id, item) : item
  if (closePopup) {
    conversationVisible.value = false
  }
  prompt.value = ''
  attachmentUrls.value = []
  if (activeConversation.value.id) {
    uni.setStorageSync(AI_CHAT_LAST_CONVERSATION_ID_KEY, String(activeConversation.value.id))
  }
  await loadMessages()
}

/** 加载对话详情 */
async function getConversationDetail(id: number, fallback?: ChatConversation) {
  try {
    return await getChatConversationMy(id)
  } catch {
    return fallback || { id }
  }
}

/** 创建对话 */
async function handleCreateConversation(roleId?: number) {
  if (conversationInProgress.value) {
    toast.warning('对话生成中，暂不能新建')
    return
  }
  const id = await createChatConversationMy(roleId ? { roleId } : undefined)
  await loadConversations()
  const conversation = conversationList.value.find(item => String(item.id) === String(id)) || { id, title: '新对话' }
  await handleSelectConversation(conversation)
}

/** 选择角色并创建对话 */
function handleRoleSelect(role: ChatRole) {
  if (!role.id) {
    return
  }
  void handleCreateConversation(role.id)
}

/** 删除指定对话 */
async function deleteConversation(conversation: ChatConversation) {
  if (!conversation.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除对话【${conversation.title || '新对话'}】吗？` })
  } catch {
    return
  }
  await deleteChatConversationMy(conversation.id)
  toast.success('删除成功')
  if (String(activeConversation.value?.id) === String(conversation.id)) {
    activeConversation.value = undefined
    messageList.value = []
  }
  await loadConversations()
}

/** 打开对话列表项操作 */
function handleConversationItemMore(conversation: ChatConversation) {
  actionConversation.value = conversation
  conversationItemActionVisible.value = true
}

/** 对话列表项操作 */
function handleConversationItemAction({ item }: { item: { value: string } }) {
  const conversation = actionConversation.value
  if (!conversation) {
    return
  }
  if (item.value === 'settings') {
    conversationVisible.value = false
    void openConversationSettings()
  } else if (item.value === 'clear') {
    void handleClearMessages()
  } else if (item.value === 'toggle-pinned') {
    void handleToggleConversationPinned(conversation)
  } else if (item.value === 'rename') {
    void handleRenameConversation(conversation)
  } else if (item.value === 'delete') {
    void deleteConversation(conversation)
  }
}

/** 修改对话置顶状态 */
async function handleToggleConversationPinned(conversation: ChatConversation) {
  await updateChatConversationMy({ id: conversation.id, pinned: !conversation.pinned })
  toast.success(conversation.pinned ? '已取消置顶' : '已置顶')
  await loadConversations()
}

/** 重命名对话 */
async function handleRenameConversation(conversation: ChatConversation) {
  let result: { value?: string | number }
  try {
    result = await dialog.prompt({
      title: '重命名对话',
      inputValue: conversation.title || '',
      inputProps: { placeholder: '请输入对话标题', maxlength: 60 },
      inputValidate: value => String(value).trim() || '对话标题不能为空',
    })
  } catch {
    return
  }
  const title = String(result.value || '').trim()
  if (!title) {
    return
  }
  await updateChatConversationMy({ id: conversation.id, title })
  conversation.title = title
  if (String(activeConversation.value?.id) === String(conversation.id)) {
    activeConversation.value = { ...activeConversation.value, title }
  }
  toast.success('重命名成功')
  await loadConversations()
}

/** 清空未置顶对话 */
async function handleClearUnpinnedConversations() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要清空全部未置顶对话吗？' })
  } catch {
    return
  }
  await deleteChatConversationMyByUnpinned()
  if (!activeConversation.value?.pinned) {
    activeConversation.value = undefined
    messageList.value = []
  }
  await loadConversations()
  toast.success('清理成功')
}

/** 清空消息 */
async function handleClearMessages() {
  if (!activeConversation.value?.id) {
    return
  }
  if (conversationInProgress.value) {
    toast.warning('对话生成中，暂不能清空')
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要清空当前对话消息吗？' })
  } catch {
    return
  }
  await deleteByConversationId(activeConversation.value.id)
  messageList.value = []
  toast.success('已清空')
}

/** 加载消息列表 */
async function loadMessages() {
  if (!activeConversation.value?.id) {
    messageList.value = []
    return
  }
  try {
    messageList.value = await getChatMessageListByConversationId(activeConversation.value.id)
    scrollToBottom()
  } catch {
    messageList.value = []
  }
}

/** 打开对话设置 */
async function openConversationSettings() {
  if (!activeConversation.value?.id) {
    return
  }
  settingsVisible.value = true
  settingsLoading.value = true
  try {
    const conversation = await getConversationDetail(activeConversation.value.id, activeConversation.value)
    Object.assign(settingsForm.value, {
      id: conversation.id,
      systemMessage: conversation.systemMessage || '',
      modelId: conversation.modelId,
      temperature: conversation.temperature ?? 0.7,
      maxTokens: Number(conversation.maxTokens ?? conversation.modelMaxTokens ?? 4096),
      maxContexts: Number(conversation.maxContexts ?? conversation.modelMaxContexts ?? 10),
    })
    activeConversation.value = conversation
  } finally {
    settingsLoading.value = false
  }
}

/** 保存对话设置 */
async function handleSaveSettings() {
  if (!settingsForm.value.id) {
    return
  }
  if (!settingsForm.value.modelId) {
    toast.warning('请选择模型')
    return
  }
  settingsLoading.value = true
  try {
    await updateChatConversationMy({ ...settingsForm.value })
    activeConversation.value = await getConversationDetail(settingsForm.value.id, activeConversation.value)
    toast.success('对话配置已更新')
    settingsVisible.value = false
    await loadConversations()
  } finally {
    settingsLoading.value = false
  }
}

/** 发送消息 */
async function handleSend() {
  // 校验发送内容
  const content = prompt.value.trim()
  if (!content) {
    return
  }

  // 首次发送时自动创建对话
  const currentAttachmentUrls = [...attachmentUrls.value]
  if (!activeConversation.value?.id) {
    await handleCreateConversation()
  }
  if (!activeConversation.value?.id) {
    return
  }

  // 插入用户消息和助手回复占位
  const conversationId = activeConversation.value.id
  prompt.value = ''
  attachmentUrls.value = []
  messageList.value.push({ type: 'user', content, attachmentUrls: currentAttachmentUrls })
  const assistantMessage: ChatMessage = { type: 'assistant', content: '' }
  messageList.value.push(assistantMessage)
  scrollToBottom()

  // 发起 SSE 流式生成
  streamController.value = new AbortController()
  conversationInProgress.value = true
  void sendChatMessageStream(
    conversationId,
    content,
    streamController.value,
    enableContext.value,
    enableWebSearch.value,
    async (res) => {
      appendStreamData(assistantMessage, parseStreamData(res.data))
      await nextTick()
      scrollToBottom()
    },
    (error) => {
      console.error('AI 对话异常', error)
      toast.error('对话生成失败')
      conversationInProgress.value = false
    },
    () => {
      conversationInProgress.value = false
      streamController.value = undefined
    },
    currentAttachmentUrls,
  ).catch(() => undefined)
}

/** 追加流式返回内容 */
function appendStreamData(assistantMessage: ChatMessage, data: any) {
  if (data === undefined) {
    return
  }
  if (typeof data === 'string') {
    assistantMessage.content = `${assistantMessage.content || ''}${data}`
    return
  }
  if (data.send) {
    const userMessage = messageList.value[messageList.value.length - 2]
    Object.assign(userMessage, data.send)
  }
  if (data.receive) {
    Object.assign(assistantMessage, {
      ...data.receive,
      content: `${assistantMessage.content || ''}${data.receive.content || ''}`,
      reasoningContent: `${assistantMessage.reasoningContent || ''}${data.receive.reasoningContent || ''}`,
    })
  }
}

/** 打开消息操作 */
function handleMessageMore(message: ChatMessage) {
  actionMessage.value = message
  messageActionVisible.value = true
}

/** 消息操作 */
function handleMessageAction({ item }: { item: { value: string } }) {
  const message = actionMessage.value
  if (!message) {
    return
  }
  if (item.value === 'copy') {
    handleCopy(message.content || '')
  } else if (item.value === 'delete') {
    void handleDeleteMessage(message)
  } else if (item.value === 'edit') {
    prompt.value = message.content || ''
  } else if (item.value === 'resend') {
    prompt.value = message.content || ''
    void handleSend()
  }
}

/** 复制内容 */
function handleCopy(content?: string) {
  if (!content) {
    return
  }
  uni.setClipboardData({ data: content })
}

/** 删除消息 */
async function handleDeleteMessage(message: ChatMessage) {
  if (!message.id) {
    return
  }
  if (conversationInProgress.value) {
    toast.warning('对话生成中，暂不能删除')
    return
  }
  await deleteChatMessage(message.id)
  toast.success('删除成功')
  await loadMessages()
}

/** 停止生成 */
function stopStream() {
  streamController.value?.abort()
  conversationInProgress.value = false
}

/** 解析流式消息 */
function parseStreamData(raw: string) {
  try {
    const result = JSON.parse(raw)
    if (result.code !== 0) {
      toast.error(result.msg || result.message || '生成失败')
      stopStream()
      return undefined
    }
    return result.data
  } catch {
    return raw
  }
}

/** 滚动到底部 */
function scrollToBottom() {
  nextTick(() => {
    scrollIntoView.value = ''
    setTimeout(() => {
      scrollIntoView.value = 'bottom-anchor'
    }, 30)
  })
}

/** 初始化 */
onMounted(() => {
  loadConversations()
})

/** 卸载 */
onUnmounted(() => {
  stopStream()
})
</script>
