import type { ConversationDO } from '@/pages-im/utils/db'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'
import type { QuoteMessage } from '@/pages-im/utils/message'
import type { Ref } from 'vue'
import type { Message } from '../types'
import { readChannelMessages } from '@/api/im/message/channel'
import { getClientConversationId } from '@/pages-im/utils/db'
import {
  readGroupMessages,
  recallGroupMessage,
  sendGroupMessage,
} from '@/api/im/message/group'
import {
  getPrivateMaxReadMessageId,
  readPrivateMessages,
  recallPrivateMessage,
  sendPrivateMessage,
} from '@/api/im/message/private'
import {
  generateClientMessageId,
  getQuoteFromMessage,
  serializeMessage,
  withQuotePayload,
} from '@/pages-im/utils/message'
import { useUserStore } from '@/store/user'
import {
  ImConversationType,
  ImMessageReceiptStatus,
  ImMessageStatus,
} from '@/pages-im/utils/constants'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useConversationStore } from '../store/conversationStore'
import {
  buildMessageDO,
  buildMessageFromDO,
  useMessageStore,
} from '../store/messageStore'
import { MESSAGE_GROUP_READ_ENABLED, MESSAGE_PRIVATE_READ_ENABLED } from '@/pages-im/utils/config'

/** 消息发送扩展选项 */
export interface SendExtOptions {
  atUserIds?: number[] // 群聊 @ 的用户编号列表
  receipt?: boolean // 是否需要消息回执
  quote?: QuoteMessage // 异步媒体上传前固定的引用消息
  quoteCaptured?: boolean // 是否已经固定并消费引用消息
}

/** 待上传媒体消息 */
export interface UploadMessageData {
  clientMessageId: string
  type: number
  payload: Record<string, any>
  options?: SendExtOptions
}

type SendMessageResponse = ImPrivateMessageRespVO | ImGroupMessageRespVO

/** 调用指定会话的消息发送接口 */
function requestConversationMessage(
  context: { conversationType: number, targetId: number },
  clientMessageId: string,
  type: number,
  content: string,
  sendOptions: SendExtOptions = {},
) {
  if (context.conversationType === ImConversationType.GROUP) {
    return sendGroupMessage({
      clientMessageId,
      groupId: context.targetId,
      type,
      content,
      atUserIds: sendOptions.atUserIds,
      receipt: MESSAGE_GROUP_READ_ENABLED ? sendOptions.receipt : false,
    })
  }
  if (context.conversationType === ImConversationType.PRIVATE) {
    return sendPrivateMessage({
      clientMessageId,
      receiverId: context.targetId,
      type,
      content,
      receipt: MESSAGE_PRIVATE_READ_ENABLED ? sendOptions.receipt ?? true : false,
    })
  }
  return Promise.reject(new Error('当前会话不支持发送消息'))
}

/** 向指定会话发送消息，并立即同步本地消息与会话摘要 */
export async function sendMessageToConversation(
  conversation: Pick<ConversationDO, 'type' | 'targetId'>,
  type: number,
  content: string,
  sendOptions: SendExtOptions = {},
  expectedUserId = useUserStore().userInfo.userId,
) {
  const isActive = () => expectedUserId > 0 && useUserStore().userInfo.userId === expectedUserId
  if (!isActive()) {
    return false
  }
  const message = await requestConversationMessage(
    { conversationType: conversation.type, targetId: conversation.targetId },
    generateClientMessageId(),
    type,
    content,
    sendOptions,
  )
  if (!isActive()) {
    return false
  }
  const messageStore = useMessageStore()
  const incoming = messageStore.buildIncomingMessage(
    conversation.type,
    message,
    expectedUserId,
  )
  if (!incoming) {
    return true
  }
  try {
    const appliedMessage = await messageStore.insertMessage(incoming, expectedUserId)
    if (isActive() && appliedMessage) {
      uni.$emit('im:message', { message: appliedMessage })
    }
  } catch (error) {
    console.warn('[IM 消息发送] 指定会话本地缓存同步失败', error)
    if (isActive()) {
      void useConversationStore().loadConversationList().catch(() => undefined)
    }
  }
  return isActive()
}

