<template>
  <view class="yd-page-container yd-page-container-paging bg-[#f5f7fb]">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="activeConversation?.title || 'AI 对话'"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 对话工具栏 -->
    <view class="flex flex-wrap items-center gap-12rpx bg-white px-24rpx py-16rpx">
      <wd-button class="flex-1" size="small" variant="plain" @click="conversationVisible = true">
        对话列表
      </wd-button>
      <wd-button
        v-if="activeConversation"
        size="small"
        variant="plain"
        @click="openConversationSettings"
      >
        设置
      </wd-button>
      <wd-button
        v-if="activeConversation"
        size="small"
        variant="plain"
        @click="handleClearMessages"
      >
        清空
      </wd-button>
      <wd-button size="small" type="primary" @click="handleCreateConversation">
        新对话
      </wd-button>
      <wd-button
        v-if="activeConversation"
        size="small"
        type="danger"
        variant="plain"
        @click="handleDeleteConversation"
      >
        删除
      </wd-button>
    </view>

    <!-- 消息列表 -->
    <scroll-view
      scroll-y
      class="min-h-0 flex-1 px-24rpx py-20rpx"
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view v-if="!activeConversation" class="mt-120rpx text-center text-28rpx text-[#999]">
        创建或选择一个对话开始聊天
      </view>
      <view v-else-if="displayMessageList.length === 0" class="mt-120rpx text-center text-28rpx text-[#999]">
        还没有消息，试试问一个问题
      </view>
      <view
        v-for="(message, index) in displayMessageList"
        :id="`msg-${index}`"
        :key="`${message.id || index}-${message.type}`"
        class="mb-28rpx flex flex-col"
        :class="message.type === 'user' ? 'items-end' : 'items-start'"
      >
        <view
          class="max-w-[80%] rounded-12rpx px-24rpx py-18rpx text-28rpx leading-44rpx"
          :class="message.type === 'user' ? 'bg-[#1677ff] text-white' : 'bg-white text-[#333]'"
        >
          <view class="whitespace-pre-wrap">
            {{ message.content || '' }}
          </view>
          <view v-if="message.reasoningContent" class="mt-12rpx border-t border-[#eee] pt-12rpx text-24rpx opacity-80">
            <view class="mb-4rpx font-medium">
              推理过程
            </view>
            <view class="whitespace-pre-wrap">
              {{ message.reasoningContent }}
            </view>
          </view>
          <view v-if="message.attachmentUrls?.length" class="mt-12rpx border-t border-[#eee] pt-12rpx text-24rpx opacity-90">
            <view class="mb-6rpx font-medium">
              附件
            </view>
            <view
              v-for="url in message.attachmentUrls"
              :key="url"
              class="truncate underline"
              @click="handleCopy(url)"
            >
              {{ url }}
            </view>
          </view>
          <view v-if="message.segments?.length" class="mt-12rpx border-t border-[#eee] pt-12rpx text-24rpx opacity-90">
            <view class="mb-6rpx font-medium">
              知识库召回
            </view>
            <view
              v-for="segment in message.segments"
              :key="segment.id"
              class="mb-8rpx rounded-8rpx bg-[rgba(0,0,0,0.04)] p-12rpx"
            >
              <view class="mb-4rpx opacity-70">
                {{ segment.documentName || `文档 #${segment.documentId}` }}
              </view>
              <view class="line-clamp-3">
                {{ segment.content || '-' }}
              </view>
            </view>
          </view>
          <view v-if="message.webSearchPages?.length" class="mt-12rpx border-t border-[#eee] pt-12rpx text-24rpx opacity-90">
            <view class="mb-6rpx font-medium">
              联网搜索
            </view>
            <view
              v-for="page in message.webSearchPages"
              :key="page.url || page.title"
              class="mb-8rpx rounded-8rpx bg-[rgba(0,0,0,0.04)] p-12rpx"
              @click="handleCopy(page.url)"
            >
              <view class="line-clamp-1 font-medium">
                {{ page.title || page.name || '-' }}
              </view>
              <view class="line-clamp-2 opacity-70">
                {{ page.summary || page.snippet || page.url || '-' }}
              </view>
            </view>
          </view>
        </view>
        <view class="mt-8rpx flex items-center gap-12rpx text-22rpx text-[#999]">
          <text v-if="message.createTime">{{ formatDateTime(message.createTime) }}</text>
          <wd-button size="small" variant="plain" @click="handleMessageMore(message)">
            操作
          </wd-button>
        </view>
      </view>
      <view id="bottom-anchor" />
    </scroll-view>

    <!-- 输入栏 -->
    <view class="bg-white px-24rpx py-18rpx">
      <view class="mb-12rpx flex items-center gap-24rpx text-24rpx text-[#666]">
        <wd-switch v-model="enableContext" size="18px" />
        <text>上下文</text>
        <wd-switch v-model="enableWebSearch" size="18px" />
        <text>联网搜索</text>
      </view>
      <view class="flex items-end gap-16rpx">
        <wd-textarea
          v-model="prompt"
          class="min-w-0 flex-1"
          placeholder="问我任何问题..."
          :maxlength="2000"
          :autosize="{ minRows: 2, maxRows: 4 }"
          clearable
        />
        <wd-button
          v-if="!conversationInProgress"
          type="primary"
          :disabled="!prompt?.trim()"
          @click="handleSend"
        >
          发送
        </wd-button>
        <wd-button v-else type="danger" @click="stopStream">
          停止
        </wd-button>
      </view>
    </view>

    <!-- 对话列表 -->
    <wd-popup v-model="conversationVisible" position="left" custom-style="width: 78vw; height: 100vh;">
      <view class="h-full flex flex-col bg-[#f5f7fb]">
        <view class="bg-white p-24rpx text-32rpx text-[#333] font-semibold">
          对话列表
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1 p-20rpx">
          <view
            v-for="item in conversationList"
            :key="item.id"
            class="mb-16rpx rounded-12rpx bg-white p-20rpx"
            :class="item.id === activeConversation?.id ? 'border border-[#1677ff]' : ''"
            @click="handleSelectConversation(item)"
          >
            <view class="text-28rpx text-[#333] font-medium">
              {{ item.title || '新对话' }}
            </view>
            <view class="mt-8rpx text-22rpx text-[#999]">
              {{ item.modelName || item.model || '默认模型' }}
            </view>
          </view>
          <view v-if="conversationList.length === 0" class="py-80rpx text-center text-26rpx text-[#999]">
            暂无对话
          </view>
        </scroll-view>
        <view class="p-20rpx">
          <wd-button block type="primary" @click="handleCreateConversation">
            新建对话
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 设置弹窗 -->
    <wd-popup v-model="settingsVisible" position="bottom" custom-style="max-height: 86vh; overflow: auto;">
      <view v-if="settingsVisible" class="bg-white">
        <view class="border-b border-[#eee] p-28rpx text-32rpx font-semibold">
          对话设定
        </view>
        <view class="p-24rpx">
          <wd-form :model="settingsForm">
            <wd-cell-group border>
              <wd-form-item title="角色设定" title-width="220rpx">
                <wd-textarea
                  v-model="settingsForm.systemMessage"
                  placeholder="请输入角色设定"
                  :maxlength="2000"
                  show-word-limit
                  clearable
                />
              </wd-form-item>
              <ModelFormPicker
                v-model="settingsForm.modelId"
                label-width="220rpx"
                :model-type="AiModelTypeEnum.CHAT"
              />
              <wd-form-item title="温度参数" title-width="220rpx">
                <wd-input-number v-model="settingsForm.temperature" :min="0" :max="2" :step="0.1" />
              </wd-form-item>
              <wd-form-item title="回复 Token" title-width="220rpx">
                <wd-input-number v-model="settingsForm.maxTokens" :min="0" :max="8192" />
              </wd-form-item>
              <wd-form-item title="上下文数量" title-width="220rpx">
                <wd-input-number v-model="settingsForm.maxContexts" :min="0" :max="20" />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
        </view>
        <view class="yd-detail-footer">
          <view class="yd-detail-footer-actions">
            <wd-button class="flex-1" variant="plain" @click="settingsVisible = false">
              取消
            </wd-button>
            <wd-button class="flex-1" type="primary" :loading="settingsLoading" @click="handleSaveSettings">
              保存
            </wd-button>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ChatConversationVO } from '@/api/ai/chat/conversation'
