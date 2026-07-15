import type { Ref } from 'vue'
import type { MessageDO } from '@/pages-im/utils/db'
import type { Message } from '../types'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { nextTick, ref } from 'vue'
import { getGroupMessageList } from '@/api/im/message/group'
import { getPrivateMessageList } from '@/api/im/message/private'
import {
  MESSAGE_CHAT_PAGE_SIZE,
  MESSAGE_TIME_TIP_GAP_MS,
} from '@/pages-im/utils/config'
import {
  getMessageIdentityKey,
  isSameConversationMessage,
  parseRecallMessageId,
} from '@/pages-im/utils/message'
import { toTimestamp } from '@/pages-im/utils/time'
import { ImConversationType, ImMessageStatus, ImMessageType } from '@/pages-im/utils/constants'
import { getClientConversationId } from '@/pages-im/utils/db'
import { buildMessageFromDO, useMessageStore } from '../store/messageStore'

interface MessagePageContext {
  userId: number
  conversationType: number
  targetId: number
}

/** 管理聊天消息列表、历史分页、定位与首屏实时消息合并 */
export function useMessageList(options: {
  pagingRef: Ref<any>
  getPageContext: () => MessagePageContext
  isPageContextActive: (context: MessagePageContext) => boolean
  getLocateMessageId: () => number
  getMentionMessageId: () => number
  convertGroupMessage: (message: ImGroupMessageRespVO, currentUserId?: number) => Message | null
  convertPrivateMessage: (message: ImPrivateMessageRespVO, currentUserId?: number) => Message | null
  markRead: (message?: Message) => Promise<void>
  syncPrivateReadStatus: () => Promise<void>
}) {
  const toast = useToast()
  const messageStore = useMessageStore()
  const messageList = ref<Message[]>([]) // 消息列表（最新在前）
  const firstPageLoading = ref(false) // 首屏消息加载状态
  const pendingLatestMessages = ref<Message[]>([]) // 首屏加载期间待追加消息
  const historyMaxId = ref<number>() // 历史消息游标（已加载最早消息编号）
  const historyLoadFailed = ref(false) // 删除清空后的历史补拉失败状态
  const highlightMessageId = ref<number>() // 当前定位高亮的消息
  const clearBeforeMessageId = ref(0) // 本地清理的历史边界
  const deletedMessageKeys = ref(new Set<string>()) // 本地已删除消息标识
  const recalledMessageIds = new Set<number>() // 分页期间已收到的撤回原消息编号
  const isNearBottom = ref(true) // 是否停留在最新消息附近
  const newMessageCount = ref(0) // 未自动滚动的新消息数
  const mentionPromptVisible = ref(!!options.getMentionMessageId()) // @我定位提示
  let locateConsumed = false
  let deletedKeysLoaded = false

  /** 是否已在当前设备删除 */
  function isLocallyDeleted(message: Message) {
    return deletedMessageKeys.value.has(getMessageIdentityKey(message))
  }

  /** 查询历史消息 */
  async function queryMessages(
    context: MessagePageContext,
    maxId?: number,
    limit = MESSAGE_CHAT_PAGE_SIZE,
  ): Promise<Message[]> {
    if (context.conversationType === ImConversationType.CHANNEL) {
      const clientConversationId = getClientConversationId(context.conversationType, context.targetId)
      const stored = await messageStore.getConversationStoredMessages(clientConversationId, 5000)
      return stored
        .filter(item => !maxId || (item.id || 0) < maxId)
        .slice(-limit)
        .map(buildMessageFromDO)
    }
    if (context.conversationType === ImConversationType.GROUP) {
      const list = await getGroupMessageList({ groupId: context.targetId, maxId, limit })
      return list
        .map(message => options.convertGroupMessage(message, context.userId))
        .filter((message): message is Message => !!message)
    }
    const list = await getPrivateMessageList({ receiverId: context.targetId, maxId, limit })
    return list
      .map(message => options.convertPrivateMessage(message, context.userId))
      .filter((message): message is Message => !!message)
  }

  /** 删除清空后继续加载更早消息 */
  async function loadOlderMessagesAfterClear() {
    if (!historyMaxId.value) {
      return
    }
    const context = options.getPageContext()
    historyLoadFailed.value = false
    try {
      const response = await queryMessages(context, historyMaxId.value, MESSAGE_CHAT_PAGE_SIZE)
      if (!options.isPageContextActive(context)) {
        return
      }
      const messages = normalizeMessages(normalizeRecallMessages(response))
        .filter(item => !isLocallyDeleted(item))
      const nextHistoryId = Math.min(...response.map(item => item.id || Number.MAX_SAFE_INTEGER))
      if (Number.isFinite(nextHistoryId)) {
        historyMaxId.value = nextHistoryId
      }
      const mergedMessages = normalizeMessages([...messageList.value, ...messages])
        .filter((message, index, rows) =>
          rows.findIndex(item => isSameConversationMessage(item, message)) === index)
      options.pagingRef.value?.resetTotalData(mergedMessages)
    } catch {
      historyLoadFailed.value = true
    }
  }

  /** 分页查询：第一页加载最新消息，后续按最早消息编号向前加载 */
  async function queryList(pageNo: number, pageSize: number) {
    const context = options.getPageContext()
    const clientConversationId = getClientConversationId(context.conversationType, context.targetId)
    const isFirstPage = pageNo === 1
    let querySucceeded = false
    if (isFirstPage) {
      firstPageLoading.value = true
    }
    if (!context.targetId) {
      await options.pagingRef.value?.complete([])
      if (isFirstPage) {
        flushPendingLatestMessages()
      }
      return
    }
    try {
      await loadDeletedMessageKeys(context, clientConversationId)
      if (!options.isPageContextActive(context)) {
        return
      }
      const clearBefore = clearBeforeMessageId.value
        || await messageStore.getConversationClearBefore(clientConversationId)
      if (!options.isPageContextActive(context)) {
        return
      }
      clearBeforeMessageId.value = clearBefore
      const maxId = isFirstPage ? undefined : historyMaxId.value
      const firstResponse = await queryMessages(context, maxId, pageSize)
      if (!options.isPageContextActive(context)) {
        return
      }
      let rawResponses = [...firstResponse]
      let responseCount = firstResponse.length
      let reachedClearBoundary = firstResponse.some(item => item.id <= clearBeforeMessageId.value)
      let data = firstResponse.filter(item => item.id > clearBeforeMessageId.value && !isLocallyDeleted(item))
      const locateMessageId = options.getLocateMessageId() || options.getMentionMessageId()
      if (isFirstPage && locateMessageId && !locateConsumed) {
        locateConsumed = true
        for (let guard = 0; guard < 50 && !data.some(item => item.id === locateMessageId); guard++) {
          const nextMaxId = Math.min(...rawResponses.map(item => item.id || Number.MAX_SAFE_INTEGER))
          if (!Number.isFinite(nextMaxId) || nextMaxId === Number.MAX_SAFE_INTEGER
            || responseCount < pageSize || reachedClearBoundary) {
            break
          }
          const earlierResponse = await queryMessages(context, nextMaxId, pageSize)
          if (!options.isPageContextActive(context)) {
            return
          }
          const earlier = earlierResponse
            .filter(item => item.id > clearBeforeMessageId.value && !isLocallyDeleted(item))
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
        const pendingMessages = (await messageStore.getConversationPendingMessages(clientConversationId))
          .map(buildMessageFromDO)
        if (!options.isPageContextActive(context)) {
          return
        }
        messages = normalizeMessages([...pendingMessages, ...messages])
          .filter((message, index, rows) =>
            rows.findIndex(item => isSameConversationMessage(item, message)) === index)
      }
      const nextHistoryId = Math.min(...rawResponses.map(item => item.id || Number.MAX_SAFE_INTEGER))
      if (Number.isFinite(nextHistoryId)) {
        historyMaxId.value = nextHistoryId
      }
      await options.pagingRef.value?.completeByNoMore(
        messages,
        responseCount < pageSize || reachedClearBoundary,
      )
      querySucceeded = true
    } catch {
      if (!options.isPageContextActive(context)) {
        return
      }
      if (isFirstPage) {
        const cachedMessages = (await messageStore.getConversationStoredMessages(clientConversationId, pageSize))
          .map(buildMessageFromDO)
          .filter(item => (!item.id || item.id > clearBeforeMessageId.value) && !isLocallyDeleted(item))
        if (!options.isPageContextActive(context)) {
          return
        }
        await options.pagingRef.value?.complete(
          normalizeMessages(normalizeRecallMessages(cachedMessages)),
        )
        flushPendingLatestMessages()
        return
      }
      await options.pagingRef.value?.complete(false).catch(() => undefined)
      return
    } finally {
      if (isFirstPage && querySucceeded && options.isPageContextActive(context)) {
        flushPendingLatestMessages()
      }
    }
    if (isFirstPage && options.isPageContextActive(context)) {
      await options.markRead()
      await options.syncPrivateReadStatus()
      await locateInitialMessage()
    }
  }

  /** 加载当前设备已删除的消息标识 */
  async function loadDeletedMessageKeys(context: MessagePageContext, clientConversationId: string) {
    if (deletedKeysLoaded) {
      return
    }
    const keys = await messageStore.getConversationDeletedMessageKeys(clientConversationId)
    if (!options.isPageContextActive(context)) {
      return
    }
    deletedMessageKeys.value = new Set(keys)
    deletedKeysLoaded = true
  }

  /** 定位从聊天记录搜索进入的消息 */
  async function locateInitialMessage() {
    const messageId = options.getLocateMessageId()
    if (!messageId || !messageList.value.some(item => item.id === messageId)) {
      return
    }
    await locateMessage(messageId)
  }

  /** 定位 @我的消息 */
  async function locateMentionMessage() {
    const messageId = options.getMentionMessageId()
    mentionPromptVisible.value = false
    if (!messageId || !messageList.value.some(item => item.id === messageId)) {
      toast.show('该消息不在本地记录中')
      return
    }
    await locateMessage(messageId)
  }

  /** 高亮并滚动到指定消息 */
  async function locateMessage(messageId: number) {
    highlightMessageId.value = messageId
    await nextTick()
    options.pagingRef.value?.scrollIntoViewById(`msg-${messageId}`, 0, true)
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
    options.pagingRef.value?.scrollToBottom(true)
    await options.markRead()
  }

  /** 规范化聊天记录顺序：最新消息在前 */
  function normalizeMessages(data: Message[]) {
    return [...data].sort((left, right) => {
      if (left.id && right.id) {
        return right.id - left.id
      }
      return toTimestamp(right.sendTime) - toTimestamp(left.sendTime)
    })
  }

  /** 把撤回信号归一化到原消息，并移除信号消息 */
  function normalizeRecallMessages(data: Message[]) {
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
      .map(message => message.status === ImMessageStatus.RECALL
        || (!!message.id && recalledMessageIds.has(message.id))
        ? {
            ...message,
            type: ImMessageType.RECALL,
            content: '',
            status: ImMessageStatus.RECALL,
          } as Message
        : message)
  }

  /** 是否展示时间分隔（最早一条或与更早消息间隔超过 10 分钟） */
  function shouldShowTime(index: number) {
    const current = messageList.value[index]
    const older = messageList.value[index + 1]
    return !older || toTimestamp(current.sendTime) - toTimestamp(older.sendTime) > MESSAGE_TIME_TIP_GAP_MS
  }

  /** 去重后追加最新消息 */
  function addLatestMessage(message: Message, forceBottom = false) {
    const appliedMessage = applyKnownRecall(message)
    if (messageList.value.some(item => isSameConversationMessage(item, appliedMessage))
      || pendingLatestMessages.value.some(item => isSameConversationMessage(item, appliedMessage))) {
      return false
    }
    if (firstPageLoading.value) {
      pendingLatestMessages.value.push(appliedMessage)
      return true
    }
    const toBottom = forceBottom || isNearBottom.value
    if (options.pagingRef.value) {
      options.pagingRef.value.addChatRecordData(appliedMessage, toBottom, true)
    } else {
      messageList.value = [appliedMessage, ...messageList.value]
    }
    if (!toBottom && appliedMessage.senderId !== options.getPageContext().userId) {
      newMessageCount.value += 1
    }
    return true
  }

  /** 追加本地数据库消息 */
  function addStoredMessage(message: MessageDO) {
    const payload = applyKnownRecall(buildMessageFromDO(message))
    return addLatestMessage(payload) ? payload : undefined
  }

  /** 追加首屏加载期间收到的新消息 */
  function flushPendingLatestMessages() {
    firstPageLoading.value = false
    const messages = normalizeMessages(normalizeRecallMessages(pendingLatestMessages.value)).reverse()
    pendingLatestMessages.value = []
    messages.forEach(message => addLatestMessage(message, true))
  }

  /** 用服务端消息替换本地发送占位 */
  function replaceLocalMessage(clientMessageId: string, message: Message) {
    const appliedMessage = applyKnownRecall(message)
    const pendingIndex = pendingLatestMessages.value.findIndex(item => item.clientMessageId === clientMessageId)
    if (pendingIndex >= 0) {
      const nextMessages = [...pendingLatestMessages.value]
      nextMessages[pendingIndex] = appliedMessage
      pendingLatestMessages.value = nextMessages
      return
    }
    const index = messageList.value.findIndex(item => item.clientMessageId === clientMessageId)
    if (index < 0) {
      addLatestMessage(appliedMessage, true)
      return
    }
    const nextMessages = [...messageList.value]
    nextMessages[index] = appliedMessage
    options.pagingRef.value?.resetTotalData(nextMessages)
  }

  /** 应用当前页面已知的撤回终态 */
  function applyKnownRecall(message: Message) {
    return message.id && recalledMessageIds.has(message.id)
      ? toRecalledMessage(message)
      : message
  }

  /** 在当前列表内归一化撤回消息 */
  function markMessageRecalled(messageId: number) {
    if (!messageId) {
      return
    }
    recalledMessageIds.add(messageId)
    pendingLatestMessages.value = pendingLatestMessages.value.map(message => message.id === messageId
      ? toRecalledMessage(message)
      : message)
    const index = messageList.value.findIndex(message => message.id === messageId)
    if (index >= 0) {
      const nextMessages = [...messageList.value]
      nextMessages[index] = toRecalledMessage(nextMessages[index])
      options.pagingRef.value?.resetTotalData(nextMessages)
    }
  }

  /** 更新当前列表内的消息回执 */
  function updateMessageReceipt(messageId: number, readCount?: number, receiptStatus?: number) {
    const index = messageList.value.findIndex(message => message.id === messageId)
    if (index < 0) {
      return
    }
    const nextMessages = [...messageList.value]
    nextMessages[index] = {
      ...nextMessages[index],
      ...(readCount !== undefined ? { readCount } : {}),
      ...(receiptStatus !== undefined ? { receiptStatus } : {}),
    }
    options.pagingRef.value?.resetTotalData(nextMessages)
  }

  /** 从当前列表移除已在本机删除的消息 */
  function removeDeletedMessages(messages: Message[]) {
    messages.forEach(message => deletedMessageKeys.value.add(getMessageIdentityKey(message)))
    const clientMessageIds = new Set(messages.map(message => message.clientMessageId))
    const nextMessages = messageList.value
      .filter(message => !clientMessageIds.has(message.clientMessageId))
    options.pagingRef.value?.resetTotalData(nextMessages)
    return nextMessages.length
  }

  /** 清空会话后的消息列表状态 */
  function resetAfterConversationClear() {
    historyMaxId.value = undefined
    clearBeforeMessageId.value = messageList.value[0]?.id || 0
    messageList.value = []
    options.pagingRef.value?.reload()
  }

  return {
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
  }
}

/** 转换为归一化撤回消息 */
function toRecalledMessage(message: Message): Message {
  return {
    ...message,
    type: ImMessageType.RECALL,
    content: '',
    status: ImMessageStatus.RECALL,
  }
}