/** 管理聊天消息的本地占位、接口发送和失败重试 */
export function useMessageSender(options: {
  conversationType: Readonly<Ref<number>>
  targetId: Readonly<Ref<number>>
  replyTarget: Ref<QuoteMessage | undefined>
  addLatestMessage: (message: Message, forceBottom?: boolean) => boolean
  replaceLocalMessage: (clientMessageId: string, message: Message) => boolean
  isLocalMessageDeleted: (clientMessageId: string) => boolean
  getSendDisabledTip: () => string
  clearReplyTarget: () => void
}) {
  const toast = useToast()
  const userStore = useUserStore()
  const conversationStore = useConversationStore()
  const messageStore = useMessageStore()
  const {
    buildIncomingMessage,
    insertMessage,
    recallMessage: applyRecallMessage,
    removeMessageList,
  } = messageStore
  const {
    getConversation,
    isReportedReadPositionCovered,
    loadConversationList,
    markConversationRead,
    markConversationReadReported,
  } = conversationStore
  const uploadMessages = new Map<string, {
    context: ReturnType<typeof getSendContext>
    localMessage: Message
    options: SendExtOptions
    ready: Promise<unknown>
  }>() // 上传中的媒体消息

  /** 快照当前发送账号与会话上下文 */
  function getSendContext() {
    return {
      userId: userStore.userInfo.userId,
      conversationType: options.conversationType.value,
      targetId: options.targetId.value,
    }
  }

  /** 判断发送任务是否仍属于当前页面会话 */
  function isSendPageContext(context: ReturnType<typeof getSendContext>) {
    return isSendAccountActive(context)
      && options.conversationType.value === context.conversationType
      && options.targetId.value === context.targetId
  }

  /** 判断发送上下文是否仍允许发送 */
  function isSendContextActive(context: ReturnType<typeof getSendContext>) {
    return isSendPageContext(context)
      && conversationStore.isActiveConversation(context.conversationType, context.targetId)
  }

  /** 判断发送任务是否仍属于发起账号 */
  function isSendAccountActive(context: ReturnType<typeof getSendContext>) {
    return context.userId > 0 && userStore.userInfo.userId === context.userId
  }

  /** 判断当前会话仍处于打开状态 */
  function isReadContextActive(context: ReturnType<typeof getSendContext>) {
    return isSendContextActive(context)
      && conversationStore.isActiveConversation(context.conversationType, context.targetId)
  }

  /** 清理删除期间可能被异步持久化重新写入的消息 */
  async function cleanupDeletedMessage(
    context: ReturnType<typeof getSendContext>,
    message: { id?: number, clientMessageId?: string },
  ) {
    try {
      await removeMessageList(
        getClientConversationId(context.conversationType, context.targetId),
        [message],
        context.userId,
      )
    } catch (error) {
      console.warn('[IM 消息发送] 已删除消息本地缓存清理失败', error)
    }
  }

  /** 清理删除期间可能被异步持久化重新写入的上传消息 */
  async function cleanupDeletedUploadMessage(
    state: { context: ReturnType<typeof getSendContext>, localMessage: Message },
    message: Pick<Message, 'id' | 'clientMessageId'> = state.localMessage,
  ) {
    uploadMessages.delete(state.localMessage.clientMessageId)
    await cleanupDeletedMessage(state.context, message)
  }

  /** 等待首次持久化结束后清理已删除的上传消息 */
  async function cleanupDeletedUploadMessageAfterReady(
    state: { context: ReturnType<typeof getSendContext>, localMessage: Message, ready: Promise<unknown> },
  ) {
    uploadMessages.delete(state.localMessage.clientMessageId)
    await state.ready
    await cleanupDeletedMessage(state.context, state.localMessage)
  }

  /** 调用当前会话发送接口 */
  function requestSendMessage(
    context: ReturnType<typeof getSendContext>,
    clientMessageId: string,
    type: number,
    content: string,
    sendOptions: SendExtOptions = {},
  ) {
    return requestConversationMessage(context, clientMessageId, type, content, sendOptions)
  }

  /** 同步本地或已发送消息到会话列表与本地库 */
  async function syncSentMessage(
    message: Message | SendMessageResponse,
    context: ReturnType<typeof getSendContext>,
    local = false,
  ) {
    if (!isSendAccountActive(context)) {
      return
    }
    const incoming = local
      ? buildMessageDO(message as Message, context.conversationType)
      : buildIncomingMessage(context.conversationType, message as SendMessageResponse, context.userId)
    if (incoming) {
      const applied = await insertMessage(incoming, context.userId)
      return buildMessageFromDO(applied || incoming)
    }
  }

  /** 尽力同步本地缓存；缓存异常不改变服务端发送结果 */
  async function syncSentMessageSafely(
    message: Message | SendMessageResponse,
    context: ReturnType<typeof getSendContext>,
    local = false,
  ) {
    try {
      return await syncSentMessage(message, context, local)
    } catch (error) {
      console.warn('[IM 消息发送] 本地缓存同步失败', error)
      if (isSendAccountActive(context) && message.senderId === context.userId) {
        void loadConversationList().catch(() => undefined)
      }
      if (local) {
        return message as Message
      }
      const incoming = buildIncomingMessage(
        context.conversationType,
        message as SendMessageResponse,
        context.userId,
      )
      return incoming ? buildMessageFromDO(incoming) : undefined
    }
  }

  /** 发送原始消息，并在失败后保留可重试占位 */
  async function sendRaw(type: number, payload: Record<string, any>, sendOptions: SendExtOptions = {}) {
    const context = getSendContext()
    if (!isSendContextActive(context)) {
      return false
    }
    const quote = sendOptions.quoteCaptured ? sendOptions.quote : options.replyTarget.value
    if (!sendOptions.quoteCaptured && quote && options.replyTarget.value === quote) {
      options.clearReplyTarget()
    }
    const content = serializeMessage(withQuotePayload(payload, quote))
    const clientMessageId = generateClientMessageId()
    const localMessage: Message = {
      clientMessageId,
      senderId: context.userId,
      type,
      content,
      status: ImMessageStatus.SENDING,
      sendTime: Date.now(),
      targetId: context.targetId,
      selfSend: true,
      atUserIds: sendOptions.atUserIds,
      receiptStatus: sendOptions.receipt
        ? ImMessageReceiptStatus.PENDING
        : ImMessageReceiptStatus.NO_RECEIPT,
    }
    if (!options.addLatestMessage(localMessage, true)) {
      return false
    }
    await syncSentMessageSafely(localMessage, context, true)
    if (!isSendAccountActive(context)) {
      return false
    }
    if (options.isLocalMessageDeleted(clientMessageId)) {
      await cleanupDeletedMessage(context, localMessage)
      return false
    }
    let message: SendMessageResponse
    try {
      message = await requestSendMessage(context, clientMessageId, type, content, sendOptions)
    } catch {
      if (!isSendAccountActive(context)) {
        return false
      }
      if (options.isLocalMessageDeleted(clientMessageId)) {
        await cleanupDeletedMessage(context, localMessage)
        return false
      }
      const failedMessage: Message = { ...localMessage, status: ImMessageStatus.FAILED }
      if (isSendPageContext(context)) {
        options.replaceLocalMessage(clientMessageId, failedMessage)
      }
      await syncSentMessageSafely(failedMessage, context, true)
      if (options.isLocalMessageDeleted(clientMessageId)) {
        await cleanupDeletedMessage(context, failedMessage)
        return false
      }
      if (isSendContextActive(context)) {
        toast.error('发送失败，点击状态可重试')
      }
      return false
    }
    if (!isSendAccountActive(context)) {
      return false
    }
    if (options.isLocalMessageDeleted(clientMessageId)) {
      await cleanupDeletedMessage(context, message)
      return false
    }
    const syncedMessage = await syncSentMessageSafely(message, context)
    if (options.isLocalMessageDeleted(clientMessageId)) {
      await cleanupDeletedMessage(context, syncedMessage || message)
      return false
    }
    if (isSendPageContext(context) && syncedMessage) {
      options.replaceLocalMessage(clientMessageId, syncedMessage)
    }
    return true
  }

  /** 添加媒体上传占位消息 */
  function startUploadMessage(data: UploadMessageData) {
    const context = getSendContext()
    if (!isSendContextActive(context)) {
      return false
    }
    const sendOptions = data.options || {}
    const pendingPayload: Record<string, any> = { ...data.payload, _uploadPending: true }
    const content = serializeMessage(withQuotePayload(pendingPayload, sendOptions.quote))
    const localMessage: Message = {
      clientMessageId: data.clientMessageId,
      senderId: context.userId,
      type: data.type,
      content,
      status: ImMessageStatus.SENDING,
      sendTime: Date.now(),
      targetId: context.targetId,
      selfSend: true,
      uploadProgress: 0,
      receiptStatus: ImMessageReceiptStatus.NO_RECEIPT,
    }
    if (!options.addLatestMessage(localMessage, true)) {
      return false
    }
    const ready = syncSentMessageSafely(localMessage, context, true)
    uploadMessages.set(data.clientMessageId, { context, localMessage, options: sendOptions, ready })
    return true
  }

  /** 更新媒体上传进度 */
  function updateUploadProgress(clientMessageId: string, progress: number) {
    const state = uploadMessages.get(clientMessageId)
    if (!state || !isSendAccountActive(state.context)) {
      return
    }
    if (options.isLocalMessageDeleted(clientMessageId)) {
      void cleanupDeletedUploadMessageAfterReady(state)
      return
    }
    state.localMessage = {
      ...state.localMessage,
      uploadProgress: Math.min(100, Math.max(0, Math.round(progress))),
    }
    if (isSendPageContext(state.context)) {
      options.replaceLocalMessage(clientMessageId, state.localMessage)
    }
  }

  /** 完成媒体上传并发送消息 */
  async function completeUploadMessage(data: UploadMessageData) {
    const state = uploadMessages.get(data.clientMessageId)
    if (!state) {
      return false
    }
    if (options.isLocalMessageDeleted(data.clientMessageId)) {
      await cleanupDeletedUploadMessageAfterReady(state)
      return false
    }
    const content = serializeMessage(withQuotePayload(data.payload, state.options.quote))
    state.localMessage = { ...state.localMessage, content, uploadProgress: undefined }
    if (isSendPageContext(state.context)) {
      options.replaceLocalMessage(data.clientMessageId, state.localMessage)
    }
    await state.ready
    if (!isSendAccountActive(state.context)) {
      uploadMessages.delete(data.clientMessageId)
      return false
    }
    if (options.isLocalMessageDeleted(data.clientMessageId)) {
      await cleanupDeletedUploadMessage(state)
      return false
    }
    await syncSentMessageSafely(state.localMessage, state.context, true)
    if (!isSendAccountActive(state.context)) {
      uploadMessages.delete(data.clientMessageId)
      return false
    }
    if (options.isLocalMessageDeleted(data.clientMessageId)) {
      await cleanupDeletedUploadMessage(state)
      return false
    }
    const sendDisabledTip = isSendContextActive(state.context) ? options.getSendDisabledTip() : ''
    if (!isSendContextActive(state.context) || sendDisabledTip) {
      const failedMessage = { ...state.localMessage, status: ImMessageStatus.FAILED }
      if (isSendPageContext(state.context)) {
        options.replaceLocalMessage(data.clientMessageId, failedMessage)
        if (isSendContextActive(state.context) && sendDisabledTip) {
          toast.show(sendDisabledTip)
        }
      }
      await syncSentMessageSafely(failedMessage, state.context, true)
      if (options.isLocalMessageDeleted(data.clientMessageId)) {
        await cleanupDeletedUploadMessage(state, failedMessage)
        return false
      }
      uploadMessages.delete(data.clientMessageId)
      return false
    }
    let response: SendMessageResponse
    try {
      response = await requestSendMessage(
        state.context,
        data.clientMessageId,
        data.type,
        content,
        state.options,
      )
    } catch {
      if (options.isLocalMessageDeleted(data.clientMessageId)) {
        await cleanupDeletedUploadMessage(state)
        return false
      }
      const failedMessage = { ...state.localMessage, status: ImMessageStatus.FAILED }
      if (isSendPageContext(state.context)) {
        options.replaceLocalMessage(data.clientMessageId, failedMessage)
        if (isSendContextActive(state.context)) {
          toast.error('发送失败，点击状态可重试')
        }
      }
      await syncSentMessageSafely(failedMessage, state.context, true)
      if (options.isLocalMessageDeleted(data.clientMessageId)) {
        await cleanupDeletedUploadMessage(state, failedMessage)
        return false
      }
      uploadMessages.delete(data.clientMessageId)
      return false
    }
    if (options.isLocalMessageDeleted(data.clientMessageId)) {
      await cleanupDeletedUploadMessage(state)
      return false
    }
    const syncedMessage = await syncSentMessageSafely(response, state.context)
    if (options.isLocalMessageDeleted(data.clientMessageId)) {
      await cleanupDeletedUploadMessage(state, syncedMessage || state.localMessage)
      return false
    }
    if (isSendPageContext(state.context) && syncedMessage) {
      options.replaceLocalMessage(data.clientMessageId, syncedMessage)
    }
    uploadMessages.delete(data.clientMessageId)
    return true
  }

  /** 标记媒体上传失败 */
  async function failUploadMessage(clientMessageId: string) {
    const state = uploadMessages.get(clientMessageId)
    if (!state) {
      return
    }
    if (options.isLocalMessageDeleted(clientMessageId)) {
      await cleanupDeletedUploadMessageAfterReady(state)
      return
    }
    const payload = JSON.parse(state.localMessage.content || '{}') as Record<string, any>
    const { url: _localUrl, coverUrl: _localCoverUrl, ...persistedPayload } = payload
    const failedMessage: Message = {
      ...state.localMessage,
      content: serializeMessage({ ...persistedPayload, _uploadPending: false, _uploadFailed: true }),
      status: ImMessageStatus.FAILED,
      uploadProgress: undefined,
    }
    if (isSendPageContext(state.context)) {
      options.replaceLocalMessage(clientMessageId, failedMessage)
      if (isSendContextActive(state.context)) {
        toast.error('上传失败，请重新选择文件')
      }
    }
    await state.ready
    if (!isSendAccountActive(state.context) || options.isLocalMessageDeleted(clientMessageId)) {
      if (options.isLocalMessageDeleted(clientMessageId)) {
        await cleanupDeletedUploadMessage(state)
      } else {
        uploadMessages.delete(clientMessageId)
      }
      return
    }
    await syncSentMessageSafely(failedMessage, state.context, true)
    if (options.isLocalMessageDeleted(clientMessageId)) {
      await cleanupDeletedUploadMessage(state, failedMessage)
      return
    }
    uploadMessages.delete(clientMessageId)
  }

  /** 重试发送失败的消息 */
  async function retryMessage(item: Message) {
    if (item.status !== ImMessageStatus.FAILED) {
      return
    }
    const context = getSendContext()
    const uploadState = JSON.parse(item.content || '{}') as {
      _uploadFailed?: boolean
      _uploadPending?: boolean
    }
    if (uploadState._uploadFailed || uploadState._uploadPending) {
      toast.show('本地临时文件已失效，请重新选择文件')
      return
    }
    const quote = getQuoteFromMessage(item.content)
    const sending: Message = { ...item, status: ImMessageStatus.SENDING }
    options.replaceLocalMessage(item.clientMessageId, sending)
    await syncSentMessageSafely(sending, context, true)
    if (!isSendAccountActive(context)) {
      return
    }
    if (options.isLocalMessageDeleted(item.clientMessageId)) {
      await cleanupDeletedMessage(context, sending)
      return
    }
    let message: SendMessageResponse
    try {
      const sendOptions: SendExtOptions = {
        atUserIds: item.atUserIds,
        receipt: item.receiptStatus === ImMessageReceiptStatus.PENDING,
      }
      message = await requestSendMessage(context, item.clientMessageId, item.type, item.content, sendOptions)
    } catch {
      if (!isSendAccountActive(context)) {
        return
      }
      if (options.isLocalMessageDeleted(item.clientMessageId)) {
        await cleanupDeletedMessage(context, item)
        return
      }
      if (isSendPageContext(context)) {
        options.replaceLocalMessage(item.clientMessageId, item)
      }
      await syncSentMessageSafely(item, context, true)
      if (options.isLocalMessageDeleted(item.clientMessageId)) {
        await cleanupDeletedMessage(context, item)
        return
      }
      if (isSendContextActive(context)) {
        toast.error('重试失败')
      }
      return
    }
    if (!isSendAccountActive(context)) {
      return
    }
    if (options.isLocalMessageDeleted(item.clientMessageId)) {
      await cleanupDeletedMessage(context, message)
      return
    }
    const syncedMessage = await syncSentMessageSafely(message, context)
    if (options.isLocalMessageDeleted(item.clientMessageId)) {
      await cleanupDeletedMessage(context, syncedMessage || message)
      return
    }
    if (isSendPageContext(context) && syncedMessage) {
      options.replaceLocalMessage(item.clientMessageId, syncedMessage)
    }
    if (isSendContextActive(context)
      && quote?.messageId
      && options.replyTarget.value?.messageId === quote.messageId) {
      options.clearReplyTarget()
    }
  }

  /** 标记当前会话已读，并按会话类型上报服务端 */
  async function readActive(latestMessageId = 0) {
    const context = getSendContext()
    if (!isReadContextActive(context)) {
      return
    }
    const conversation = getConversation(context.conversationType, context.targetId)
    const messageId = Math.max(latestMessageId, conversation?.lastMessageId || 0)
    if (!messageId) {
      return
    }
    const readReported = isReportedReadPositionCovered(
      context.conversationType,
      context.targetId,
      messageId,
    )
    await markConversationRead(
      context.conversationType,
      context.targetId,
      messageId,
      context.userId,
    )
    if (readReported || !isReadContextActive(context)) {
      return
    }
    const shouldReport = context.conversationType === ImConversationType.CHANNEL
      || (context.conversationType === ImConversationType.PRIVATE && MESSAGE_PRIVATE_READ_ENABLED)
      || (context.conversationType === ImConversationType.GROUP && MESSAGE_GROUP_READ_ENABLED)
    if (!shouldReport) {
      return
    }
    try {
      if (context.conversationType === ImConversationType.GROUP) {
        await readGroupMessages(context.targetId, messageId)
      } else if (context.conversationType === ImConversationType.CHANNEL) {
        await readChannelMessages(context.targetId, messageId)
      } else {
        await readPrivateMessages(context.targetId, messageId)
      }
      await markConversationReadReported(
        context.conversationType,
        context.targetId,
        messageId,
        context.userId,
      )
    } catch (error) {
      if (isSendAccountActive(context)) {
        console.warn('[IM 消息发送] 标记已读失败', error)
      }
    }
  }

  /** 补齐私聊对方已读位置 */
  async function syncPrivateReadStatus() {
    const context = getSendContext()
    if (context.conversationType !== ImConversationType.PRIVATE
      || !context.targetId
      || !MESSAGE_PRIVATE_READ_ENABLED
      || !isReadContextActive(context)) {
      return
    }
    const cachedMaxReadMessageId = messageStore.getPrivateReadMaxId(context.targetId)
    if (cachedMaxReadMessageId !== undefined) {
      return cachedMaxReadMessageId
    }
    try {
      const maxReadMessageId = await getPrivateMaxReadMessageId(context.targetId)
      if (!isSendAccountActive(context)) {
        return
      }
      messageStore.updatePrivateReadMaxId(context.targetId, maxReadMessageId)
      if (maxReadMessageId) {
        await messageStore.applyMessageReadReceipt({
          conversationType: ImConversationType.PRIVATE,
          targetId: context.targetId,
          privateReadMaxId: maxReadMessageId,
        }, context.userId)
      }
      return maxReadMessageId
    } catch (error) {
      if (isSendAccountActive(context)) {
        console.warn('[IM 消息发送] 拉取对方已读位置失败', { peerId: context.targetId }, error)
      }
    }
  }

  /** 撤回消息并同步本地终态 */
  async function recall(item: Message) {
    if (!item.id) {
      return false
    }
    const context = getSendContext()
    if (!isSendContextActive(context)) {
      return false
    }
    const signal = context.conversationType === ImConversationType.GROUP
      ? await recallGroupMessage(item.id)
      : await recallPrivateMessage(item.id)
    if (!isSendAccountActive(context)) {
      return false
    }
    await applyRecallMessage(
      context.conversationType,
      context.targetId,
      signal.content,
      context.userId,
    )
    return isSendContextActive(context)
  }

  return {
    sendRaw,
    startUploadMessage,
    updateUploadProgress,
    completeUploadMessage,
    failUploadMessage,
    retryMessage,
    readActive,
    syncPrivateReadStatus,
    recall,
  }
}
