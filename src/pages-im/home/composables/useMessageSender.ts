import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImQuoteMessage } from '@/pages-im/utils/message'
import type { Ref } from 'vue'
import type { ChatMessage, SendRawOptions } from '../types'
import { sendGroupMessage } from '@/api/im/message/group'
import { sendPrivateMessage } from '@/api/im/message/private'
import {
  generateClientMessageId,
  getQuoteFromMessage,
  serializeMessage,
  withQuotePayload,
} from '@/pages-im/utils/message'
import { useUserStore } from '@/store/user'
import { ImConversationType, ImMessageStatus } from '@/utils/constants'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useImConversations } from './useImConversations'

/** 管理聊天消息的本地占位、接口发送和失败重试 */
export function useMessageSender(options: {
  conversationType: Readonly<Ref<number>>
  targetId: Readonly<Ref<number>>
  replyTarget: Ref<ImQuoteMessage | undefined>
  addLatestMessage: (message: ChatMessage, forceBottom?: boolean) => boolean
  replaceLocalMessage: (clientMessageId: string, message: ChatMessage) => void
  clearReplyTarget: () => void
}) {
  const toast = useToast()
  const userStore = useUserStore()
  const { buildIncomingMessage, applyIncomingMessage, load } = useImConversations()

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
    return userStore.userInfo.userId === context.userId
      && options.conversationType.value === context.conversationType
      && options.targetId.value === context.targetId
  }

  /** 调用当前会话发送接口 */
  function requestSendMessage(
    context: ReturnType<typeof getSendContext>,
    clientMessageId: string,
    type: number,
    content: string,
    sendOptions: SendRawOptions = {},
  ) {
    if (context.conversationType === ImConversationType.GROUP) {
      return sendGroupMessage({
        clientMessageId,
        groupId: context.targetId,
        type,
        content,
        atUserIds: sendOptions.atUserIds,
        receipt: sendOptions.receipt,
      })
    }
    if (context.conversationType === ImConversationType.PRIVATE) {
      return sendPrivateMessage({
        clientMessageId,
        receiverId: context.targetId,
        type,
        content,
        receipt: sendOptions.receipt ?? true,
      })
    }
    return Promise.reject(new Error('当前会话不支持发送消息'))
  }

  /** 同步本地或已发送消息到会话列表与本地库 */
  async function syncSentMessage(message: ChatMessage, context: ReturnType<typeof getSendContext>) {
    if (!isSendContextActive(context)) {
      return
    }
    const incoming = buildIncomingMessage(context.conversationType, message, context.userId)
    if (incoming) {
      await applyIncomingMessage(incoming, context.userId)
    }
  }

  /** 尽力同步本地缓存；缓存异常不改变服务端发送结果 */
  async function syncSentMessageSafely(message: ChatMessage, context: ReturnType<typeof getSendContext>) {
    try {
      await syncSentMessage(message, context)
    } catch (error) {
      console.warn('[IM 消息发送] 本地缓存同步失败', error)
      if (isSendContextActive(context) && message.senderId === context.userId) {
        void load().catch(() => undefined)
      }
    }
  }

  /** 发送原始消息，并在失败后保留可重试占位 */
  async function sendRawMessage(type: number, payload: Record<string, any>, sendOptions: SendRawOptions = {}) {
    const context = getSendContext()
    const quote = options.replyTarget.value
    const content = serializeMessage(withQuotePayload(payload, quote))
    const clientMessageId = generateClientMessageId()
    const localMessage = {
      clientMessageId,
      senderId: context.userId,
      groupId: context.conversationType === ImConversationType.GROUP ? context.targetId : undefined,
      receiverId: context.conversationType === ImConversationType.PRIVATE ? context.targetId : undefined,
      type,
      content,
      status: ImMessageStatus.SENDING,
      sendTime: new Date().toISOString(),
      atUserIds: sendOptions.atUserIds,
      receipt: sendOptions.receipt,
    } as unknown as ChatMessage
    options.addLatestMessage(localMessage, true)
    await syncSentMessageSafely(localMessage, context)
    if (!isSendContextActive(context)) {
      return
    }
    let message: ChatMessage
    try {
      message = await requestSendMessage(context, clientMessageId, type, content, sendOptions)
    } catch {
      if (!isSendContextActive(context)) {
        return
      }
      const failedMessage = { ...localMessage, status: ImMessageStatus.FAILED } as ChatMessage
      options.replaceLocalMessage(clientMessageId, failedMessage)
      await syncSentMessageSafely(failedMessage, context)
      toast.error('发送失败，点击状态可重试')
      return
    }
    if (!isSendContextActive(context)) {
      return
    }
    options.replaceLocalMessage(clientMessageId, message)
    await syncSentMessageSafely(message, context)
    if (quote && options.replyTarget.value === quote) {
      options.clearReplyTarget()
    }
  }

  /** 重试发送失败的消息 */
  async function retryMessage(item: ChatMessage) {
    if (item.status !== ImMessageStatus.FAILED) {
      return
    }
    const context = getSendContext()
    const quote = getQuoteFromMessage(item.content)
    const sending = { ...item, status: ImMessageStatus.SENDING } as ChatMessage
    options.replaceLocalMessage(item.clientMessageId, sending)
    await syncSentMessageSafely(sending, context)
    if (!isSendContextActive(context)) {
      return
    }
    let message: ChatMessage
    try {
      const retryItem = item as ChatMessage & { receipt?: boolean }
      const sendOptions: SendRawOptions = {
        atUserIds: (item as ImGroupMessageRespVO).atUserIds,
        receipt: retryItem.receipt,
      }
      message = await requestSendMessage(context, item.clientMessageId, item.type, item.content, sendOptions)
    } catch {
      if (!isSendContextActive(context)) {
        return
      }
      options.replaceLocalMessage(item.clientMessageId, item)
      await syncSentMessageSafely(item, context)
      toast.error('重试失败')
      return
    }
    if (!isSendContextActive(context)) {
      return
    }
    options.replaceLocalMessage(item.clientMessageId, message)
    await syncSentMessageSafely(message, context)
    if (quote?.messageId && options.replyTarget.value?.messageId === quote.messageId) {
      options.clearReplyTarget()
    }
  }

  return { sendRawMessage, retryMessage }
}