import type { ChatMessageVO } from '@/api/ai/chat/message'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import {
  createChatConversationMy,
  deleteChatConversationMy,
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
import ModelFormPicker from '@/pages-ai/model/model/components/model-form-picker.vue'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { AiModelTypeEnum } from '@/pages-ai/utils/constants'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const conversationList = ref<ChatConversationVO[]>([]) // 对话列表
const activeConversation = ref<ChatConversationVO>() // 当前对话
const messageList = ref<ChatMessageVO[]>([]) // 消息列表
const conversationVisible = ref(false) // 对话弹窗显示状态
const settingsVisible = ref(false) // 设置弹窗显示状态
const settingsLoading = ref(false) // 设置提交状态
const conversationInProgress = ref(false) // 对话生成状态
const prompt = ref('') // 输入内容
const enableContext = ref(true) // 是否启用上下文
const enableWebSearch = ref(false) // 是否启用联网搜索
const streamController = ref<AbortController>() // 流式请求控制器
const scrollIntoView = ref('bottom-anchor') // 滚动锚点
const settingsForm = reactive({
  id: undefined as number | undefined,
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
    id: 0,
    conversationId: activeConversation.value.id,
    type: 'system',
    content: activeConversation.value.systemMessage,
  }] as ChatMessageVO[]
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/index/index')
}

