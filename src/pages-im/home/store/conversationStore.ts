// IM 会话列表：基于本地 DB 聚合会话（私聊 + 群聊、本地未读、离线与实时消息）
// 会话由消息流在客户端聚合，不依赖服务端会话接口

import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import type { ImConversationReadRespVO } from '@/api/im/conversation/read'
import type { ConversationDO, ConversationReadDO, ImDbClient, MessageDO } from '@/pages-im/utils/db'
import type { Friend, Group } from '../types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { pullMyConversationReadList } from '@/api/im/conversation/read'
import {
  getClientConversationId,
  getClientMessageKey,
  getDb,
  getServerMessageKey,
  initDb,
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
import {
  enqueueConversationBarrier,
  enqueueConversationWrite,
  enqueueConversationWrites,
  isMessageTerminated,
  isRelationTerminated,
  mergeMessageState,
} from '@/pages-im/utils/messageSync'
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
  let loaded = false // 是否已完成首次加载
  let reloadQueued = false // 当前拉取结束后是否需要再次强制补拉
  let replayingIncoming = false // 是否正在回放拉取期间的实时消息
  const pendingIncomingMessages: Array<{
    message: MessageDO
    db: ImDbClient
  }> = [] // 拉取期间暂存的实时消息及其所属数据库
  const pendingRecallSignals: Array<{
    conversationType: number
    targetId: number
    content: string
    db: ImDbClient
  }> = [] // 拉取期间暂存的撤回信号及其所属数据库
  const pendingIncomingWaiters = new Map<string, Array<(message?: MessageDO) => void>>() // 等待回放最终状态的实时消息

  /** 串行执行同一账号、同一会话的消息状态变更 */
  async function enqueueConversationOperation<T>(
    clientConversationId: string,
    operation: () => Promise<T>,
  ): Promise<T | undefined> {
    return enqueueConversationWrite(clientConversationId, operation)
  }

  /** 串行执行会话本地设置，并保持与实时消息操作的先后顺序 */
  function enqueueConversationLocalOperation<T>(
    clientConversationId: string,
    operation: () => Promise<T>,
  ) {
    return enqueueConversationOperation(clientConversationId, operation)
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
    db: ImDbClient,
    friendMap: Map<number, Friend>,
    groupMap: Map<number, Group>,
    channelMap: Map<number, ImManagerChannelVO>,
  ): Promise<ConversationDO[]> {
    const [storedMessages, reads, existing] = await Promise.all([
      db.getAll<MessageDO>('messages'),
      db.getAll<ConversationReadDO>('conversationReads'),
      db.getAll<ConversationDO>('conversations'),
    ])
    const terminalMessageKeys: string[] = []
    const recalledMessages: MessageDO[] = []
    const terminalStates = new Map<string, {
      clearBefore: number
      deleted: Set<string>
      recalled: Set<string>
    }>()
    const getTerminalState = async (clientConversationId: string) => {
      const cached = terminalStates.get(clientConversationId)
      if (cached) {
        return cached
      }
      const [clearBefore, deletedKeys, recalledKeys] = await Promise.all([
        db.getSetting<number>(
          `${StorageKeys.settings.conversationClearBeforePrefix}${clientConversationId}`,
        ),
        db.getSetting<string[]>(
          `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`,
        ),
        db.getSetting<string[]>(
          `${StorageKeys.settings.conversationRecalledMessagesPrefix}${clientConversationId}`,
        ),
      ])
      const state = {
        clearBefore: clearBefore || 0,
        deleted: new Set(deletedKeys || []),
        recalled: new Set(recalledKeys || []),
      }
      terminalStates.set(clientConversationId, state)
      return state
    }
    const conversationIds = new Set([
      ...storedMessages.map(message => message.clientConversationId),
      ...existing.map(conversation => conversation.clientConversationId),
    ])
    await Promise.all(Array.from(conversationIds)
      .map(clientConversationId => getTerminalState(clientConversationId)))
    const messages: MessageDO[] = []
    for (const message of storedMessages) {
      const terminal = terminalStates.get(message.clientConversationId)!
      if (isMessageTerminated(message, terminal.clearBefore, terminal.deleted)) {
        terminalMessageKeys.push(message.messageKey)
        continue
      }
      if (message.id
        && terminal.recalled.has(`id:${message.id}`)
        && message.status !== ImMessageStatus.RECALL) {
        const recalled = {
          ...message,
          type: ImMessageType.RECALL,
          content: '',
          status: ImMessageStatus.RECALL,
        }
        messages.push(recalled)
        recalledMessages.push(recalled)
      } else {
        messages.push(message)
      }
    }
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
      const groupUnavailable = type === ImConversationType.GROUP
        && (isGroupQuit(group) || isRelationTerminated(clientConversationId))
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
      const atMessage = findLatestAtMessage(unreadMessages, useUserStore().userInfo.userId)
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
      const terminal = terminalStates.get(conversation.clientConversationId)
      const summaryTerminated = !!terminal && (
        (!!conversation.lastMessageId && conversation.lastMessageId <= terminal.clearBefore)
        || (!!conversation.lastMessageId
          && terminal.deleted.has(`id:${conversation.lastMessageId}`))
        || (!!conversation.lastClientMessageId
          && terminal.deleted.has(`client:${conversation.lastClientMessageId}`))
      )
      const refreshed = {
        ...conversation,
        name,
        avatar,
        silent,
        ...(summaryTerminated
          ? {
              unreadCount: 0,
              lastContent: '',
              lastSendTime: 0,
              lastSenderId: undefined,
              lastMessageType: undefined,
              lastMessageId: undefined,
              lastClientMessageId: undefined,
              lastMessageStatus: undefined,
              lastReceiptStatus: undefined,
              lastSelfSend: undefined,
              lastSenderDisplayName: undefined,
              atMe: false,
              atAll: false,
              atMessageId: undefined,
              atAllMessageId: undefined,
            }
          : {}),
      }
      if (isGroupQuit(group)) {
        result.push({ ...refreshed, deleted: true })
      } else if (!conversation.deleted) {
        result.push(refreshed)
      }
    })

    if (expiredMessageKeys.length || terminalMessageKeys.length) {
      const expiredSet = new Set([...expiredMessageKeys, ...terminalMessageKeys])
      await db.removeWhere<MessageDO>('messages', item => expiredSet.has(item.messageKey))
    }
    if (recalledMessages.length) {
      await db.bulkPut<MessageDO>('messages', recalledMessages)
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
  let activeConversationOwner: symbol | undefined // 当前打开会话的页面实例
  const activeConversation = computed(() => conversations.value.find(item =>
    item.clientConversationId === activeClientConversationId.value)) // 当前打开的会话
  const { pullOnce } = useMessagePuller({
    pullConversationReads,
    getActiveConversation: () => activeConversation.value,
  })

  /** 加载会话列表（拉取 + 聚合） */
  async function loadConversationList(forceMetadata = false) {
    if (loading.value) {
      reloadQueued ||= forceMetadata
      return
    }
    loading.value = true
    let cachedConversations: ConversationDO[] = []
    let db: ImDbClient | undefined
    try {
      db = await initDb()
      await enqueueConversationBarrier(async () => {
        const [cachedRows, cachedReads, recentForwardKeys] = await Promise.all([
          db.getAll<ConversationDO>('conversations'),
          db.getAll<ConversationReadDO>('conversationReads'),
          db.getSetting<string[]>(StorageKeys.settings.recentForwardConversationKeys),
        ])
        cachedConversations = cachedRows
        conversationReads.value = Object.fromEntries(cachedReads.map(record => [
          record.clientConversationId,
          record,
        ]))
        if (cachedConversations.length) {
          await applyLocalConversationReads(cachedConversations, db)
          conversations.value = sortConversations(cachedConversations)
        }
        if (Array.isArray(recentForwardKeys)) {
          recentForwardConversationKeys.value = recentForwardKeys.slice(0, CONVERSATION_RECENT_FORWARD_MAX)
        }
      })
      let friends: Friend[]
      let groups: Group[]
      let channels: ImManagerChannelVO[]
      try {
        const metadata = await pullOnce(forceMetadata)
        if (!metadata) {
          return
        }
        friends = metadata.friends
        groups = metadata.groups
        channels = metadata.channels
      } catch (error) {
        loaded = true
        if (cachedConversations.length) {
          return
        }
        throw error
      }
      const friendMap = new Map(friends.map(item => [item.friendUserId, item]))
      const groupMap = new Map(groups.map(item => [item.id, item]))
      const channelMap = new Map(channels.map(item => [item.id, item]))

      await enqueueConversationBarrier(async () => {
        const list = await rebuildConversations(db!, friendMap, groupMap, channelMap)
        conversations.value = sortConversations(list)
        loaded = true
      })
    } finally {
      const shouldReload = reloadQueued
      loading.value = false
      reloadQueued = false
      await flushPendingIncomingMessages()
      if (shouldReload) {
        void loadConversationList(true).catch(() => undefined)
      }
    }
  }

  /** 设置当前打开的会话及其页面实例 */
  function setActiveConversation(
    conversation: Pick<ConversationDO, 'type' | 'targetId'>,
    owner: symbol,
  ) {
    activeClientConversationId.value = getClientConversationId(conversation.type, conversation.targetId)
    activeConversationOwner = owner
  }

  /** 仅由持有者清除当前打开的会话 */
  function releaseActiveConversation(owner: symbol) {
    if (activeConversationOwner !== owner) {
      return
    }
    activeClientConversationId.value = ''
    activeConversationOwner = undefined
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
  async function applyLocalConversationReads(
    target = conversations.value,
    db?: ImDbClient,
  ) {
    const client = db || await initDb()
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
      const messages = await client.filter<MessageDO>('messages', item =>
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
      await saveConversationRecord(changed, client)
    }
  }

  /** 应用一条实时消息：写库 + 更新会话摘要/未读 + 重排 */
  async function applyIncomingMessage(
    message: MessageDO,
    waitForReplay = false,
    db?: ImDbClient,
  ) {
    const client = db || getDb()
    if (loading.value && !replayingIncoming) {
      const key = message.messageKey
      const index = pendingIncomingMessages.findIndex(item => item.message.messageKey === key)
      const pending = { message, db: client }
      if (index >= 0) {
        pendingIncomingMessages[index] = pending
      } else {
        pendingIncomingMessages.push(pending)
      }
      if (!waitForReplay) {
        return
      }
      return new Promise<MessageDO | undefined>((resolve) => {
        const waiters = pendingIncomingWaiters.get(message.clientMessageId) || []
        waiters.push(resolve)
        pendingIncomingWaiters.set(message.clientMessageId, waiters)
      })
    }
    return enqueueConversationOperation(
      message.clientConversationId,
      () => applyIncomingMessageNow(message, client),
    )
  }

  /** 实际持久化一条实时消息；命中本地终态时返回 false */
  async function applyIncomingMessageNow(
    message: MessageDO,
    db?: ImDbClient,
  ) {
    const client = db || await initDb()
    const [storedMessage, read, group, clearBefore, deletedKeys, recalledKeys] = await Promise.all([
      client.get<MessageDO>('messages', message.messageKey),
      client.get<ConversationReadDO>('conversationReads', message.clientConversationId),
      message.conversationType === ImConversationType.GROUP
        ? client.get<Group>('groups', message.targetId)
        : Promise.resolve(undefined),
      client.getSetting<number>(
        `${StorageKeys.settings.conversationClearBeforePrefix}${message.clientConversationId}`,
      ),
      client.getSetting<string[]>(
        `${StorageKeys.settings.conversationDeletedMessagesPrefix}${message.clientConversationId}`,
      ),
      client.getSetting<string[]>(
        `${StorageKeys.settings.conversationRecalledMessagesPrefix}${message.clientConversationId}`,
      ),
    ])
    const deleted = new Set(deletedKeys || [])
    if (isMessageTerminated(message, clearBefore || 0, deleted)) {
      return false
    }
    const recalledBeforeArrival = !!message.id && new Set(recalledKeys || []).has(`id:${message.id}`)
    const incomingMessage = recalledBeforeArrival || message.status === ImMessageStatus.RECALL
      ? {
          ...message,
          type: ImMessageType.RECALL,
          content: '',
          status: ImMessageStatus.RECALL,
        }
      : message
    let localMessage: MessageDO | undefined
    let serverMessage = incomingMessage.id ? storedMessage : undefined
    if (incomingMessage.id && incomingMessage.clientMessageId) {
      localMessage = await client.get<MessageDO>(
        'messages',
        getClientMessageKey(incomingMessage.clientMessageId),
      )
    } else if (incomingMessage.clientMessageId) {
      const matches = await client.filter<MessageDO>(
        'messages',
        item => item.clientConversationId === incomingMessage.clientConversationId
          && item.clientMessageId === incomingMessage.clientMessageId
          && !!item.id,
      )
      serverMessage = matches[0]
      localMessage = storedMessage
    }
    const currentMessage = serverMessage || localMessage
    const appliedMessage = mergeMessageState(currentMessage, incomingMessage)
    if (appliedMessage.id && localMessage) {
      await client.delete('messages', localMessage.messageKey)
    }
    await client.put<MessageDO>('messages', appliedMessage)
    const ccid = appliedMessage.clientConversationId
    let conv = conversations.value.find(item => item.clientConversationId === ccid)
    if (!conv) {
      const [storedConversation, friends, channel] = await Promise.all([
        client.get<ConversationDO>('conversations', ccid),
        appliedMessage.conversationType === ImConversationType.PRIVATE
          ? client.filter<Friend>('friends', item => item.friendUserId === appliedMessage.targetId)
          : Promise.resolve([]),
        appliedMessage.conversationType === ImConversationType.CHANNEL
          ? client.get<ImManagerChannelVO>('channels', appliedMessage.targetId)
          : Promise.resolve(undefined),
      ])
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
    const isExisting = !!currentMessage
    const groupUnavailable = isGroupQuit(group)
      || isRelationTerminated(appliedMessage.clientConversationId)
    if (groupUnavailable) {
      conv.deleted = true
    } else if (!isExisting) {
      conv.deleted = false
    }
    const isLatest = !conv.lastSendTime
      || (!!appliedMessage.id && !!conv.lastMessageId && appliedMessage.id >= conv.lastMessageId)
      || ((!appliedMessage.id || !conv.lastMessageId) && appliedMessage.sendTime >= conv.lastSendTime)
    if (isLatest) {
      const senderDisplayName = deriveLastSenderDisplayName(
        conv,
        appliedMessage.senderId,
      )
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
      if (appliedMessage.atUserIds?.includes(useUserStore().userInfo.userId)) {
        conv.atMe = true
        conv.atMessageId = appliedMessage.id
      }
      if (appliedMessage.atUserIds?.includes(IM_AT_ALL_USER_ID)) {
        conv.atAll = true
        conv.atAllMessageId = appliedMessage.id
      }
    }
    await client.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conv)))
    conversations.value = sortConversations([...conversations.value])
    // 当前会话打开中：顺手推进读位置，保持已读
    if (ccid === activeClientConversationId.value && appliedMessage.id) {
      await markConversationReadNow(
        appliedMessage.conversationType,
        appliedMessage.targetId,
        appliedMessage.id,
        client,
      )
    }
    return appliedMessage
  }

  /** 应用撤回信号：更新原消息，不保留撤回信号本身 */
  async function applyRecallMessage(
    conversationType: number,
    targetId: number,
    content: string,
    db?: ImDbClient,
  ) {
    const client = db || getDb()
    const messageId = parseRecallMessageId(content)
    if (!messageId) {
      return
    }
    if (loading.value && !replayingIncoming) {
      const index = pendingRecallSignals.findIndex(item => item.conversationType === conversationType
        && item.targetId === targetId
        && parseRecallMessageId(item.content) === messageId)
      const signal = { conversationType, targetId, content, db: client }
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
      () => applyRecallMessageNow(conversationType, targetId, messageId, client),
    )
  }

  /** 实际把原消息更新为撤回终态 */
  async function applyRecallMessageNow(
    conversationType: number,
    targetId: number,
    messageId: number,
    db?: ImDbClient,
  ) {
    const client = db || await initDb()
    const clientConversationId = getClientConversationId(conversationType, targetId)
    const recallSettingKey
      = `${StorageKeys.settings.conversationRecalledMessagesPrefix}${clientConversationId}`
    const recalledKeys = (await client.getSetting<string[]>(recallSettingKey)) || []
    await client.setSetting(
      recallSettingKey,
      Array.from(new Set([...recalledKeys, `id:${messageId}`])),
    )
    const messageKey = getServerMessageKey(conversationType, messageId)
    const original = await client.get<MessageDO>('messages', messageKey)
    if (!original) {
      return
    }
    const recalled = {
      ...original,
      type: ImMessageType.RECALL,
      content: '',
      status: ImMessageStatus.RECALL,
    }
    await client.put<MessageDO>('messages', recalled)
    const conversation = conversations.value.find(item => item.clientConversationId === clientConversationId)
      || await client.get<ConversationDO>('conversations', clientConversationId)
    if (!conversation) {
      return recalled
    }
    const [messages, read] = await Promise.all([
      client.filter<MessageDO>('messages', item => item.clientConversationId === clientConversationId),
      client.get<ConversationReadDO>('conversationReads', clientConversationId),
    ])
    const unreadMessages = messages.filter(item => !item.selfSend
      && (item.id || 0) > (read?.messageId || 0)
      && isNormalMessage(item.type)
      && item.status !== ImMessageStatus.RECALL)
    conversation.unreadCount = unreadMessages.length
    const atMessage = findLatestAtMessage(unreadMessages, useUserStore().userInfo.userId)
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
    await client.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conversation)))
    if (conversations.value.some(item => item.clientConversationId === clientConversationId)) {
      conversations.value = sortConversations([...conversations.value])
    }
    return recalled
  }

  /** 结束等待回放最终状态的实时消息 */
  function resolvePendingIncomingWaiters(
    clientMessageId: string,
    message?: MessageDO,
  ) {
    pendingIncomingWaiters.get(clientMessageId)?.forEach(resolve => resolve(message))
    pendingIncomingWaiters.delete(clientMessageId)
  }

  /** 回放拉取期间到达的实时消息 */
  async function flushPendingIncomingMessages() {
    if (pendingIncomingMessages.length === 0 && pendingRecallSignals.length === 0) {
      return
    }
    const messages = pendingIncomingMessages.splice(0)
      .sort((a, b) => a.message.sendTime - b.message.sendTime)
    const recalls = pendingRecallSignals.splice(0)
    replayingIncoming = true
    try {
      for (const { message, db } of messages) {
        try {
          await applyIncomingMessage(message, false, db)
        } catch (error) {
          console.warn('[IM conversationStore] 实时消息回放失败', {
            messageKey: message.messageKey,
          }, error)
        }
      }
      for (const signal of recalls) {
        try {
          await applyRecallMessage(signal.conversationType, signal.targetId, signal.content, signal.db)
        } catch (error) {
          console.warn('[IM conversationStore] 撤回信号回放失败', {
            conversationType: signal.conversationType,
            targetId: signal.targetId,
          }, error)
        }
      }
      if (messages.length === 0) {
        return
      }
      const clientMessageDbs = new Map(messages.map(({ message, db }) => [message.clientMessageId, db]))
      const clientMessageIds = Array.from(clientMessageDbs.keys())
      const finalMessages = await Promise.allSettled(clientMessageIds.map(async (clientMessageId) => {
        const client = clientMessageDbs.get(clientMessageId)!
        const rows = await client.filter<MessageDO>(
          'messages',
          message => message.clientMessageId === clientMessageId,
        )
        return rows.find(message => !!message.id) || rows[0]
      }))
      clientMessageIds.forEach((clientMessageId, index) => {
        const result = finalMessages[index]
        if (result.status === 'rejected') {
          console.warn('[IM conversationStore] 读取回放消息终态失败', {
            clientMessageId,
          }, result.reason)
        }
        resolvePendingIncomingWaiters(
          clientMessageId,
          result.status === 'fulfilled' ? result.value : undefined,
        )
      })
    } finally {
      new Set(messages.map(item => item.message.clientMessageId)).forEach(clientMessageId =>
        resolvePendingIncomingWaiters(clientMessageId))
      replayingIncoming = false
    }
  }

  /** 应用一批会话读位置 */
  async function applyConversationReadList(
    records: ImConversationReadRespVO[],
    db?: ImDbClient,
  ) {
    const client = db || getDb()
    const conversationIds = records
      .filter(record => !!record.messageId && !!record.conversationType && !!record.targetId)
      .map(record => getClientConversationId(record.conversationType, record.targetId))
    await enqueueConversationWrites(conversationIds, () => applyConversationReadListNow(records, client))
  }

  /** 实际应用会话读位置；调用方必须持有涉及会话的写 lane */
  async function applyConversationReadListNow(
    records: ImConversationReadRespVO[],
    db: ImDbClient,
  ) {
    if (records.length === 0) {
      return
    }
    for (const record of records) {
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
    conversations.value = sortConversations([...conversations.value])
  }

  /** 增量拉取多端会话读位置 */
  async function pullConversationReads() {
    const db = await initDb()
    await runIncrementalPull(db, StorageKeys.settings.conversationReadPullCursor, params => pullMyConversationReadList(params), async (list) => {
      await applyConversationReadList(list, db)
      return true
    })
  }

  /** 标记会话已读（进入聊天页时调用） */
  async function markConversationRead(
    type: number,
    targetId: number,
    messageId?: number,
    db: ImDbClient = getDb(),
  ) {
    await enqueueConversationWrite(
      getClientConversationId(type, targetId),
      () => markConversationReadNow(type, targetId, messageId, db),
    )
  }

  /** 实际标记会话已读；调用方必须持有当前会话写 lane */
  async function markConversationReadNow(
    type: number,
    targetId: number,
    messageId?: number,
    db?: ImDbClient,
  ) {
    const clientConversationId = getClientConversationId(type, targetId)
    const client = db || await initDb()
    const target = conversations.value.find(item => item.clientConversationId === clientConversationId)
    if (!target) {
      return
    }
    const current = conversationReads.value[clientConversationId]
      || await client.get<ConversationReadDO>('conversationReads', clientConversationId)
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
      await client.put<ConversationReadDO>('conversationReads', conversationRead)
    }
    target.unreadCount = 0
    target.atMe = false
    target.atAll = false
    target.atMessageId = undefined
    target.atAllMessageId = undefined
    await client.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(target)))
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
    db: ImDbClient = getDb(),
  ) {
    await enqueueConversationWrite(
      getClientConversationId(type, targetId),
      () => markConversationReadReportedNow(type, targetId, messageId, db),
    )
  }

  /** 实际记录已上报读位置；调用方必须持有当前会话写 lane */
  async function markConversationReadReportedNow(
    type: number,
    targetId: number,
    messageId?: number,
    db: ImDbClient = getDb(),
  ) {
    if (!messageId) {
      return
    }
    const conversation = getConversation(type, targetId)
    if (!conversation || messageId <= (conversation.reportedReadMessageId || 0)) {
      return
    }
    conversation.reportedReadMessageId = messageId
    await db.put<ConversationDO>(
      'conversations',
      JSON.parse(JSON.stringify(conversation)),
    )
  }

  /** 更新会话本地设置并持久化 + 重排 */
  async function updateConversationLocal(
    clientConversationId: string,
    patch: Partial<ConversationDO>,
    db: ImDbClient,
  ) {
    const target = conversations.value.find(item => item.clientConversationId === clientConversationId)
    if (!target || target.deleted) {
      return
    }
    const previous = Object.fromEntries(
      Object.keys(patch).map(key => [key, target[key as keyof ConversationDO]]),
    ) as Partial<ConversationDO>
    Object.assign(target, patch)
    try {
      await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(target)))
      conversations.value = sortConversations([...conversations.value])
    } catch (error) {
      if (conversations.value.includes(target)) {
        Object.assign(target, previous)
        conversations.value = sortConversations([...conversations.value])
      }
      throw error
    }
  }

  /** 执行会话记录持久化 */
  async function saveConversationRecord(
    target: ConversationDO | ConversationDO[] | null | undefined,
    db?: ImDbClient,
  ): Promise<void> {
    const records = Array.isArray(target) ? target : target ? [target] : []
    if (records.length === 0) {
      return
    }
    const client = db || await initDb()
    await client.bulkPut('conversations', records.map(record =>
      JSON.parse(JSON.stringify(record)) as ConversationDO))
  }

  /** 创建或刷新一个显式打开的会话 */
  async function ensureConversation(info: {
    type: number
    targetId: number
    name: string
    avatar: string
    silent?: boolean
  }) {
    if (info.targetId <= 0) {
      return
    }
    const db = getDb()
    const clientConversationId = getClientConversationId(info.type, info.targetId)
    return enqueueConversationLocalOperation(
      clientConversationId,
      () => ensureConversationNow(info, clientConversationId, db),
    )
  }

  /** 实际创建或刷新一个显式打开的会话 */
  async function ensureConversationNow(
    info: { type: number, targetId: number, name: string, avatar: string, silent?: boolean },
    clientConversationId: string,
    db: ImDbClient,
  ) {
    const current = conversations.value.find(item => item.clientConversationId === clientConversationId)
      || await db.get<ConversationDO>('conversations', clientConversationId)
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
    db: ImDbClient = getDb(),
  ) {
    const clientConversationId = getClientConversationId(type, targetId)
    void enqueueConversationWrite(clientConversationId, async () => {
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
        await saveConversationRecord(conversation, db)
      }
    }).catch(error => console.warn('[IM conversationStore] 会话元数据写入失败', error))
  }

  /** 置顶 / 取消置顶 */
  async function setConversationTop(
    type: number,
    targetId: number,
    top: boolean,
  ) {
    const db = getDb()
    const clientConversationId = getClientConversationId(type, targetId)
    return enqueueConversationLocalOperation(clientConversationId, async () => {
      await updateConversationLocal(clientConversationId, { top }, db)
    })
  }

  /** 删除会话及其本地消息；再来新消息时恢复会话 */
  async function removeConversation(
    type: number,
    targetId: number,
    beforeRemove?: () => Promise<void> | void,
    db: ImDbClient = getDb(),
  ) {
    const clientConversationId = getClientConversationId(type, targetId)
    return enqueueConversationLocalOperation(
      clientConversationId,
      async () => {
        await beforeRemove?.()
        await removeConversationNow(clientConversationId, db)
      },
    )
  }

  /** 删除私聊会话 */
  function removePrivateConversation(
    friendId: number,
    db?: ImDbClient,
  ) {
    return removeConversation(ImConversationType.PRIVATE, friendId, undefined, db)
  }

  /** 删除群聊会话 */
  function removeGroupConversation(
    groupId: number,
    beforeRemove?: () => Promise<void> | void,
    db?: ImDbClient,
  ) {
    return removeConversation(ImConversationType.GROUP, groupId, beforeRemove, db)
  }

  /** 实际删除会话及其本地消息 */
  async function removeConversationNow(
    clientConversationId: string,
    db?: ImDbClient,
  ) {
    const client = db || await initDb()
    const memoryConversation = conversations.value.find(item =>
      item.clientConversationId === clientConversationId)
    const conversation = memoryConversation
      || await client.get<ConversationDO>('conversations', clientConversationId)
    if (!conversation) {
      return
    }
    const nextConversation = { ...conversation, deleted: true, draft: undefined }
    const pendingClientMessageIds = pendingIncomingMessages
      .filter(item => item.message.clientConversationId === clientConversationId)
      .map(item => item.message.clientMessageId)
    await useMessageStore().deleteConversationMessageListNow(
      clientConversationId,
      pendingClientMessageIds,
      client,
    )
    await client.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(nextConversation)))
    if (memoryConversation) {
      Object.assign(memoryConversation, nextConversation)
      if (activeClientConversationId.value === clientConversationId) {
        activeClientConversationId.value = ''
        activeConversationOwner = undefined
      }
      conversations.value = sortConversations([...conversations.value])
    }
  }

  /** 清空单个会话的本地聊天记录 */
  async function clearConversationMessages(
    clientConversationId: string,
  ) {
    const db = getDb()
    return enqueueConversationLocalOperation(clientConversationId, async () => {
      const pendingClientMessageIds = pendingIncomingMessages
        .filter(item => item.message.clientConversationId === clientConversationId)
        .map(item => item.message.clientMessageId)
      await useMessageStore().deleteConversationMessageListNow(
        clientConversationId,
        pendingClientMessageIds,
        db,
      )
      await updateConversationLocal(clientConversationId, {
        unreadCount: 0,
        lastContent: '',
        lastSendTime: 0,
        lastSenderId: undefined,
        lastMessageType: undefined,
        lastMessageId: undefined,
        lastClientMessageId: undefined,
        lastMessageStatus: undefined,
        lastReceiptStatus: undefined,
        lastSelfSend: undefined,
        lastSenderDisplayName: undefined,
        atMe: false,
        atAll: false,
        atMessageId: undefined,
        atAllMessageId: undefined,
        draft: undefined,
      }, db)
      uni.$emit('im:conversation-cleared', clientConversationId)
    })
  }

  /** 根据本地剩余消息重算会话摘要、未读和 @ 状态 */
  async function recomputeConversationFromStoredMessages(
    clientConversationId: string,
    db: ImDbClient = getDb(),
    currentUserId = useUserStore().userInfo.userId,
  ) {
    const conversation = conversations.value.find(item => item.clientConversationId === clientConversationId)
    if (!conversation) {
      return
    }
    const [messages, read] = await Promise.all([
      db.filter<MessageDO>('messages', item => item.clientConversationId === clientConversationId),
      db.get<ConversationReadDO>('conversationReads', clientConversationId),
    ])
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
    const atMessage = findLatestAtMessage(unreadMessages, currentUserId)
    const atAllMessage = findLatestAtMessage(unreadMessages, IM_AT_ALL_USER_ID)
    conversation.unreadCount = unreadMessages.length
    conversation.atMe = !!atMessage
    conversation.atAll = !!atAllMessage
    conversation.atMessageId = atMessage?.id
    conversation.atAllMessageId = atAllMessage?.id
    await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conversation)))
    conversations.value = sortConversations([...conversations.value])
  }

  /** 保存会话草稿 */
  async function setConversationDraft(
    conversation: Pick<ConversationDO, 'type' | 'targetId'>,
    draft?: ConversationDO['draft'],
  ) {
    const db = getDb()
    const clientConversationId = getClientConversationId(conversation.type, conversation.targetId)
    await enqueueConversationLocalOperation(
      clientConversationId,
      () => updateConversationLocal(clientConversationId, { draft }, db),
    )
  }

  /** 获取会话草稿 */
  function getConversationDraft(conversation: Pick<ConversationDO, 'type' | 'targetId'>) {
    return getConversation(conversation.type, conversation.targetId)?.draft
  }

  /** 记录最近转发会话 */
  async function pushRecentForwardConversationKeyList(
    keys: string[],
  ) {
    const db = getDb()
    const merged = [...keys, ...recentForwardConversationKeys.value]
    const nextKeys = Array.from(new Set(merged)).slice(0, CONVERSATION_RECENT_FORWARD_MAX)
    recentForwardConversationKeys.value = nextKeys
    await saveRecentForwardConversationKeyList(db)
    return true
  }

  /** 移除最近转发会话 */
  async function removeRecentForwardConversationKey(
    key: string,
  ) {
    const db = getDb()
    const nextKeys = recentForwardConversationKeys.value.filter(item => item !== key)
    recentForwardConversationKeys.value = nextKeys
    await saveRecentForwardConversationKeyList(db)
    return true
  }

  /** 保存最近转发会话 */
  async function saveRecentForwardConversationKeyList(db: ImDbClient) {
    await db.setSetting(
      StorageKeys.settings.recentForwardConversationKeys,
      recentForwardConversationKeys.value.slice(0, CONVERSATION_RECENT_FORWARD_MAX),
    )
  }

  /** 清理当前账号的 IM 运行态；本地历史库按用户保留 */
  function clear() {
    conversations.value = []
    conversationReads.value = {}
    recentForwardConversationKeys.value = []
    loading.value = false
    loaded = false
    activeClientConversationId.value = ''
    activeConversationOwner = undefined
    reloadQueued = false
    pendingIncomingMessages.length = 0
    pendingRecallSignals.length = 0
    pendingIncomingWaiters.forEach(waiters => waiters.forEach(resolve => resolve()))
    pendingIncomingWaiters.clear()
  }

  /** 暴露会话状态与动作 */
  return {
    conversations,
    recentForwardConversationKeys,
    activeConversation,
    getTotalUnreadCount,
    loading,
    isLoaded: () => loaded,
    loadConversationList,
    markConversationRead,
    isReportedReadPositionCovered,
    markConversationReadReported,
    getConversation,
    setActiveConversation,
    releaseActiveConversation,
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
