import type { ConversationDO } from '@/pages-im/utils/db'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'
import type { QuoteMessage } from '@/pages-im/utils/message'
import type { Ref } from 'vue'
import type { Message } from '../types'
import { readChannelMessages } from '@/api/im/message/channel'
import { getClientConversationId, getDb, initDb } from '@/pages-im/utils/db'
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
import {
  ImConversationType,
  ImMessageReceiptStatus,
  ImMessageStatus,
} from '@/pages-im/utils/constants'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useUserStore } from '@/store/user'
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
) {
  const db = await initDb()
  const currentUserId = useUserStore().userInfo.userId
  const message = await requestConversationMessage(
    { conversationType: conversation.type, targetId: conversation.targetId },
    generateClientMessageId(),
    type,
    content,
    sendOptions,
  )
  const messageStore = useMessageStore()
  const incoming = messageStore.buildIncomingMessage(
    conversation.type,
    message,
    currentUserId,
  )
  if (!incoming) {
    return true
  }
  try {
    const appliedMessage = await messageStore.insertMessage(incoming, false, db)
    if (appliedMessage) {
      uni.$emit('im:message', { message: appliedMessage })
    }
  } catch (error) {
    console.warn('[IM 消息发送] 指定会话本地缓存同步失败', error)
    void useConversationStore().loadConversationList().catch(() => undefined)
  }
  return true
}