/** 加载对话列表 */
async function loadConversations() {
  try {
    conversationList.value = await getChatConversationMyList()
    if (!activeConversation.value && conversationList.value.length > 0) {
      await handleSelectConversation(conversationList.value[0], false)
    }
  } catch {
    conversationList.value = []
    activeConversation.value = undefined
    messageList.value = []
  }
}

/** 选择对话 */
async function handleSelectConversation(item: ChatConversationVO, closePopup = true) {
  if (conversationInProgress.value) {
    toast.warning('对话生成中，暂不能切换')
    return
  }
  activeConversation.value = item.id ? await getConversationDetail(item.id, item) : item
  if (closePopup) {
    conversationVisible.value = false
  }
  await loadMessages()
}

/** 加载对话详情 */
async function getConversationDetail(id: number, fallback?: ChatConversationVO) {
  try {
    return await getChatConversationMy(id)
  } catch {
    return fallback || { id }
  }
}

/** 创建对话 */
async function handleCreateConversation() {
  if (conversationInProgress.value) {
    toast.warning('对话生成中，暂不能新建')
    return
  }
  try {
    const id = await createChatConversationMy()
    await loadConversations()
    const conversation = conversationList.value.find(item => item.id === id) || await Promise.resolve({ id, title: '新对话' })
    await handleSelectConversation(conversation)
  } catch {
    // 请求层已统一提示错误，这里仅保持页面可用。
  }
}

/** 删除对话 */
async function handleDeleteConversation() {
  if (!activeConversation.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除当前对话吗？' })
  } catch {
    return
  }
  await deleteChatConversationMy(activeConversation.value.id)
  toast.success('删除成功')
  activeConversation.value = undefined
  messageList.value = []
  await loadConversations()
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
    Object.assign(settingsForm, {
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
  if (!settingsForm.id) {
    return
  }
  if (!settingsForm.modelId) {
    toast.warning('请选择模型')
    return
  }
  settingsLoading.value = true
  try {
    await updateChatConversationMy({ ...settingsForm })
    activeConversation.value = await getConversationDetail(settingsForm.id, activeConversation.value)
    toast.success('对话配置已更新')
    settingsVisible.value = false
    await loadConversations()
  } finally {
    settingsLoading.value = false
  }
}

/** 发送消息 */
async function handleSend() {
  const content = prompt.value.trim()
  if (!content) {
    return
  }
  if (!activeConversation.value?.id) {
    await handleCreateConversation()
  }
  if (!activeConversation.value?.id) {
    return
  }

  const conversationId = activeConversation.value.id
  prompt.value = ''
  messageList.value.push({ type: 'user', content })
  const assistantMessage: ChatMessageVO = { type: 'assistant', content: '' }
  messageList.value.push(assistantMessage)
  scrollToBottom()

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
  )
}

/** 追加流式返回内容 */
function appendStreamData(assistantMessage: ChatMessageVO, data: any) {
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
function handleMessageMore(message: ChatMessageVO) {
  const actions = ['复制']
  if (message.id && message.id > 0) {
    actions.push('删除')
  }
  if (message.type === 'user') {
    actions.push('编辑', '重发')
  }
  uni.showActionSheet({
    itemList: actions,
    success: ({ tapIndex }) => {
      const action = actions[tapIndex]
      if (action === '复制') {
        handleCopy(message.content || '')
      } else if (action === '删除') {
        handleDeleteMessage(message)
      } else if (action === '编辑') {
        prompt.value = message.content || ''
      } else if (action === '重发') {
        prompt.value = message.content || ''
        handleSend()
      }
    },
    fail: () => {
      // 用户取消操作时不需要提示。
    },
  })
}

/** 复制内容 */
function handleCopy(content?: string) {
  if (!content) {
    return
  }
  uni.setClipboardData({ data: content })
}

/** 删除消息 */
async function handleDeleteMessage(message: ChatMessageVO) {
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
    if (result.code !== 0 && result.code !== 200) {
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
