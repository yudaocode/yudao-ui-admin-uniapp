// IM 会话列表：基于本地 DB 聚合会话（私聊 + 群聊、本地未读、离线与实时消息）
// 会话由消息流在客户端聚合，不依赖服务端会话接口

import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import type { ImConversationReadRespVO } from '@/api/im/conversation/read'
import type { ConversationDO, ConversationReadDO, MessageDO } from '@/pages-im/utils/db'
import type { Friend, Group } from '../types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { pullMyConversationReadList } from '@/api/im/conversation/read'
import {
  closeImDb,
  getClientConversationId,
  getClientMessageKey,
  getImDb,
  getServerMessageKey,
  initImDb,
  StorageKeys,
} from '@/pages-im/utils/db'
import { useUserStore } from '@/store/user'
import {
  IM_AT_ALL_USER_ID,
  ImConversationType,
  ImMessageReceiptStatus,
  ImMessageStatus,
  ImMessageType,
  isNormalMessage,
} from '@/pages-im/utils/constants'
import { resolveConversationLastContent } from '@/pages-im/utils/conversation'
import { parseRecallMessageId } from '@/pages-im/utils/message'
import {
  getFriendDisplayName,
  getGroupDisplayName,
  isGroupQuit,
} from '@/pages-im/utils/user'
import { CONVERSATION_RECENT_FORWARD_MAX, MESSAGE_LOCAL_MAX_COUNT } from '@/pages-im/utils/config'
import { runIncrementalPull } from '@/pages-im/utils/pull'
import { useMessagePuller } from '../composables/useMessagePuller'
import { useMessageStore } from './messageStore'