/** 管理聊天消息的本地占位、接口发送和失败重试 */
export function useMessageSender(options: {
  conversationType: Readonly<Ref<number>>
  targetId: Readonly<Ref<number>>
  replyTarget: Ref<QuoteMessage | undefined>
  addLatestMessage: (message: Message, forceBottom?: boolean) => boolean
  replaceLocalMessage: (clientMessageId: string, message: Message) => boolean
  isLocalMessageDeleted: (clientMessageId: string) => boolean
  clearReplyTarget: () => void
}) {
  const toast = useToast()
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
    context: ReturnType<typeof getSendTarget>
    localMessage: Message
    options: SendExtOptions
    ready: Promise<unknown>
  }>() // 上传中的媒体消息

  /** 获取当前消息发送目标 */
  function getSendTarget() {
    return {
      conversationType: options.conversationType.value,
      targetId: options.targetId.value,
      currentUserId: useUserStore().userInfo.userId,
      db: getDb(),
    }
  }

  /** 清理删除期间可能被异步持久化重新写入的消息 */
  async function cleanupDeletedMessage(
    context: ReturnType<typeof getSendTarget>,
    message: { id?: number, clientMessageId?: string },
  ) {
    try {
      await removeMessageList(
        getClientConversationId(context.conversationType, context.targetId),
        [message],
        context.db,
        context.currentUserId,
      )
    } catch (error) {
      console.warn('[IM 消息发送] 已删除消息本地缓存清理失败', error)
    }
  }

  /** 清理删除期间可能被异步持久化重新写入的上传消息 */
  async function cleanupDeletedUploadMessage(
    state: { context: ReturnType<typeof getSendTarget>, localMessage: Message },
    message: Pick<Message, 'id' | 'clientMessageId'> = state.localMessage,
  ) {
    uploadMessages.delete(state.localMessage.clientMessageId)
    await cleanupDeletedMessage(state.context, message)
  }

  /** 等待首次持久化结束后清理已删除的上传消息 */
  async function cleanupDeletedUploadMessageAfterReady(
    state: { context: ReturnType<typeof getSendTarget>, localMessage: Message, ready: Promise<unknown> },
  ) {
    uploadMessages.delete(state.localMessage.clientMessageId)
    await state.ready
    await cleanupDeletedMessage(state.context, state.localMessage)
  }

  /** 调用当前会话发送接口 */
  function requestSendMessage(
    context: ReturnType<typeof getSendTarget>,
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
    context: ReturnType<typeof getSendTarget>,
    local = false,
    waitForReplay = false,
  ) {
    const incoming = local
      ? buildMessageDO(message as Message, context.conversationType)
      : buildIncomingMessage(
          context.conversationType,
          message as SendMessageResponse,
          context.currentUserId,
        )
    if (incoming) {
      const applied = await insertMessage(incoming, waitForReplay, context.db)
      if (applied === false) {
        return
      }
      return buildMessageFromDO(applied || incoming)
    }
  }

  /** 尽力同步本地缓存；缓存异常不改变服务端发送结果 */
  async function syncSentMessageSafely(
    message: Message | SendMessageResponse,
    context: ReturnType<typeof getSendTarget>,
    local = false,
    waitForReplay = false,
  ) {
    try {
      return await syncSentMessage(message, context, local, waitForReplay)
    } catch (error) {
      console.warn('[IM 消息发送] 本地缓存同步失败', error)
      if (message.senderId === context.currentUserId) {
        void loadConversationList().catch(() => undefined)
      }
      if (local) {
        return message as Message
      }
      const incoming = buildIncomingMessage(
        context.conversationType,
        message as SendMessageResponse,
        context.currentUserId,
      )
      return incoming ? buildMessageFromDO(incoming) : undefined
    }
  }

  /** 持久化失败态，并以 Store 归约后的真实终态刷新当前页面 */
  async function syncFailedMessage(
    message: Message,
    context: ReturnType<typeof getSendTarget>,
  ) {
    const syncedMessage = await syncSentMessageSafely(message, context, true, true)
    if (syncedMessage) {
      options.replaceLocalMessage(message.clientMessageId, syncedMessage)
    }
    return syncedMessage || message
  }

  /** 发送原始消息，并在失败后保留可重试占位 */
  async function sendRaw(type: number, payload: Record<string, any>, sendOptions: SendExtOptions = {}) {
    const context = getSendTarget()
    const quote = sendOptions.quoteCaptured ? sendOptions.quote : options.replyTarget.value
    if (!sendOptions.quoteCaptured && quote && options.replyTarget.value === quote) {
      options.clearReplyTarget()
    }
    const content = serializeMessage(withQuotePayload(payload, quote))
    const clientMessageId = generateClientMessageId()
    const localMessage: Message = {
      clientMessageId,
      senderId: context.currentUserId,
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
    if (options.isLocalMessageDeleted(clientMessageId)) {
      await cleanupDeletedMessage(context, localMessage)
      return false
    }
    let message: SendMessageResponse
    try {
      message = await requestSendMessage(context, clientMessageId, type, content, sendOptions)
    } catch {
      if (options.isLocalMessageDeleted(clientMessageId)) {
        await cleanupDeletedMessage(context, localMessage)
        return false
      }
      const failedMessage: Message = { ...localMessage, status: ImMessageStatus.FAILED }
      const appliedMessage = await syncFailedMessage(failedMessage, context)
      if (options.isLocalMessageDeleted(clientMessageId)) {
        await cleanupDeletedMessage(context, appliedMessage)
        return false
      }
      if (appliedMessage.status === ImMessageStatus.FAILED) {
        toast.error('发送失败，点击状态可重试')
      }
      return appliedMessage.status === ImMessageStatus.NORMAL && !!appliedMessage.id
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
    if (syncedMessage) {
      options.replaceLocalMessage(clientMessageId, syncedMessage)
    }
    return true
  }

  /** 添加媒体上传占位消息 */
  function startUploadMessage(data: UploadMessageData) {
    const context = getSendTarget()
    const sendOptions = data.options || {}
    const pendingPayload: Record<string, any> = { ...data.payload, _uploadPending: true }
    const content = serializeMessage(withQuotePayload(pendingPayload, sendOptions.quote))
    const localMessage: Message = {
      clientMessageId: data.clientMessageId,
      senderId: context.currentUserId,
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
    if (!state) {
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
    options.replaceLocalMessage(clientMessageId, state.localMessage)
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
    options.replaceLocalMessage(data.clientMessageId, state.localMessage)
    await state.ready
    if (options.isLocalMessageDeleted(data.clientMessageId)) {
      await cleanupDeletedUploadMessage(state)
      return false
    }
    await syncSentMessageSafely(state.localMessage, state.context, true)
    if (options.isLocalMessageDeleted(data.clientMessageId)) {
      await cleanupDeletedUploadMessage(state)
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
      const appliedMessage = await syncFailedMessage(failedMessage, state.context)
      if (options.isLocalMessageDeleted(data.clientMessageId)) {
        await cleanupDeletedUploadMessage(state, appliedMessage)
        return false
      }
      uploadMessages.delete(data.clientMessageId)
      if (appliedMessage.status === ImMessageStatus.FAILED) {
        toast.error('发送失败，点击状态可重试')
      }
      return appliedMessage.status === ImMessageStatus.NORMAL && !!appliedMessage.id
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
    if (syncedMessage) {
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
    options.replaceLocalMessage(clientMessageId, failedMessage)
    toast.error('上传失败，请重新选择文件')
    await state.ready
    if (options.isLocalMessageDeleted(clientMessageId)) {
      await cleanupDeletedUploadMessage(state)
      return
    }
    const appliedMessage = await syncFailedMessage(failedMessage, state.context)
    if (options.isLocalMessageDeleted(clientMessageId)) {
      await cleanupDeletedUploadMessage(state, appliedMessage)
      return
    }
    uploadMessages.delete(clientMessageId)
  }

  /** 重试发送失败的消息 */
  async function retryMessage(item: Message) {
    if (item.status !== ImMessageStatus.FAILED) {
      return
    }
    const context = getSendTarget()
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
    const preparedMessage = await syncSentMessageSafely(sending, context, true)
    if (preparedMessage) {
      options.replaceLocalMessage(item.clientMessageId, preparedMessage)
    }
    if (preparedMessage?.status === ImMessageStatus.NORMAL && preparedMessage.id) {
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
      if (options.isLocalMessageDeleted(item.clientMessageId)) {
        await cleanupDeletedMessage(context, item)
        return
      }
      const appliedMessage = await syncFailedMessage(item, context)
      if (options.isLocalMessageDeleted(item.clientMessageId)) {
        await cleanupDeletedMessage(context, appliedMessage)
        return
      }
      if (appliedMessage.status === ImMessageStatus.FAILED) {
        toast.error('重试失败')
      }
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
    if (syncedMessage) {
      options.replaceLocalMessage(item.clientMessageId, syncedMessage)
    }
    if (quote?.messageId
      && options.replyTarget.value?.messageId === quote.messageId) {
      options.clearReplyTarget()
    }
  }

  /** 标记当前会话已读，并按会话类型上报服务端 */
  async function readActive(latestMessageId = 0) {
    const context = getSendTarget()
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
      context.db,
    )
    if (readReported) {
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
        context.db,
      )
    } catch (error) {
      console.warn('[IM 消息发送] 标记已读失败', error)
    }
  }

  /** 补齐私聊对方已读位置 */
  async function syncPrivateReadStatus() {
    const context = getSendTarget()
    if (context.conversationType !== ImConversationType.PRIVATE
      || !context.targetId
      || !MESSAGE_PRIVATE_READ_ENABLED) {
      return
    }
    const cachedMaxReadMessageId = messageStore.getPrivateReadMaxId(context.targetId)
    if (cachedMaxReadMessageId !== undefined) {
      return cachedMaxReadMessageId
    }
    try {
      const maxReadMessageId = await getPrivateMaxReadMessageId(context.targetId)
      messageStore.updatePrivateReadMaxId(context.targetId, maxReadMessageId)
      if (maxReadMessageId) {
        await messageStore.applyMessageReadReceipt({
          conversationType: ImConversationType.PRIVATE,
          targetId: context.targetId,
          privateReadMaxId: maxReadMessageId,
        }, context.db)
      }
      return maxReadMessageId
    } catch (error) {
      console.warn('[IM 消息发送] 拉取对方已读位置失败', { peerId: context.targetId }, error)
    }
  }

  /** 撤回消息并同步本地终态 */
  async function recall(item: Message) {
    if (!item.id) {
      return false
    }
    const context = getSendTarget()
    const signal = context.conversationType === ImConversationType.GROUP
      ? await recallGroupMessage(item.id)
      : await recallPrivateMessage(item.id)
    await applyRecallMessage(
      context.conversationType,
      context.targetId,
      signal.content,
      context.db,
    )
    return true
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
