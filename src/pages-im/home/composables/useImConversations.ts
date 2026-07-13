// IM 会话列表：基于本地 DB 聚合会话（私聊 + 群聊、本地未读、离线与实时消息）
// 会话由消息流在客户端聚合，不依赖服务端会话接口

import type { ImFriendRespVO } from '@/api/im/friend'
import type { ImGroupRespVO } from '@/api/im/group'
import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import type { ImConversationReadRespVO } from '@/api/im/conversation/read'
import type { ConversationDO, ConversationReadDO, MessageDO } from '@/pages-im/home/db'
import { ref } from 'vue'
import { getMyFriendList } from '@/api/im/friend'
import { getMyGroupList } from '@/api/im/group'
import { getSimpleChannelList } from '@/api/im/manager/channel'
import { pullMyConversationReadList } from '@/api/im/conversation/read'
import {
  closeImDb,
  getClientConversationId,
  getClientMessageKey,
  getImDb,
  getServerMessageKey,
  ImSettingKeys,
  initImDb,
} from '@/pages-im/home/db'
import { useUserStore } from '@/store/user'
import {
  CommonStatusEnum,
  IM_AT_ALL_USER_ID,
  ImConversationType,
  ImMessageStatus,
  ImMessageType,
  isNormalMessage,
} from '@/utils/constants'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { parseRecallMessageId } from '@/pages-im/utils/message'
import { getFriendDisplayName, getGroupDisplayName } from '@/pages-im/utils/user'
import { MESSAGE_PULL_PAGE_SIZE } from '@/pages-im/utils/config'
import { runIncrementalPull } from '@/pages-im/utils/pull'
import { useConversationBuilder } from './useConversationBuilder'
import { useMessagePuller } from './useMessagePuller'

const conversations = ref<ConversationDO[]>([]) // 会话列表（已排序）
const loading = ref(false) // 加载状态
let loadedUserId = 0 // 已完成首次加载的用户编号
let stateUserId = 0 // 当前内存会话所属用户
let loadEpoch = 0 // 拉取轮次；退出或切换账号后旧请求不得落地
let loadingUserId = 0 // 当前拉取所属用户
let replayingIncoming = false // 是否正在回放拉取期间的实时消息
const pendingIncomingMessages: MessageDO[] = [] // 拉取期间暂存的实时消息
const pendingRecallSignals: Array<{ conversationType: number, targetId: number, content: string }> = [] // 拉取期间暂存的撤回信号
const pendingIncomingWaiters = new Map<string, Array<(message?: MessageDO) => void>>() // 等待回放最终状态的实时消息
const conversationOperationQueues = new Map<string, Promise<void>>() // 按账号和会话串行执行消息状态变更

/** 当前登录用户 id */
function selfUserId(): number {
  return useUserStore().userInfo.userId
}