/** IM 会话 Store */
export const useConversationStore = defineStore('imConversationStore', () => {
  const conversations = ref<ConversationDO[]>([]) // 会话列表（已排序）
  const conversationReads = ref<Record<string, ConversationReadDO>>({}) // 会话读位置
  const recentForwardConversationKeys = ref<string[]>([]) // 最近转发会话主键
  const loading = ref(false) // 加载状态
  const getTotalUnreadCount = computed(() => conversations.value
    .filter(item => !item.silent)
    .reduce((sum, item) => sum + (item.unreadCount || 0), 0)) // 非免打扰会话未读总数
  let loadedUserId = 0 // 已完成首次加载的用户编号
  let stateUserId = 0 // 当前内存会话所属用户
  let loadEpoch = 0 // 拉取轮次；退出或切换账号后旧请求不得落地
  let loadingUserId = 0 // 当前拉取所属用户
  let reloadQueued = false // 当前拉取结束后是否需要再次强制补拉
  let replayingIncoming = false // 是否正在回放拉取期间的实时消息
  const pendingIncomingMessages: MessageDO[] = [] // 拉取期间暂存的实时消息
  const pendingRecallSignals: Array<{ conversationType: number, targetId: number, content: string }> = [] // 拉取期间暂存的撤回信号
  const pendingRecallMessageKeys = new Set<string>() // 原消息未到达时暂存的撤回终态
  const pendingIncomingWaiters = new Map<string, Array<(message?: MessageDO) => void>>() // 等待回放最终状态的实时消息
  const conversationOperationQueues = new Map<string, Promise<void>>() // 按账号和会话串行执行消息状态变更

  /** 当前登录用户 id */
  function selfUserId(): number {
    return useUserStore().userInfo.userId
  }

  /** 确保模块级内存只属于当前账号 */
  function ensureStateUser(userId: number) {
    if (stateUserId && stateUserId !== userId) {
      clear()
    }
    stateUserId = userId
  }

  /** 串行执行同一账号、同一会话的消息状态变更 */
  async function enqueueConversationOperation<T>(
    clientConversationId: string,
    expectedUserId: number,
    operation: () => Promise<T>,
  ): Promise<T> {
    const queueKey = `${expectedUserId}:${clientConversationId}`
    const previous = conversationOperationQueues.get(queueKey) || Promise.resolve()
    const current = previous.catch(() => undefined).then(operation)
    const settled = current.then(() => undefined, () => undefined)
    conversationOperationQueues.set(queueKey, settled)
    try {
      return await current
    } finally {
      if (conversationOperationQueues.get(queueKey) === settled) {
        conversationOperationQueues.delete(queueKey)
      }
    }
  }

  const { deriveLastSenderDisplayName } = useMessageStore()

  /** 获取指定 @ 对象的最新消息 */
  function findLatestAtMessage(messages: MessageDO[], atUserId: number): MessageDO | undefined {
    return messages.reduce<MessageDO | undefined>((latest, message) => {
      if (!message.atUserIds?.includes(atUserId)) {
        return latest
      }
      return !latest || (message.id || 0) > (latest.id || 0) ? message : latest
    }, undefined)
  }

  /** 根据本地消息重建会话摘要 */
  async function rebuildConversations(
    friendMap: Map<number, Friend>,
    groupMap: Map<number, Group>,
    channelMap: Map<number, ImManagerChannelVO>,
  ): Promise<ConversationDO[]> {
    const db = getImDb()
    const [messages, reads, existing] = await Promise.all([
      db.getAll<MessageDO>('messages'),
      db.getAll<ConversationReadDO>('conversationReads'),
      db.getAll<ConversationDO>('conversations'),
    ])
    const readMap = new Map(reads.map(item => [item.clientConversationId, item]))
    const existingMap = new Map(existing.map(item => [item.clientConversationId, item]))
    const grouped = new Map<string, MessageDO[]>()
    messages.forEach((message) => {
      const list = grouped.get(message.clientConversationId) || []
      list.push(message)
      grouped.set(message.clientConversationId, list)
    })

    const result: ConversationDO[] = []
    const expiredMessageKeys: string[] = []
    grouped.forEach((list, clientConversationId) => {
      list.sort((left, right) => left.sendTime - right.sendTime)
      if (list.length > MESSAGE_LOCAL_MAX_COUNT) {
        const expired = list.splice(0, list.length - MESSAGE_LOCAL_MAX_COUNT)
        expiredMessageKeys.push(...expired.map(item => item.messageKey))
      }
      const last = list[list.length - 1]
      const type = last.conversationType
      const targetId = last.targetId
      const old = existingMap.get(clientConversationId)
      const friend = friendMap.get(targetId)
      const group = groupMap.get(targetId)
      const channel = channelMap.get(targetId)
      const channelName = channel?.name || `频道 ${targetId}`
      const channelAvatar = channel?.avatar || ''
      const groupUnavailable = type === ImConversationType.GROUP && isGroupQuit(group)
      const hasNewActivity = !!old?.deleted && (
        (!!last.id && last.id > (old.lastMessageId || 0))
        || (!last.id
          && last.clientMessageId !== old.lastClientMessageId
          && last.sendTime > (old.lastSendTime || 0))
      )
      const name = type === ImConversationType.GROUP
        ? (group ? getGroupDisplayName(group) : '') || old?.name || `群 ${targetId}`
        : type === ImConversationType.CHANNEL
          ? channel?.name || old?.name || channelName
          : (friend ? getFriendDisplayName(friend) : '') || old?.name || `用户 ${targetId}`
      const avatar = group?.avatar || channelAvatar || friend?.avatar || old?.avatar || ''

      const readMessageId = readMap.get(clientConversationId)?.messageId || 0
      const unreadMessages = list.filter(item => !item.selfSend
        && (item.id || 0) > readMessageId
        && isNormalMessage(item.type)
        && item.status !== ImMessageStatus.RECALL)
      const atMessage = findLatestAtMessage(unreadMessages, selfUserId())
      const atAllMessage = findLatestAtMessage(unreadMessages, IM_AT_ALL_USER_ID)
      const senderDisplayName = deriveLastSenderDisplayName({
        type,
        targetId,
        lastSenderId: old?.lastSenderId,
        lastSenderDisplayName: old?.lastSenderDisplayName,
      }, last.senderId)
      result.push({
        clientConversationId,
        type,
        targetId,
        name,
        avatar,
        unreadCount: unreadMessages.length,
        lastContent: resolveConversationLastContent(last, type, targetId, senderDisplayName),
        lastSendTime: last.sendTime,
        lastSenderId: last.senderId,
        lastMessageType: last.type,
        lastMessageId: last.id,
        lastClientMessageId: last.clientMessageId,
        lastMessageStatus: last.status,
        lastReceiptStatus: last.receiptStatus,
        lastSelfSend: last.selfSend,
        lastSenderDisplayName: senderDisplayName,
        reportedReadMessageId: old?.reportedReadMessageId,
        top: old?.top,
        silent: type === ImConversationType.GROUP
          ? group?.silent ?? old?.silent
          : type === ImConversationType.PRIVATE
            ? friend?.silent ?? old?.silent
            : old?.silent,
        deleted: groupUnavailable ? true : hasNewActivity ? false : old?.deleted,
        atMe: !!atMessage,
        atAll: !!atAllMessage,
        atMessageId: atMessage?.id,
        atAllMessageId: atAllMessage?.id,
        draft: old?.draft,
      })
    })

    const resultIds = new Set(result.map(item => item.clientConversationId))
    existing.forEach((conversation) => {
      if (resultIds.has(conversation.clientConversationId)) {
        return
      }
      const group = conversation.type === ImConversationType.GROUP
        ? groupMap.get(conversation.targetId)
        : undefined
      const friend = conversation.type === ImConversationType.PRIVATE
        ? friendMap.get(conversation.targetId)
        : undefined
      const channel = conversation.type === ImConversationType.CHANNEL
        ? channelMap.get(conversation.targetId)
        : undefined
      const name = conversation.type === ImConversationType.GROUP
        ? (group ? getGroupDisplayName(group) : '') || conversation.name
        : conversation.type === ImConversationType.CHANNEL
          ? channel?.name || conversation.name
          : (friend ? getFriendDisplayName(friend) : '') || conversation.name
      const avatar = group?.avatar || channel?.avatar || friend?.avatar || conversation.avatar
      const silent = conversation.type === ImConversationType.GROUP
        ? group?.silent ?? conversation.silent
        : conversation.type === ImConversationType.PRIVATE
          ? friend?.silent ?? conversation.silent
          : conversation.silent
      const refreshed = { ...conversation, name, avatar, silent }
      if (isGroupQuit(group)) {
        result.push({ ...refreshed, deleted: true })
      } else if (!conversation.deleted) {
        result.push(refreshed)
      }
    })

    if (expiredMessageKeys.length) {
      const expiredSet = new Set(expiredMessageKeys)
      await db.removeWhere<MessageDO>('messages', item => expiredSet.has(item.messageKey))
    }
    await db.bulkPut<ConversationDO>('conversations', result)
    return result
  }

  /** 会话排序：置顶优先，再按最近时间倒序 */
  function sortConversations(list: ConversationDO[]) {
    return list
      .filter(item => !item.deleted)
      .sort((left, right) => {
        if (!!left.top !== !!right.top) {
          return left.top ? -1 : 1
        }
        return (right.lastSendTime || 0) - (left.lastSendTime || 0)
      })
  }

  const activeClientConversationId = ref('') // 当前打开的会话（实时消息不计未读）
  const activeConversation = computed(() => conversations.value.find(item =>
    item.clientConversationId === activeClientConversationId.value)) // 当前打开的会话
  const { pullOnce, cancelPull } = useMessagePuller({
    pullConversationReads,
    getActiveConversation: () => activeConversation.value,
  })

  /** 加载会话列表（拉取 + 聚合） */
  async function loadConversationList(forceMetadata = false) {
    const self = selfUserId()
    if ((loadedUserId && loadedUserId !== self)
      || (loadingUserId && loadingUserId !== self)) {
      clear()
    }
    ensureStateUser(self)
    if (loading.value && loadingUserId === self) {
      reloadQueued ||= forceMetadata
      return
    }
    const epoch = ++loadEpoch
    loadingUserId = self
    loading.value = true
    const isActive = () => epoch === loadEpoch && selfUserId() === self
    try {
      await initImDb()
      if (!isActive()) {
        return
      }
      const db = getImDb()
      const [cachedConversations, cachedReads, recentForwardKeys] = await Promise.all([
        db.getAll<ConversationDO>('conversations'),
        db.getAll<ConversationReadDO>('conversationReads'),
        db.getSetting<string[]>(StorageKeys.settings.recentForwardConversationKeys),
      ])
      if (isActive()) {
        conversationReads.value = Object.fromEntries(cachedReads.map(record => [
          record.clientConversationId,
          record,
        ]))
      }
      if (isActive() && cachedConversations.length) {
        await applyLocalConversationReads(cachedConversations)
        if (isActive()) {
          conversations.value = sortConversations(cachedConversations)
        }
      }
      if (isActive() && Array.isArray(recentForwardKeys)) {
        recentForwardConversationKeys.value = recentForwardKeys.slice(0, CONVERSATION_RECENT_FORWARD_MAX)
      }
      let friends: Friend[]
      let groups: Group[]
      let channels: ImManagerChannelVO[]
      try {
        const metadata = await pullOnce(forceMetadata, isActive)
        if (!metadata) {
          return
        }
        friends = metadata.friends
        groups = metadata.groups
        channels = metadata.channels
      } catch (error) {
        if (isActive()) {
          loadedUserId = self
        }
        if (cachedConversations.length) {
          return
        }
        throw error
      }
      if (!isActive()) {
        return
      }
      const friendMap = new Map(friends.map(item => [item.friendUserId, item]))
      const groupMap = new Map(groups.map(item => [item.id, item]))
      const channelMap = new Map(channels.map(item => [item.id, item]))

      const list = await rebuildConversations(friendMap, groupMap, channelMap)
      if (!isActive()) {
        return
      }
      conversations.value = sortConversations(list)
      loadedUserId = self
    } catch (error) {
      if (isActive()) {
        throw error
      }
    } finally {
      if (epoch === loadEpoch) {
        const shouldReload = reloadQueued && selfUserId() === self
        loading.value = false
        loadingUserId = 0
        reloadQueued = false
        await flushPendingIncomingMessages(self)
        if (shouldReload && selfUserId() === self) {
          void loadConversationList(true).catch(() => undefined)
        }
      }
    }
  }

  /** 设置/清除当前打开的会话 */
  function setActiveConversation(conversation: Pick<ConversationDO, 'type' | 'targetId'> | null) {
    activeClientConversationId.value = conversation
      ? getClientConversationId(conversation.type, conversation.targetId)
      : ''
  }

  /** 判断指定会话是否正在打开 */
  function isActiveConversation(type: number, targetId: number) {
    return activeClientConversationId.value === getClientConversationId(type, targetId)
  }

  /** 获取指定会话 */
  function getConversation(type: number, targetId: number) {
    return conversations.value.find(item => item.clientConversationId === getClientConversationId(type, targetId))
  }

  /** 获取指定会话读位置 */
  function getConversationRead(type: number, targetId: number) {
    return conversationReads.value[getClientConversationId(type, targetId)]
  }

  /** 应用读位置到会话 */
  function applyReadToConversation(conversation: ConversationDO, messageId: number): boolean {
    if (!conversation.lastMessageId || conversation.lastMessageId > messageId) {
      return false
    }
    if (conversation.unreadCount === 0 && !conversation.atMe && !conversation.atAll) {
      return false
    }
    conversation.unreadCount = 0
    conversation.atMe = false
    conversation.atAll = false
    conversation.atMessageId = undefined
    conversation.atAllMessageId = undefined
    return true
  }

  /** 应用本地会话读位置 */
  async function applyLocalConversationReads(target = conversations.value) {
    const changed: ConversationDO[] = []
    for (const conversation of target) {
      const record = getConversationRead(conversation.type, conversation.targetId)
      if (!record) {
        continue
      }
      if (applyReadToConversation(conversation, record.messageId)) {
        changed.push(conversation)
        continue
      }
      if (conversation.unreadCount === 0 && !conversation.atMe && !conversation.atAll) {
        continue
      }
      const messages = await getImDb().filter<MessageDO>('messages', item =>
        item.clientConversationId === conversation.clientConversationId)
      const maxIncomingMessageId = messages.reduce((maxId, message) =>
        !message.selfSend && message.id && isNormalMessage(message.type)
          ? Math.max(maxId, message.id)
          : maxId, 0)
      if (maxIncomingMessageId > 0 && maxIncomingMessageId <= record.messageId) {
        conversation.unreadCount = 0
        conversation.atMe = false
        conversation.atAll = false
        conversation.atMessageId = undefined
        conversation.atAllMessageId = undefined
        changed.push(conversation)
      }
    }
    if (changed.length > 0) {
      await saveConversationRecord(changed)
    }
  }

  /** 判断会话读位置是否覆盖消息编号 */
  function isReadPositionCovered(type: number, targetId: number, messageId?: number): boolean {
    if (!messageId) {
      return false
    }
    return (getConversationRead(type, targetId)?.messageId || 0) >= messageId
  }

  /** 应用一条实时消息：写库 + 更新会话摘要/未读 + 重排 */
  async function applyIncomingMessage(
    message: MessageDO,
    expectedUserId = selfUserId(),
    waitForReplay = false,
  ) {
    if (expectedUserId !== selfUserId()) {
      return
    }
    ensureStateUser(expectedUserId)
    if (loading.value && loadingUserId === expectedUserId && !replayingIncoming) {
      const key = message.messageKey
      const index = pendingIncomingMessages.findIndex(item => item.messageKey === key)
      if (index >= 0) {
        pendingIncomingMessages[index] = message
      } else {
        pendingIncomingMessages.push(message)
      }
      if (!waitForReplay) {
        return
      }
      return new Promise<MessageDO | undefined>((resolve) => {
        const waiterKey = `${expectedUserId}:${message.messageKey}`
        const waiters = pendingIncomingWaiters.get(waiterKey) || []
        waiters.push(resolve)
        pendingIncomingWaiters.set(waiterKey, waiters)
      })
    }
    return enqueueConversationOperation(
      message.clientConversationId,
      expectedUserId,
      () => applyIncomingMessageNow(message, expectedUserId),
    )
  }

  /** 实际持久化一条实时消息 */
  async function applyIncomingMessageNow(message: MessageDO, expectedUserId: number) {
    if (expectedUserId !== selfUserId()) {
      return
    }
    await initImDb()
    if (expectedUserId !== selfUserId()) {
      return
    }
    const db = getImDb()
    const [storedMessage, read, group] = await Promise.all([
      db.get<MessageDO>('messages', message.messageKey),
      db.get<ConversationReadDO>('conversationReads', message.clientConversationId),
      message.conversationType === ImConversationType.GROUP
        ? db.get<Group>('groups', message.targetId)
        : Promise.resolve(undefined),
    ])
    if (expectedUserId !== selfUserId()) {
      return
    }
    const recalledBeforeArrival = pendingRecallMessageKeys.has(message.messageKey)
    const incomingMessage = recalledBeforeArrival || message.status === ImMessageStatus.RECALL
      ? {
          ...message,
          type: ImMessageType.RECALL,
          content: '',
          status: ImMessageStatus.RECALL,
        }
      : message
    let clientMessage: MessageDO | undefined
    if (incomingMessage.id && incomingMessage.clientMessageId) {
      clientMessage = await db.get<MessageDO>('messages', getClientMessageKey(incomingMessage.clientMessageId))
      if (expectedUserId !== selfUserId()) {
        return
      }
      if (clientMessage) {
        await db.delete('messages', clientMessage.messageKey)
      }
    }
    const appliedMessage = storedMessage?.type === ImMessageType.RECALL
      || storedMessage?.status === ImMessageStatus.RECALL
      ? storedMessage
      : incomingMessage
    await db.put<MessageDO>('messages', appliedMessage)
    if (expectedUserId !== selfUserId()) {
      return
    }
    if (recalledBeforeArrival) {
      pendingRecallMessageKeys.delete(message.messageKey)
    }
    const ccid = appliedMessage.clientConversationId
    let conv = conversations.value.find(item => item.clientConversationId === ccid)
    if (!conv) {
      const [storedConversation, friends, channel] = await Promise.all([
        db.get<ConversationDO>('conversations', ccid),
        appliedMessage.conversationType === ImConversationType.PRIVATE
          ? db.filter<Friend>('friends', item => item.friendUserId === appliedMessage.targetId)
          : Promise.resolve([]),
        appliedMessage.conversationType === ImConversationType.CHANNEL
          ? db.get<ImManagerChannelVO>('channels', appliedMessage.targetId)
          : Promise.resolve(undefined),
      ])
      if (expectedUserId !== selfUserId()) {
        return
      }
      const friend = friends[0]
      conv = {
        ...storedConversation,
        clientConversationId: ccid,
        type: appliedMessage.conversationType,
        targetId: appliedMessage.targetId,
        name: appliedMessage.conversationType === ImConversationType.GROUP
          ? (group ? getGroupDisplayName(group) : '') || storedConversation?.name || `群 ${appliedMessage.targetId}`
          : appliedMessage.conversationType === ImConversationType.CHANNEL
            ? channel?.name || storedConversation?.name || `频道 ${appliedMessage.targetId}`
            : (friend ? getFriendDisplayName(friend) : '') || storedConversation?.name || `用户 ${appliedMessage.targetId}`,
        avatar: group?.avatar || channel?.avatar || friend?.avatar || storedConversation?.avatar || '',
        unreadCount: storedConversation?.unreadCount || 0,
        lastContent: storedConversation?.lastContent || '',
        lastSendTime: storedConversation?.lastSendTime || 0,
      }
      conversations.value.push(conv)
    }
    const isExisting = !!storedMessage || !!clientMessage
    const groupUnavailable = isGroupQuit(group)
    if (groupUnavailable) {
      conv.deleted = true
    } else if (!isExisting) {
      conv.deleted = false
    }
    const isLatest = !conv.lastSendTime
      || (!!appliedMessage.id && !!conv.lastMessageId && appliedMessage.id >= conv.lastMessageId)
      || ((!appliedMessage.id || !conv.lastMessageId) && appliedMessage.sendTime >= conv.lastSendTime)
    if (isLatest) {
      const senderDisplayName = deriveLastSenderDisplayName(conv, appliedMessage.senderId)
      conv.lastContent = resolveConversationLastContent(
        appliedMessage,
        appliedMessage.conversationType,
        appliedMessage.targetId,
        senderDisplayName,
      )
      conv.lastSendTime = appliedMessage.sendTime
      conv.lastSenderId = appliedMessage.senderId
      conv.lastMessageType = appliedMessage.type
      conv.lastMessageId = appliedMessage.id
      conv.lastClientMessageId = appliedMessage.clientMessageId
      conv.lastMessageStatus = appliedMessage.status
      conv.lastReceiptStatus = appliedMessage.receiptStatus
      conv.lastSelfSend = appliedMessage.selfSend
      conv.lastSenderDisplayName = senderDisplayName
    }
    const isUnread = !isExisting
      && !appliedMessage.selfSend
      && ccid !== activeClientConversationId.value
      && isNormalMessage(appliedMessage.type)
      && appliedMessage.status !== ImMessageStatus.RECALL
      && (!appliedMessage.id || appliedMessage.id > (read?.messageId || 0))
    if (isUnread) {
      conv.unreadCount = (conv.unreadCount || 0) + 1
      if (appliedMessage.atUserIds?.includes(expectedUserId)) {
        conv.atMe = true
        conv.atMessageId = appliedMessage.id
      }
      if (appliedMessage.atUserIds?.includes(IM_AT_ALL_USER_ID)) {
        conv.atAll = true
        conv.atAllMessageId = appliedMessage.id
      }
    }
    await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conv)))
    conversations.value = sortConversations([...conversations.value])
    // 当前会话打开中：顺手推进读位置，保持已读
    if (expectedUserId === selfUserId() && ccid === activeClientConversationId.value && appliedMessage.id) {
      await markConversationRead(
        appliedMessage.conversationType,
        appliedMessage.targetId,
        appliedMessage.id,
      )
    }
    return appliedMessage
  }

  /** 应用撤回信号：更新原消息，不保留撤回信号本身 */
  async function applyRecallMessage(
    conversationType: number,
    targetId: number,
    content: string,
    expectedUserId = selfUserId(),
  ) {
    const messageId = parseRecallMessageId(content)
    if (!messageId || expectedUserId !== selfUserId()) {
      return
    }
    ensureStateUser(expectedUserId)
    if (loading.value && loadingUserId === expectedUserId && !replayingIncoming) {
      const index = pendingRecallSignals.findIndex(item => item.conversationType === conversationType
        && item.targetId === targetId
        && parseRecallMessageId(item.content) === messageId)
      const signal = { conversationType, targetId, content }
      if (index >= 0) {
        pendingRecallSignals[index] = signal
      } else {
        pendingRecallSignals.push(signal)
      }
      return
    }
    const clientConversationId = getClientConversationId(conversationType, targetId)
    return enqueueConversationOperation(
      clientConversationId,
      expectedUserId,
      () => applyRecallMessageNow(conversationType, targetId, messageId, expectedUserId),
    )
  }

  /** 实际把原消息更新为撤回终态 */
  async function applyRecallMessageNow(
    conversationType: number,
    targetId: number,
    messageId: number,
    expectedUserId: number,
  ) {
    await initImDb()
    if (expectedUserId !== selfUserId()) {
      return
    }
    const db = getImDb()
    const messageKey = getServerMessageKey(conversationType, messageId)
    const original = await db.get<MessageDO>('messages', messageKey)
    if (expectedUserId !== selfUserId()) {
      return
    }
    if (!original) {
      pendingRecallMessageKeys.add(messageKey)
      return
    }
    const recalled = {
      ...original,
      type: ImMessageType.RECALL,
      content: '',
      status: ImMessageStatus.RECALL,
    }
    await db.put<MessageDO>('messages', recalled)
    if (expectedUserId !== selfUserId()) {
      return recalled
    }
    const clientConversationId = getClientConversationId(conversationType, targetId)
    const conversation = conversations.value.find(item => item.clientConversationId === clientConversationId)
      || await db.get<ConversationDO>('conversations', clientConversationId)
    if (!conversation) {
      return recalled
    }
    const [messages, read] = await Promise.all([
      db.filter<MessageDO>('messages', item => item.clientConversationId === clientConversationId),
      db.get<ConversationReadDO>('conversationReads', clientConversationId),
    ])
    if (expectedUserId !== selfUserId()) {
      return recalled
    }
    const unreadMessages = messages.filter(item => !item.selfSend
      && (item.id || 0) > (read?.messageId || 0)
      && isNormalMessage(item.type)
      && item.status !== ImMessageStatus.RECALL)
    conversation.unreadCount = unreadMessages.length
    const atMessage = findLatestAtMessage(unreadMessages, expectedUserId)
    const atAllMessage = findLatestAtMessage(unreadMessages, IM_AT_ALL_USER_ID)
    conversation.atMe = !!atMessage
    conversation.atAll = !!atAllMessage
    conversation.atMessageId = atMessage?.id
    conversation.atAllMessageId = atAllMessage?.id
    if (conversation.lastMessageId === messageId) {
      conversation.lastContent = resolveConversationLastContent(
        recalled,
        conversationType,
        targetId,
        conversation.lastSenderDisplayName,
      )
      conversation.lastMessageType = ImMessageType.RECALL
      conversation.lastMessageStatus = ImMessageStatus.RECALL
    }
    await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conversation)))
    if (conversations.value.some(item => item.clientConversationId === clientConversationId)) {
      conversations.value = sortConversations([...conversations.value])
    }
    return recalled
  }

  /** 结束等待回放最终状态的实时消息 */
  function resolvePendingIncomingWaiters(userId: number, messageKey: string, message?: MessageDO) {
    const waiterKey = `${userId}:${messageKey}`
    pendingIncomingWaiters.get(waiterKey)?.forEach(resolve => resolve(message))
    pendingIncomingWaiters.delete(waiterKey)
  }

  /** 回放拉取期间到达的实时消息 */
  async function flushPendingIncomingMessages(userId: number) {
    if (selfUserId() !== userId
      || (pendingIncomingMessages.length === 0 && pendingRecallSignals.length === 0)) {
      return
    }
    const messages = pendingIncomingMessages.splice(0).sort((a, b) => a.sendTime - b.sendTime)
    const recalls = pendingRecallSignals.splice(0)
    replayingIncoming = true
    try {
      for (const message of messages) {
        if (selfUserId() !== userId) {
          return
        }
        await applyIncomingMessage(message, userId)
      }
      for (const signal of recalls) {
        if (selfUserId() !== userId) {
          return
        }
        await applyRecallMessage(signal.conversationType, signal.targetId, signal.content, userId)
      }
      if (selfUserId() !== userId || messages.length === 0) {
        return
      }
      const db = getImDb()
      const finalMessages = await Promise.all(messages.map(message =>
        db.get<MessageDO>('messages', message.messageKey)))
      if (selfUserId() !== userId) {
        return
      }
      messages.forEach((message, index) => {
        resolvePendingIncomingWaiters(userId, message.messageKey, finalMessages[index])
      })
    } finally {
      messages.forEach(message => resolvePendingIncomingWaiters(userId, message.messageKey))
      replayingIncoming = false
    }
  }

  /** 应用一批会话读位置 */
  async function applyConversationReadList(
    records: ImConversationReadRespVO[],
    isActive: () => boolean = () => true,
  ) {
    if (records.length === 0 || !isActive()) {
      return
    }
    ensureStateUser(selfUserId())
    await initImDb()
    if (!isActive()) {
      return
    }
    const db = getImDb()
    for (const record of records) {
      if (!isActive()) {
        return
      }
      if (!record.messageId || !record.conversationType || !record.targetId) {
        continue
      }
      const clientConversationId = getClientConversationId(record.conversationType, record.targetId)
      const current = conversationReads.value[clientConversationId]
        || await db.get<ConversationReadDO>('conversationReads', clientConversationId)
      const messageId = Math.max(current?.messageId || 0, record.messageId)
      const conversationRead: ConversationReadDO = {
        clientConversationId,
        conversationType: record.conversationType,
        targetId: record.targetId,
        messageId,
        updateTime: record.updateTime || Date.now(),
      }
      conversationReads.value[clientConversationId] = conversationRead
      await db.put<ConversationReadDO>('conversationReads', conversationRead)
      const conversation = conversations.value.find(item => item.clientConversationId === clientConversationId)
      const messages = await db.filter<MessageDO>('messages', item => item.clientConversationId === clientConversationId)
      if (conversation) {
        conversation.reportedReadMessageId = Math.max(
          conversation.reportedReadMessageId || 0,
          record.messageId,
        )
        conversation.unreadCount = messages.filter(item => !item.selfSend
          && (item.id || 0) > messageId
          && isNormalMessage(item.type)
          && item.status !== ImMessageStatus.RECALL).length
        if (!conversation.atMessageId || conversation.atMessageId <= messageId) {
          conversation.atMe = false
          conversation.atMessageId = undefined
        }
        if (!conversation.atAllMessageId || conversation.atAllMessageId <= messageId) {
          conversation.atAll = false
          conversation.atAllMessageId = undefined
        }
      }
      if (record.conversationType === ImConversationType.CHANNEL) {
        const changedMessages = messages
          .filter(message => !!message.id
            && message.id <= messageId
            && message.receiptStatus !== ImMessageReceiptStatus.DONE)
          .map(message => ({ ...message, receiptStatus: ImMessageReceiptStatus.DONE }))
        await db.bulkPut<MessageDO>('messages', changedMessages)
      }
      if (conversation) {
        await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conversation)))
      }
    }
    if (!isActive()) {
      return
    }
    conversations.value = sortConversations([...conversations.value])
  }

  /** 增量拉取多端会话读位置 */
  async function pullConversationReads(isActive: () => boolean = () => true) {
    await runIncrementalPull(
      StorageKeys.settings.conversationReadPullCursor,
      params => pullMyConversationReadList(params),
      async (list) => {
        await applyConversationReadList(list, isActive)
        return isActive()
      },
      isActive,
    )
  }

  /** 标记会话已读（进入聊天页时调用） */
  async function markConversationRead(
    type: number,
    targetId: number,
    messageId?: number,
    expectedUserId = selfUserId(),
  ) {
    if (expectedUserId <= 0 || selfUserId() !== expectedUserId) {
      return
    }
    const clientConversationId = getClientConversationId(type, targetId)
    await initImDb()
    if (selfUserId() !== expectedUserId) {
      return
    }
    const db = getImDb()
    const target = conversations.value.find(item => item.clientConversationId === clientConversationId)
    if (!target) {
      return
    }
    const current = conversationReads.value[clientConversationId]
      || await db.get<ConversationReadDO>('conversationReads', clientConversationId)
    if (selfUserId() !== expectedUserId) {
      return
    }
    const nextMessageId = Math.max(current?.messageId || 0, messageId || target?.lastMessageId || 0)
    if (nextMessageId > (current?.messageId || 0)) {
      const conversationRead: ConversationReadDO = {
        clientConversationId,
        conversationType: type,
        targetId,
        messageId: nextMessageId,
        updateTime: Date.now(),
      }
      conversationReads.value[clientConversationId] = conversationRead
      await db.put<ConversationReadDO>('conversationReads', conversationRead)
    }
    if (selfUserId() !== expectedUserId) {
      return
    }
    target.unreadCount = 0
    target.atMe = false
    target.atAll = false
    target.atMessageId = undefined
    target.atAllMessageId = undefined
    await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(target)))
  }

  /** 判断服务端已读位置是否已经覆盖消息 */
  function isReportedReadPositionCovered(type: number, targetId: number, messageId?: number) {
    if (!messageId) {
      return false
    }
    return (getConversation(type, targetId)?.reportedReadMessageId || 0) >= messageId
  }

  /** 记录已经成功上报服务端的已读位置 */
  async function markConversationReadReported(
    type: number,
    targetId: number,
    messageId?: number,
    expectedUserId = selfUserId(),
  ) {
    if (!messageId || expectedUserId <= 0 || selfUserId() !== expectedUserId) {
      return
    }
    const conversation = getConversation(type, targetId)
    if (!conversation || messageId <= (conversation.reportedReadMessageId || 0)) {
      return
    }
    conversation.reportedReadMessageId = messageId
    await initImDb()
    if (selfUserId() !== expectedUserId) {
      return
    }
    await getImDb().put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conversation)))
  }

  /** 更新会话本地设置并持久化 + 重排 */
  async function updateConversationLocal(clientConversationId: string, patch: Partial<ConversationDO>) {
    const target = conversations.value.find(item => item.clientConversationId === clientConversationId)
    if (!target) {
      return
    }
    Object.assign(target, patch)
    await initImDb()
    await getImDb().put<ConversationDO>('conversations', JSON.parse(JSON.stringify(target)))
    conversations.value = sortConversations([...conversations.value])
  }

  /** 执行会话记录持久化 */
  async function saveConversationRecord(
    target: ConversationDO | ConversationDO[] | null | undefined,
  ): Promise<void> {
    const records = Array.isArray(target) ? target : target ? [target] : []
    if (records.length === 0) {
      return
    }
    await initImDb()
    await getImDb().bulkPut('conversations', records.map(record =>
      JSON.parse(JSON.stringify(record)) as ConversationDO))
  }

  /** 持久化单个会话 */
  function saveConversation(conversation: ConversationDO | null | undefined): void {
    if (!conversation) {
      return
    }
    void saveConversationRecord(conversation).catch(error =>
      console.warn('[IM conversationStore] 会话写入失败', error))
  }

  /** 持久化会话列表 */
  function saveConversationList(list?: ConversationDO[] | null): void {
    if (loading.value) {
      return
    }
    void saveConversationRecord(list || conversations.value).catch(error =>
      console.warn('[IM conversationStore] 会话写入失败', error))
  }

  /** 创建或刷新一个显式打开的会话 */
  async function ensureConversation(info: {
    type: number
    targetId: number
    name: string
    avatar: string
    silent?: boolean
  }) {
    const userId = selfUserId()
    if (userId <= 0 || info.targetId <= 0) {
      return
    }
    ensureStateUser(userId)
    await initImDb()
    if (selfUserId() !== userId) {
      return
    }
    const db = getImDb()
    const clientConversationId = getClientConversationId(info.type, info.targetId)
    const current = conversations.value.find(item => item.clientConversationId === clientConversationId)
      || await db.get<ConversationDO>('conversations', clientConversationId)
    if (selfUserId() !== userId) {
      return
    }
    const conversation: ConversationDO = {
      ...current,
      clientConversationId,
      type: info.type,
      targetId: info.targetId,
      name: info.name || current?.name || '',
      avatar: info.avatar || current?.avatar || '',
      unreadCount: current?.unreadCount || 0,
      lastContent: current?.lastContent || '',
      lastSendTime: current?.lastSendTime || 0,
      silent: info.silent ?? current?.silent,
      deleted: false,
    }
    await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conversation)))
    if (selfUserId() !== userId) {
      return
    }
    const index = conversations.value.findIndex(item => item.clientConversationId === clientConversationId)
    if (index >= 0) {
      conversations.value[index] = conversation
    } else {
      conversations.value.push(conversation)
    }
    conversations.value = sortConversations([...conversations.value])
    return conversation
  }

  /** 同步会话展示元数据 */
  function updateConversation(
    type: number,
    targetId: number,
    info: { name?: string, avatar?: string, silent?: boolean },
  ) {
    const conversation = getConversation(type, targetId)
    if (!conversation) {
      return
    }
    let changed = false
    if (info.name && conversation.name !== info.name) {
      conversation.name = info.name
      changed = true
    }
    if (info.avatar !== undefined && conversation.avatar !== info.avatar) {
      conversation.avatar = info.avatar || ''
      changed = true
    }
    if (info.silent !== undefined && conversation.silent !== info.silent) {
      conversation.silent = info.silent
      changed = true
    }
    if (changed) {
      saveConversation(conversation)
    }
  }

  /** 置顶 / 取消置顶 */
  async function setConversationTop(type: number, targetId: number, top: boolean) {
    await updateConversationLocal(getClientConversationId(type, targetId), { top })
  }

  /** 删除会话及其本地消息；再来新消息时恢复会话 */
  async function removeConversation(type: number, targetId: number) {
    const expectedUserId = selfUserId()
    if (expectedUserId <= 0) {
      return
    }
    const clientConversationId = getClientConversationId(type, targetId)
    return enqueueConversationOperation(
      clientConversationId,
      expectedUserId,
      () => removeConversationNow(clientConversationId, expectedUserId),
    )
  }

  /** 删除私聊会话 */
  function removePrivateConversation(friendId: number) {
    return removeConversation(ImConversationType.PRIVATE, friendId)
  }

  /** 删除群聊会话 */
  function removeGroupConversation(groupId: number) {
    return removeConversation(ImConversationType.GROUP, groupId)
  }

  /** 实际删除会话及其本地消息 */
  async function removeConversationNow(clientConversationId: string, expectedUserId: number) {
    if (selfUserId() !== expectedUserId) {
      return
    }
    const conversation = conversations.value.find(item =>
      item.clientConversationId === clientConversationId)
    if (!conversation) {
      return
    }
    conversation.deleted = true
    conversation.draft = undefined
    if (activeClientConversationId.value === clientConversationId) {
      activeClientConversationId.value = ''
    }
    await initImDb()
    if (selfUserId() !== expectedUserId) {
      return
    }
    const db = getImDb()
    await Promise.all([
      db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conversation))),
      useMessageStore().deleteConversationMessageList(clientConversationId, expectedUserId),
    ])
    if (selfUserId() === expectedUserId) {
      conversations.value = sortConversations([...conversations.value])
    }
  }

  /** 清空单个会话的本地聊天记录 */
  async function clearConversationMessages(clientConversationId: string) {
    const expectedUserId = selfUserId()
    if (expectedUserId <= 0) {
      return
    }
    await initImDb()
    if (selfUserId() !== expectedUserId) {
      return
    }
    await useMessageStore().deleteConversationMessageList(clientConversationId, expectedUserId)
    if (selfUserId() !== expectedUserId) {
      return
    }
    await updateConversationLocal(clientConversationId, {
      unreadCount: 0,
      lastContent: '',
      lastSendTime: 0,
      lastSenderId: undefined,
      lastMessageType: undefined,
      lastMessageId: undefined,
      lastClientMessageId: undefined,
      draft: undefined,
    })
    uni.$emit('im:conversation-cleared', clientConversationId)
  }

  /** 根据本地剩余消息重算会话摘要、未读和 @ 状态 */
  async function recomputeConversationFromStoredMessages(
    clientConversationId: string,
    expectedUserId: number,
  ) {
    if (expectedUserId <= 0 || selfUserId() !== expectedUserId) {
      return
    }
    const conversation = conversations.value.find(item => item.clientConversationId === clientConversationId)
    if (!conversation) {
      return
    }
    const db = getImDb()
    const [messages, read] = await Promise.all([
      db.filter<MessageDO>('messages', item => item.clientConversationId === clientConversationId),
      db.get<ConversationReadDO>('conversationReads', clientConversationId),
    ])
    if (selfUserId() !== expectedUserId) {
      return
    }
    messages.sort((left, right) => left.sendTime - right.sendTime)
    const last = messages[messages.length - 1]
    if (last) {
      const senderDisplayName = deriveLastSenderDisplayName(conversation, last.senderId)
      conversation.lastContent = resolveConversationLastContent(
        last,
        conversation.type,
        conversation.targetId,
        senderDisplayName,
      )
      conversation.lastSendTime = last.sendTime
      conversation.lastSenderId = last.senderId
      conversation.lastMessageType = last.type
      conversation.lastMessageId = last.id
      conversation.lastClientMessageId = last.clientMessageId
      conversation.lastMessageStatus = last.status
      conversation.lastReceiptStatus = last.receiptStatus
      conversation.lastSelfSend = last.selfSend
      conversation.lastSenderDisplayName = senderDisplayName
    } else {
      conversation.lastContent = ''
      conversation.lastSendTime = 0
      conversation.lastSenderId = undefined
      conversation.lastMessageType = undefined
      conversation.lastMessageId = undefined
      conversation.lastClientMessageId = undefined
      conversation.lastMessageStatus = undefined
      conversation.lastReceiptStatus = undefined
      conversation.lastSelfSend = undefined
      conversation.lastSenderDisplayName = undefined
    }
    const unreadMessages = messages.filter(item => !item.selfSend
      && (item.id || 0) > (read?.messageId || 0)
      && isNormalMessage(item.type)
      && item.status !== ImMessageStatus.RECALL)
    const atMessage = findLatestAtMessage(unreadMessages, expectedUserId)
    const atAllMessage = findLatestAtMessage(unreadMessages, IM_AT_ALL_USER_ID)
    conversation.unreadCount = unreadMessages.length
    conversation.atMe = !!atMessage
    conversation.atAll = !!atAllMessage
    conversation.atMessageId = atMessage?.id
    conversation.atAllMessageId = atAllMessage?.id
    await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conversation)))
    if (selfUserId() === expectedUserId) {
      conversations.value = sortConversations([...conversations.value])
    }
  }

  /** 保存会话草稿 */
  async function setConversationDraft(
    conversation: Pick<ConversationDO, 'type' | 'targetId'>,
    draft?: ConversationDO['draft'],
  ) {
    await updateConversationLocal(
      getClientConversationId(conversation.type, conversation.targetId),
      { draft },
    )
  }

  /** 获取会话草稿 */
  function getConversationDraft(conversation: Pick<ConversationDO, 'type' | 'targetId'>) {
    return getConversation(conversation.type, conversation.targetId)?.draft
  }

  /** 记录最近转发会话 */
  async function pushRecentForwardConversationKeyList(keys: string[], expectedUserId = selfUserId()) {
    if (expectedUserId <= 0 || selfUserId() !== expectedUserId) {
      return false
    }
    const merged = [...keys, ...recentForwardConversationKeys.value]
    const nextKeys = Array.from(new Set(merged)).slice(0, CONVERSATION_RECENT_FORWARD_MAX)
    await initImDb()
    if (selfUserId() !== expectedUserId) {
      return false
    }
    recentForwardConversationKeys.value = nextKeys
    await saveRecentForwardConversationKeyList()
    return true
  }

  /** 移除最近转发会话 */
  async function removeRecentForwardConversationKey(key: string, expectedUserId = selfUserId()) {
    if (expectedUserId <= 0 || selfUserId() !== expectedUserId) {
      return false
    }
    const nextKeys = recentForwardConversationKeys.value.filter(item => item !== key)
    await initImDb()
    if (selfUserId() !== expectedUserId) {
      return false
    }
    recentForwardConversationKeys.value = nextKeys
    await saveRecentForwardConversationKeyList()
    return true
  }

  /** 保存最近转发会话 */
  async function saveRecentForwardConversationKeyList() {
    await initImDb()
    await getImDb().setSetting(
      StorageKeys.settings.recentForwardConversationKeys,
      recentForwardConversationKeys.value.slice(0, CONVERSATION_RECENT_FORWARD_MAX),
    )
  }

  /** 清理当前账号的 IM 运行态；本地历史库按用户保留 */
  function clear() {
    loadEpoch++
    cancelPull()
    closeImDb()
    conversations.value = []
    conversationReads.value = {}
    recentForwardConversationKeys.value = []
    loading.value = false
    loadedUserId = 0
    stateUserId = 0
    activeClientConversationId.value = ''
    loadingUserId = 0
    reloadQueued = false
    pendingIncomingMessages.length = 0
    pendingRecallSignals.length = 0
    pendingRecallMessageKeys.clear()
    pendingIncomingWaiters.forEach(waiters => waiters.forEach(resolve => resolve()))
    pendingIncomingWaiters.clear()
    conversationOperationQueues.clear()
  }

  uni.$on('auth:logout', clear)

  /** 暴露会话状态与动作 */
  return {
    conversations,
    recentForwardConversationKeys,
    activeConversation,
    getTotalUnreadCount,
    loading,
    isLoaded: () => loadedUserId === selfUserId(),
    loadConversationList,
    markConversationRead,
    isReportedReadPositionCovered,
    markConversationReadReported,
    getConversation,
    setActiveConversation,
    isActiveConversation,
    applyIncomingMessage,
    applyRecallMessage,
    applyConversationReadList,
    pullConversationReads,
    ensureConversation,
    updateConversation,
    setConversationTop,
    removeConversation,
    removePrivateConversation,
    removeGroupConversation,
    clearConversationMessages,
    recomputeConversationFromStoredMessages,
    setConversationDraft,
    getConversationDraft,
    pushRecentForwardConversationKeyList,
    removeRecentForwardConversationKey,
    clear,
  }
})
