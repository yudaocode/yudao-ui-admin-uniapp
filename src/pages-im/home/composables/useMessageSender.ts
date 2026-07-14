import type { ConversationDO } from '@/pages-im/utils/db'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'
import type { QuoteMessage } from '@/pages-im/utils/message'
import type { Ref } from 'vue'
import type { Message } from '../types'
import { readChannelMessages } from '@/api/im/message/channel'
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
interface SendExtOptions {
  atUserIds?: number[] // 群聊 @ 的用户编号列表
  receipt?: boolean // 是否需要消息回执
  quote?: QuoteMessage // 异步媒体上传前固定的引用消息
  quoteCaptured?: boolean // 是否已经固定并消费引用消息
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
  replaceLocalMessage: (clientMessageId: string, message: Message) => void
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
  } = messageStore
  const {
    getConversation,
    isReportedReadPositionCovered,
    loadConversationList,
    markConversationRead,
    markConversationReadReported,
  } = conversationStore

  /** 快照当前发送账号与会话上下文 */
  function getSendContext() {
    return {
      userId: userStore.userInfo.userId,
      conversationType: options.conversationType.value,
      targetId: options.targetId.value,
    }
  }

  /** 判断发送上下文是否仍属于当前账号和会话 */
  function isSendContextActive(context: ReturnType<typeof getSendContext>) {
    return isSendAccountActive(context)
      && options.conversationType.value === context.conversationType
      && options.targetId.value === context.targetId
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
  async function sendRawMessage(type: number, payload: Record<string, any>, sendOptions: SendExtOptions = {}) {
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
    options.addLatestMessage(localMessage, true)
    await syncSentMessageSafely(localMessage, context, true)
    if (!isSendAccountActive(context)) {
      return false
    }
    let message: SendMessageResponse
    try {
      message = await requestSendMessage(context, clientMessageId, type, content, sendOptions)
    } catch {
      if (!isSendAccountActive(context)) {
        return false
      }
      const failedMessage: Message = { ...localMessage, status: ImMessageStatus.FAILED }
      if (isSendContextActive(context)) {
        options.replaceLocalMessage(clientMessageId, failedMessage)
      }
      await syncSentMessageSafely(failedMessage, context, true)
      if (isSendContextActive(context)) {
        toast.error('发送失败，点击状态可重试')
      }
      return false
    }
    if (!isSendAccountActive(context)) {
      return false
    }
    const syncedMessage = await syncSentMessageSafely(message, context)
    if (isSendContextActive(context) && syncedMessage) {
      options.replaceLocalMessage(clientMessageId, syncedMessage)
    }
    return true
  }

  /** 重试发送失败的消息 */
  async function retryMessage(item: Message) {
    if (item.status !== ImMessageStatus.FAILED) {
      return
    }
    const context = getSendContext()
    const quote = getQuoteFromMessage(item.content)
    const sending: Message = { ...item, status: ImMessageStatus.SENDING }
    options.replaceLocalMessage(item.clientMessageId, sending)
    await syncSentMessageSafely(sending, context, true)
    if (!isSendAccountActive(context)) {
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
      if (isSendContextActive(context)) {
        options.replaceLocalMessage(item.clientMessageId, item)
      }
      await syncSentMessageSafely(item, context, true)
      if (isSendContextActive(context)) {
        toast.error('重试失败')
      }
      return
    }
    if (!isSendAccountActive(context)) {
      return
    }
    const syncedMessage = await syncSentMessageSafely(message, context)
    if (isSendContextActive(context) && syncedMessage) {
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
  async function recallMessage(item: Message) {
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
    sendRawMessage,
    retryMessage,
    readActive,
    syncPrivateReadStatus,
    recallMessage,
  }
}