/** 确保模块级内存只属于当前账号 */
function ensureStateUser(userId: number) {
  if (stateUserId && stateUserId !== userId) {
    resetImConversations()
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

const { pullAllMessages, buildIncomingMessage } = useMessagePuller(selfUserId)
const { rebuildConversations, sortConversations } = useConversationBuilder(selfUserId)

/** 加载会话列表（拉取 + 聚合） */
async function load() {
  const self = selfUserId()
  if ((loadedUserId && loadedUserId !== self)
    || (loadingUserId && loadingUserId !== self)) {
    resetImConversations()
  }
  ensureStateUser(self)
  if (loading.value && loadingUserId === self) {
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
    const cachedConversations = await db.getAll<ConversationDO>('conversations')
    if (isActive() && cachedConversations.length) {
      conversations.value = sortConversations(cachedConversations)
    }
    let friends: ImFriendRespVO[]
    let groups: ImGroupRespVO[]
    let channels: ImManagerChannelVO[]
    try {
      [friends, groups, channels] = await Promise.all([getMyFriendList(), getMyGroupList(), getSimpleChannelList()])
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
    await Promise.all([
      db.bulkPut<ImFriendRespVO>('friends', JSON.parse(JSON.stringify(friends))),
      db.bulkPut<ImGroupRespVO>('groups', JSON.parse(JSON.stringify(groups))),
      db.bulkPut<ImManagerChannelVO>('channels', JSON.parse(JSON.stringify(channels))),
    ])
    if (!isActive()) {
      return
    }

    await pullAllMessages(isActive)
    await pullConversationReads(isActive)
    if (!isActive()) {
      return
    }

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
      loading.value = false
      loadingUserId = 0
      await flushPendingIncomingMessages(self)
    }
  }
}

const activeClientConversationId = ref('') // 当前打开的会话（实时消息不计未读）

/** 设置/清除当前打开的会话 */
function setActiveConversation(type: number | null, targetId?: number) {
  activeClientConversationId.value = type && targetId ? getClientConversationId(type, targetId) : ''
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
      ? db.get<ImGroupRespVO>('groups', message.targetId)
      : Promise.resolve(undefined),
  ])
  if (expectedUserId !== selfUserId()) {
    return
  }
  const incomingMessage = message.status === ImMessageStatus.RECALL
    ? { ...message, type: ImMessageType.RECALL, content: '' }
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
  const ccid = appliedMessage.clientConversationId
  let conv = conversations.value.find(item => item.clientConversationId === ccid)
  if (!conv) {
    const [storedConversation, friends, channel] = await Promise.all([
      db.get<ConversationDO>('conversations', ccid),
      appliedMessage.conversationType === ImConversationType.PRIVATE
        ? db.filter<ImFriendRespVO>('friends', item => item.friendUserId === appliedMessage.targetId)
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
  const groupUnavailable = !!group
    && (group.status === CommonStatusEnum.DISABLE || group.joinStatus === CommonStatusEnum.DISABLE)
  if (groupUnavailable) {
    conv.deleted = true
  } else if (!isExisting) {
    conv.deleted = false
  }
  const isLatest = !conv.lastSendTime
    || (!!appliedMessage.id && !!conv.lastMessageId && appliedMessage.id >= conv.lastMessageId)
    || ((!appliedMessage.id || !conv.lastMessageId) && appliedMessage.sendTime >= conv.lastSendTime)
  if (isLatest) {
    conv.lastContent = getMessageSummary(appliedMessage.type, appliedMessage.content)
    conv.lastSendTime = appliedMessage.sendTime
    conv.lastSenderId = appliedMessage.senderId
    conv.lastMessageType = appliedMessage.type
    conv.lastMessageId = appliedMessage.id
    conv.lastClientMessageId = appliedMessage.clientMessageId
    conv.lastMessageStatus = appliedMessage.status
    conv.lastSelfSend = appliedMessage.selfSend
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
  if (!original || expectedUserId !== selfUserId()) {
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
  const atMessage = [...unreadMessages].reverse().find(item => item.atUserIds?.includes(expectedUserId))
  const atAllMessage = [...unreadMessages].reverse().find(item => item.atUserIds?.includes(IM_AT_ALL_USER_ID))
  conversation.atMe = !!atMessage
  conversation.atAll = !!atAllMessage
  conversation.atMessageId = atMessage?.id
  conversation.atAllMessageId = atAllMessage?.id
  if (conversation.lastMessageId === messageId) {
    conversation.lastContent = getMessageSummary(ImMessageType.RECALL, '')
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
    const current = await db.get<ConversationReadDO>('conversationReads', clientConversationId)
    const messageId = Math.max(current?.messageId || 0, record.messageId)
    await db.put<ConversationReadDO>('conversationReads', {
      clientConversationId,
      conversationType: record.conversationType,
      targetId: record.targetId,
      messageId,
      updateTime: record.updateTime || Date.now(),
    })
    const conversation = conversations.value.find(item => item.clientConversationId === clientConversationId)
    if (!conversation) {
      continue
    }
    const messages = await db.filter<MessageDO>('messages', item => item.clientConversationId === clientConversationId)
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
    await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conversation)))
  }
  if (!isActive()) {
    return
  }
  conversations.value = sortConversations([...conversations.value])
}

/** 增量拉取多端会话读位置 */
async function pullConversationReads(isActive: () => boolean = () => true) {
  const db = getImDb()
  const cursor = (await db.getSetting<{ lastUpdateTime?: number, lastId?: number }>(ImSettingKeys.conversationReadPullCursor)) || {}
  await runIncrementalPull({
    cursor,
    pageSize: MESSAGE_PULL_PAGE_SIZE,
    fetchPage: current => pullMyConversationReadList({ ...current, limit: MESSAGE_PULL_PAGE_SIZE }),
    applyPage: list => applyConversationReadList(list, isActive),
    persistCursor: current => db.setSetting(ImSettingKeys.conversationReadPullCursor, current),
    isActive,
  })
}

/** 获取当前会话未完成的本地消息；重启后的 sending 统一降级为 failed */
async function getConversationPendingMessages(clientConversationId: string): Promise<MessageDO[]> {
  await initImDb()
  const db = getImDb()
  const allMessages = await db.filter<MessageDO>('messages', item => item.clientConversationId === clientConversationId)
  const serverClientMessageIds = new Set(allMessages.filter(item => !!item.id).map(item => item.clientMessageId))
  const staleLocalMessages = allMessages.filter(item => !item.id && serverClientMessageIds.has(item.clientMessageId))
  await Promise.all(staleLocalMessages.map(item => db.delete('messages', item.messageKey)))
  const messages = allMessages.filter(item => !item.id
    && !serverClientMessageIds.has(item.clientMessageId)
    && (item.status === ImMessageStatus.SENDING || item.status === ImMessageStatus.FAILED))
  const recovered = messages.map(message => message.status === ImMessageStatus.SENDING
    ? { ...message, status: ImMessageStatus.FAILED }
    : message)
  await db.bulkPut<MessageDO>('messages', recovered)
  return recovered.sort((a, b) => b.sendTime - a.sendTime)
}

/** 获取当前会话本地缓存消息 */
async function getConversationStoredMessages(clientConversationId: string, limit = 50): Promise<MessageDO[]> {
  await initImDb()
  return getImDb().getMessageListByConversation(clientConversationId, { limit })
}

/** 标记会话已读（进入聊天页时调用） */
async function markConversationRead(type: number, targetId: number, messageId: number) {
  const clientConversationId = getClientConversationId(type, targetId)
  await initImDb()
  const db = getImDb()
  await db.put<ConversationReadDO>('conversationReads', {
    clientConversationId,
    conversationType: type,
    targetId,
    messageId,
    updateTime: Date.now(),
  })
  const target = conversations.value.find(item => item.clientConversationId === clientConversationId)
  if (target) {
    target.unreadCount = 0
    target.atMe = false
    target.atAll = false
    target.atMessageId = undefined
    target.atAllMessageId = undefined
    await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(target)))
  }
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

/** 置顶 / 取消置顶 */
async function setConversationTop(clientConversationId: string, top: boolean) {
  await updateConversationLocal(clientConversationId, { top })
}

/** 免打扰 / 取消免打扰 */
async function setConversationSilent(clientConversationId: string, silent: boolean) {
  await updateConversationLocal(clientConversationId, { silent })
}

/** 删除会话（本地软删，再来新消息会重新出现） */
async function removeConversation(clientConversationId: string) {
  await updateConversationLocal(clientConversationId, { deleted: true })
}

/** 清空单个会话的本地聊天记录 */
async function clearConversationMessages(clientConversationId: string) {
  await initImDb()
  const db = getImDb()
  const target = conversations.value.find(item => item.clientConversationId === clientConversationId)
  const localMessages = await db.filter<MessageDO>('messages', item => item.clientConversationId === clientConversationId)
  const clearBeforeMessageId = Math.max(target?.lastMessageId || 0, ...localMessages.map(item => item.id || 0))
  await db.setSetting(`${ImSettingKeys.conversationClearBeforePrefix}${clientConversationId}`, clearBeforeMessageId)
  await Promise.all([
    db.removeWhere<MessageDO>('messages', item => item.clientConversationId === clientConversationId),
    db.removeWhere<ConversationReadDO>('conversationReads', item => item.clientConversationId === clientConversationId),
  ])
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

/** 获取会话本地清理边界 */
async function getConversationClearBefore(clientConversationId: string) {
  await initImDb()
  return (await getImDb().getSetting<number>(`${ImSettingKeys.conversationClearBeforePrefix}${clientConversationId}`)) || 0
}

/** 获取会话已本地删除的消息标识 */
async function getConversationDeletedMessageKeys(clientConversationId: string) {
  await initImDb()
  return (await getImDb().getSetting<string[]>(`${ImSettingKeys.conversationDeletedMessagesPrefix}${clientConversationId}`)) || []
}

/** 持久删除当前设备上的单条或多条消息 */
async function deleteConversationMessages(clientConversationId: string, messages: Array<{ id?: number, clientMessageId?: string }>) {
  await initImDb()
  const db = getImDb()
  const oldKeys = await getConversationDeletedMessageKeys(clientConversationId)
  const deletedKeys = messages.flatMap((message) => {
    const keys: string[] = []
    if (message.id) {
      keys.push(`id:${message.id}`)
    }
    if (message.clientMessageId) {
      keys.push(`client:${message.clientMessageId}`)
    }
    return keys
  })
  const keys = Array.from(new Set([...oldKeys, ...deletedKeys])).slice(-2000)
  await Promise.all([
    db.setSetting(`${ImSettingKeys.conversationDeletedMessagesPrefix}${clientConversationId}`, keys),
    db.removeWhere<MessageDO>('messages', item => item.clientConversationId === clientConversationId
      && ((item.id && keys.includes(`id:${item.id}`)) || keys.includes(`client:${item.clientMessageId}`))),
  ])
}

/** 保存会话草稿 */
async function setConversationDraft(clientConversationId: string, draft?: ConversationDO['draft']) {
  await updateConversationLocal(clientConversationId, { draft })
}

/** 获取会话草稿 */
function getConversationDraft(clientConversationId: string) {
  return conversations.value.find(item => item.clientConversationId === clientConversationId)?.draft
}

/** 清理当前账号的 IM 运行态；本地历史库按用户保留 */
function resetImConversations() {
  loadEpoch++
  closeImDb()
  conversations.value = []
  loading.value = false
  loadedUserId = 0
  stateUserId = 0
  activeClientConversationId.value = ''
  loadingUserId = 0
  pendingIncomingMessages.length = 0
  pendingRecallSignals.length = 0
  pendingIncomingWaiters.forEach(waiters => waiters.forEach(resolve => resolve()))
  pendingIncomingWaiters.clear()
  conversationOperationQueues.clear()
}

uni.$on('auth:logout', resetImConversations)

/** 会话列表 composable（模块级单例状态，列表页与聊天页共享） */
export function useImConversations() {
  return {
    conversations,
    loading,
    isLoaded: () => loadedUserId === selfUserId(),
    load,
    markConversationRead,
    setActiveConversation,
    buildIncomingMessage,
    applyIncomingMessage,
    applyRecallMessage,
    applyConversationReadList,
    pullConversationReads,
    setConversationTop,
    setConversationSilent,
    removeConversation,
    clearConversationMessages,
    getConversationClearBefore,
    getConversationDeletedMessageKeys,
    getConversationPendingMessages,
    getConversationStoredMessages,
    deleteConversationMessages,
    setConversationDraft,
    getConversationDraft,
    resetImConversations,
  }
}
