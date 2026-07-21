import type { ConversationDO, ConversationReadDO, ImDbClient, MessageDO } from '@/pages-im/utils/db'
import type { Message } from '../types'
import type { ImChannelMessageRespVO } from '@/api/im/message/channel'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pullChannelMessages } from '@/api/im/message/channel'
import { pullGroupMessages } from '@/api/im/message/group'
import { pullPrivateMessages } from '@/api/im/message/private'
import {
  getClientConversationId,
  getClientMessageKey,
  getDb,
  getServerMessageKey,
  initDb,
  StorageKeys,
} from '@/pages-im/utils/db'
import {
  MESSAGE_GROUP_PULL_SIZE,
  MESSAGE_PRIVATE_PULL_SIZE,
} from '@/pages-im/utils/config'
import {
  generateClientMessageId,
  getPrivateMessagePeerId,
  parseMessage,
  parseRecallMessageId,
  serializeMessage,
} from '@/pages-im/utils/message'
import { runMinIdPull } from '@/pages-im/utils/pull'
import {
  enqueueConversationWrite,
  enqueueConversationWrites,
  isMessageTerminated,
  mergeMessageState,
} from '@/pages-im/utils/messageSync'
import { toTimestamp } from '@/pages-im/utils/time'
import {
  ImConversationType,
  ImMessageReceiptStatus,
  ImMessageStatus,
  ImMessageType,
  isFriendChatTip,
  isFriendNotification,
} from '@/pages-im/utils/constants'
import { isGroupQuit, tryGetSenderDisplayName } from '@/pages-im/utils/user'
import { useGroupStore } from './groupStore'
import { useConversationStore } from './conversationStore'

/** 本地数据库消息转前端消息 */
export function buildMessageFromDO(message: MessageDO): Message {
  const {
    messageKey: _messageKey,
    conversationType: _conversationType,
    clientConversationId: _clientConversationId,
    ...rest
  } = message
  return rest
}

/** 前端消息转本地数据库消息 */
export function buildMessageDO(message: Message, conversationType: number): MessageDO {
  const {
    uploadProgress: _uploadProgress,
    _localFile,
    _ackMerging,
    ...persistentMessage
  } = message
  return {
    ...persistentMessage,
    messageKey: message.id
      ? getServerMessageKey(conversationType, message.id)
      : getClientMessageKey(message.clientMessageId),
    conversationType,
    clientConversationId: getClientConversationId(conversationType, message.targetId),
  }
}

/** 将重启前未完成的本地消息降级为可识别的失败态 */
function recoverPendingMessage(message: MessageDO): MessageDO {
  if (message.status !== ImMessageStatus.SENDING) {
    return message
  }
  const payload = parseMessage<Record<string, any>>(message.content)
  if (!payload?._uploadPending) {
    return { ...message, status: ImMessageStatus.FAILED }
  }
  const { url: _localUrl, coverUrl: _localCoverUrl, ...persistedPayload } = payload
  return {
    ...message,
    content: serializeMessage({
      ...persistedPayload,
      _uploadPending: false,
      _uploadFailed: true,
    }),
    status: ImMessageStatus.FAILED,
  }
}

/** IM 消息 Store：负责增量拉取、持久化和服务端消息转换 */
export const useMessageStore = defineStore('imMessageStore', () => {
  const privateReadMaxIds = ref<Record<number, number>>({}) // 私聊对方已读位置缓存
  const privateMessageMaxId = ref(0) // 私聊消息拉取游标
  const groupMessageMaxId = ref(0) // 群聊消息拉取游标
  const channelMessageMaxId = ref(0) // 频道消息拉取游标
  /** 清空消息内存状态 */
  function clear() {
    privateReadMaxIds.value = {}
    privateMessageMaxId.value = 0
    groupMessageMaxId.value = 0
    channelMessageMaxId.value = 0
  }

  /** 加载消息游标 */
  async function loadMessageCursorList(db: ImDbClient) {
    const [privateMaxId, groupMaxId, channelMaxId] = await Promise.all([
      db.getSetting<number>(StorageKeys.settings.privateMessageMaxId),
      db.getSetting<number>(StorageKeys.settings.groupMessageMaxId),
      db.getSetting<number>(StorageKeys.settings.channelMessageMaxId),
    ])
    privateMessageMaxId.value = privateMaxId || 0
    groupMessageMaxId.value = groupMaxId || 0
    channelMessageMaxId.value = channelMaxId || 0
  }

  /** 更新消息游标 */
  function updateMessageCursor(conversationType: number, messageId?: number) {
    if (!messageId) {
      return
    }
    if (conversationType === ImConversationType.PRIVATE) {
      privateMessageMaxId.value = Math.max(privateMessageMaxId.value, messageId)
    } else if (conversationType === ImConversationType.GROUP) {
      groupMessageMaxId.value = Math.max(groupMessageMaxId.value, messageId)
    } else if (conversationType === ImConversationType.CHANNEL) {
      channelMessageMaxId.value = Math.max(channelMessageMaxId.value, messageId)
    }
  }

  /** 算出末条消息发送人快照，群成员缺失时按需补拉 */
  function deriveLastSenderDisplayName(
    conversation: Pick<ConversationDO, 'type' | 'targetId' | 'lastSenderId' | 'lastSenderDisplayName'>,
    senderId: number,
  ) {
    const liveSenderName = tryGetSenderDisplayName(senderId, conversation.type, conversation.targetId)
    if (liveSenderName) {
      return liveSenderName
    }
    if (conversation.type === ImConversationType.GROUP) {
      const groupStore = useGroupStore()
      const group = groupStore.getGroup(conversation.targetId)
      if (!group || isGroupQuit(group)) {
        return conversation.lastSenderId === senderId
          ? conversation.lastSenderDisplayName
          : undefined
      }
      const fullFetch = !group?.membersLoaded || !!group.membersExpired
      const task = fullFetch
        ? groupStore.fetchGroupMemberList(conversation.targetId, false)
        : groupStore.fetchGroupMember(conversation.targetId, senderId)
      task.catch((error) => {
        console.warn('[IM messageStore] 兜底拉群成员失败', {
          groupId: conversation.targetId,
          senderId,
          fullFetch,
        }, error)
      })
    }
    return conversation.lastSenderId === senderId
      ? conversation.lastSenderDisplayName
      : undefined
  }

  /** 获取私聊对方已读位置缓存 */
  function getPrivateReadMaxId(peerId: number) {
    return privateReadMaxIds.value[peerId]
  }

  /** 更新私聊对方已读位置缓存 */
  function updatePrivateReadMaxId(peerId: number, maxReadId?: number | null) {
    if (!peerId) {
      return 0
    }
    const nextMaxReadId = maxReadId || 0
    const current = getPrivateReadMaxId(peerId)
    if (current !== undefined && nextMaxReadId <= current) {
      return current
    }
    privateReadMaxIds.value = { ...privateReadMaxIds.value, [peerId]: nextMaxReadId }
    return nextMaxReadId
  }

  /** 清空私聊对方已读位置缓存 */
  function clearPrivateReadMaxIdCache() {
    privateReadMaxIds.value = {}
  }
  /** 私聊消息 VO 转本地消息 */
  function mapPrivateMessage(vo: ImPrivateMessageRespVO, currentUserId: number): MessageDO {
    const self = currentUserId
    const selfSend = vo.senderId === self
    const targetId = getPrivateMessagePeerId(vo, self)
    const clientConversationId = getClientConversationId(ImConversationType.PRIVATE, targetId)
    const clientMessageId = vo.clientMessageId || generateClientMessageId()
    return {
      messageKey: vo.id
        ? getServerMessageKey(ImConversationType.PRIVATE, vo.id)
        : getClientMessageKey(clientMessageId),
      clientConversationId,
      conversationType: ImConversationType.PRIVATE,
      id: vo.id,
      clientMessageId,
      type: vo.type,
      content: vo.content,
      status: vo.status,
      sendTime: toTimestamp(vo.sendTime),
      senderId: vo.senderId,
      targetId,
      selfSend,
      receiptStatus: vo.receiptStatus,
    }
  }

  /** 群聊消息 VO 转本地消息 */
  function mapGroupMessage(vo: ImGroupMessageRespVO, currentUserId: number): MessageDO {
    const clientConversationId = getClientConversationId(ImConversationType.GROUP, vo.groupId)
    const clientMessageId = vo.clientMessageId || generateClientMessageId()
    return {
      messageKey: vo.id
        ? getServerMessageKey(ImConversationType.GROUP, vo.id)
        : getClientMessageKey(clientMessageId),
      clientConversationId,
      conversationType: ImConversationType.GROUP,
      id: vo.id,
      clientMessageId,
      type: vo.type,
      content: vo.content,
      status: vo.status,
      sendTime: toTimestamp(vo.sendTime),
      senderId: vo.senderId,
      targetId: vo.groupId,
      selfSend: vo.senderId === currentUserId,
      atUserIds: vo.atUserIds,
      receiverUserIds: vo.receiverUserIds,
      receiptStatus: vo.receiptStatus,
      readCount: vo.readCount,
    }
  }

  /** 频道消息 VO 转本地消息 */
  function mapChannelMessage(vo: ImChannelMessageRespVO): MessageDO {
    const clientConversationId = getClientConversationId(ImConversationType.CHANNEL, vo.channelId)
    const clientMessageId = vo.clientMessageId || generateClientMessageId()
    return {
      messageKey: vo.id
        ? getServerMessageKey(ImConversationType.CHANNEL, vo.id)
        : getClientMessageKey(clientMessageId),
      clientConversationId,
      conversationType: ImConversationType.CHANNEL,
      id: vo.id,
      clientMessageId,
      type: vo.type,
      content: vo.content,
      status: ImMessageStatus.NORMAL,
      sendTime: toTimestamp(vo.sendTime),
      senderId: 0,
      targetId: vo.channelId,
      selfSend: false,
      materialId: vo.materialId,
      receiptStatus: vo.receiptStatus,
    }
  }

  /** 拉取一类消息并持久化 */
  async function pullMessages<T extends { id: number, type: number, content: string }>(
    db: ImDbClient,
    conversationType: number,
    cursorKey: string,
    fetchPage: (minId: number) => Promise<T[]>,
    mapper: (vo: T, currentUserId: number) => MessageDO,
  ) {
    const currentUserId = db.userId
    const initialMinId = conversationType === ImConversationType.PRIVATE
      ? privateMessageMaxId.value
      : conversationType === ImConversationType.GROUP
        ? groupMessageMaxId.value
        : channelMessageMaxId.value
    await runMinIdPull({
      initialMinId,
      pageSize: conversationType === ImConversationType.PRIVATE
        ? MESSAGE_PRIVATE_PULL_SIZE
        : MESSAGE_GROUP_PULL_SIZE,
      fetchPage: ({ minId }) => fetchPage(minId),
      applyPage: async (list, nextMinId) => {
        const candidates = list
          .filter(item => item.type !== ImMessageType.RECALL)
          .filter((item) => {
            if (conversationType === ImConversationType.PRIVATE && isFriendNotification(item.type)) {
              return isFriendChatTip(item.type)
            }
            if (conversationType === ImConversationType.GROUP) {
              return item.type !== ImMessageType.GROUP_MEMBER_SETTING_UPDATE
                && item.type !== ImMessageType.GROUP_MEMBER_NICKNAME_UPDATE
            }
            return true
          })
          .map(item => mapper(item, currentUserId))
        const recallSignals = list.filter(item => item.type === ImMessageType.RECALL)
        const conversationIds = [
          ...candidates.map(item => item.clientConversationId),
          ...recallSignals.map(item => mapper(item, currentUserId).clientConversationId),
        ]
        return enqueueConversationWrites(conversationIds, async () => {
          const terminalCache = new Map<string, {
            clearBefore: number
            deleted: Set<string>
            recalled: Set<string>
          }>()
          const getTerminal = async (clientConversationId: string) => {
            const cached = terminalCache.get(clientConversationId)
            if (cached) {
              return cached
            }
            const [clearBefore, deleted, recalled] = await Promise.all([
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
            const terminal = {
              clearBefore: clearBefore || 0,
              deleted: new Set(deleted || []),
              recalled: new Set(recalled || []),
            }
            terminalCache.set(clientConversationId, terminal)
            return terminal
          }
          const messages: MessageDO[] = []
          for (const candidate of candidates) {
            const terminal = await getTerminal(candidate.clientConversationId)
            if (isMessageTerminated(candidate, terminal.clearBefore, terminal.deleted)) {
              continue
            }
            const stored = await db.get<MessageDO>('messages', candidate.messageKey)
            if (candidate.status === ImMessageStatus.RECALL
              || (!!candidate.id && terminal.recalled.has(`id:${candidate.id}`))) {
              messages.push(mergeMessageState(stored, {
                ...candidate,
                type: ImMessageType.RECALL,
                content: '',
                status: ImMessageStatus.RECALL,
              }))
            } else {
              messages.push(mergeMessageState(stored, candidate))
            }
          }
          await Promise.all(messages
            .filter(message => !!message.id && !!message.clientMessageId)
            .map(message => db.delete('messages', getClientMessageKey(message.clientMessageId))))
          await db.bulkPut<MessageDO>('messages', messages)
          for (const signal of recallSignals) {
            const messageId = parseRecallMessageId(signal.content)
            if (!messageId) {
              continue
            }
            const mapped = mapper(signal, currentUserId)
            const terminal = await getTerminal(mapped.clientConversationId)
            if (messageId <= terminal.clearBefore || terminal.deleted.has(`id:${messageId}`)) {
              continue
            }
            terminal.recalled.add(`id:${messageId}`)
            await db.setSetting(
              `${StorageKeys.settings.conversationRecalledMessagesPrefix}${mapped.clientConversationId}`,
              Array.from(terminal.recalled),
            )
            const messageKey = getServerMessageKey(mapped.conversationType, messageId)
            const original = await db.get<MessageDO>('messages', messageKey)
            if (original) {
              await db.put<MessageDO>('messages', {
                ...original,
                type: ImMessageType.RECALL,
                content: '',
                status: ImMessageStatus.RECALL,
              })
            }
          }
          if (nextMinId) {
            await db.setSettingMax(cursorKey, nextMinId)
            updateMessageCursor(conversationType, nextMinId)
          }
          return true
        })
      },
    })
  }

  /** 并行拉取私聊、群聊和频道消息 */
  async function pullAllMessages() {
    const db = await initDb()
    await loadMessageCursorList(db)
    await Promise.all([
      pullMessages(
        db,
        ImConversationType.PRIVATE,
        StorageKeys.settings.privateMessageMaxId,
        minId => pullPrivateMessages({ minId, size: MESSAGE_PRIVATE_PULL_SIZE }),
        mapPrivateMessage,
      ),
      pullMessages(
        db,
        ImConversationType.GROUP,
        StorageKeys.settings.groupMessageMaxId,
        minId => pullGroupMessages({ minId, size: MESSAGE_GROUP_PULL_SIZE }),
        mapGroupMessage,
      ),
      pullMessages(
        db,
        ImConversationType.CHANNEL,
        StorageKeys.settings.channelMessageMaxId,
        minId => pullChannelMessages({ minId, size: MESSAGE_GROUP_PULL_SIZE }),
        mapChannelMessage,
      ),
    ])
  }

  /** 把 WebSocket 通知转换为本地消息 */
  function buildIncomingMessage(
    conversationType: number,
    payload: ImPrivateMessageRespVO | ImGroupMessageRespVO | ImChannelMessageRespVO,
    currentUserId: number,
  ): MessageDO | null {
    if (conversationType === ImConversationType.PRIVATE) {
      return mapPrivateMessage(payload as ImPrivateMessageRespVO, currentUserId)
    }
    if (conversationType === ImConversationType.GROUP) {
      return mapGroupMessage(payload as ImGroupMessageRespVO, currentUserId)
    }
    if (conversationType === ImConversationType.CHANNEL) {
      return mapChannelMessage(payload as ImChannelMessageRespVO)
    }
    return null
  }

  /** 插入消息并同步会话摘要；加载期间由会话 Store 负责排队回放 */
  function insertMessage(
    message: MessageDO,
    waitForReplay = false,
    db: ImDbClient = getDb(),
  ) {
    return useConversationStore().applyIncomingMessage(
      message,
      waitForReplay,
      db,
    )
  }

  /** 撤回消息并同步会话摘要；撤回终态不可被普通消息覆盖 */
  function recallMessage(
    conversationType: number,
    targetId: number,
    content: string,
    db: ImDbClient = getDb(),
  ) {
    return useConversationStore().applyRecallMessage(
      conversationType,
      targetId,
      content,
      db,
    )
  }

  /** 获取当前会话未完成的本地消息；重启后的发送中消息统一降级为失败 */
  async function getConversationPendingMessages(
    clientConversationId: string,
    activeClientMessageIds = new Set<string>(),
    db: ImDbClient = getDb(),
  ): Promise<MessageDO[]> {
    return enqueueConversationWrite(clientConversationId, () => getConversationPendingMessagesNow(
      clientConversationId,
      activeClientMessageIds,
      db,
    ))
  }

  /** 实际恢复本地未完成消息；调用方必须持有当前会话写 lane */
  async function getConversationPendingMessagesNow(
    clientConversationId: string,
    activeClientMessageIds: Set<string>,
    db: ImDbClient,
  ): Promise<MessageDO[]> {
    const [allMessages, clearBefore, deletedKeys] = await Promise.all([
      db.filter<MessageDO>(
        'messages',
        item => item.clientConversationId === clientConversationId,
      ),
      db.getSetting<number>(
        `${StorageKeys.settings.conversationClearBeforePrefix}${clientConversationId}`,
      ),
      db.getSetting<string[]>(
        `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`,
      ),
    ])
    const deleted = new Set(deletedKeys || [])
    const visibleMessages = allMessages.filter(message =>
      !isMessageTerminated(message, clearBefore || 0, deleted))
    const terminatedMessages = allMessages.filter(message =>
      isMessageTerminated(message, clearBefore || 0, deleted))
    await Promise.all(terminatedMessages.map(message => db.delete('messages', message.messageKey)))
    const serverClientMessageIds = new Set(
      visibleMessages.filter(item => !!item.id).map(item => item.clientMessageId),
    )
    const staleLocalMessages = visibleMessages.filter(item =>
      !item.id && serverClientMessageIds.has(item.clientMessageId))
    await Promise.all(staleLocalMessages.map(item => db.delete('messages', item.messageKey)))
    const messages = visibleMessages.filter(item => !item.id
      && !serverClientMessageIds.has(item.clientMessageId)
      && (item.status === ImMessageStatus.SENDING || item.status === ImMessageStatus.FAILED))
    const recovered = messages.map(message => activeClientMessageIds.has(message.clientMessageId)
      ? message
      : recoverPendingMessage(message))
    const recoveredChanges = recovered.filter((message, index) => message !== messages[index])
    if (recoveredChanges.length > 0) {
      await db.bulkPut<MessageDO>('messages', recoveredChanges)
    }
    return recovered.sort((left, right) => right.sendTime - left.sendTime)
  }

  /** 获取当前会话本地缓存消息 */
  async function getConversationStoredMessages(
    clientConversationId: string,
    limit = 50,
  ) {
    const db = await initDb()
    return (await db.getMessageListByConversation(clientConversationId, { limit })).list
  }

  /** 获取会话本地清理边界 */
  async function getConversationClearBefore(
    clientConversationId: string,
  ) {
    const db = await initDb()
    return (await db.getSetting<number>(
      `${StorageKeys.settings.conversationClearBeforePrefix}${clientConversationId}`,
    )) || 0
  }

  /** 获取会话已本地删除的消息标识 */
  async function getConversationDeletedMessageKeys(
    clientConversationId: string,
  ) {
    const db = await initDb()
    return (await db.getSetting<string[]>(
      `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`,
    )) || []
  }

  /** 实际清空会话消息；调用方必须持有当前会话写 lane */
  async function deleteConversationMessageListNow(
    clientConversationId: string,
    pendingClientMessageIds: string[],
    db: ImDbClient,
  ) {
    const conversation = useConversationStore().conversations.find(item =>
      item.clientConversationId === clientConversationId)
    const messages = await db.filter<MessageDO>(
      'messages',
      item => item.clientConversationId === clientConversationId,
    )
    const clearBeforeMessageId = Math.max(
      conversation?.lastMessageId || 0,
      ...messages.map(item => item.id || 0),
    )
    const deletedSettingKey
      = `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`
    const oldDeletedKeys = (await db.getSetting<string[]>(deletedSettingKey)) || []
    const pendingClientKeys = messages
      .filter(message => !message.id)
      .map(message => `client:${message.clientMessageId}`)
    pendingClientKeys.push(...pendingClientMessageIds.map(clientMessageId =>
      `client:${clientMessageId}`))
    await db.setSetting(
      deletedSettingKey,
      Array.from(new Set([...oldDeletedKeys, ...pendingClientKeys])),
    )
    await db.setSettingMax(
      `${StorageKeys.settings.conversationClearBeforePrefix}${clientConversationId}`,
      clearBeforeMessageId,
    )
    await Promise.all([
      db.removeWhere<MessageDO>('messages', item =>
        item.clientConversationId === clientConversationId),
      db.removeWhere<ConversationReadDO>('conversationReads', item =>
        item.clientConversationId === clientConversationId),
    ])
  }

  /** 持久删除当前设备上的单条或多条消息 */
  async function removeMessageList(
    clientConversationId: string,
    messages: Array<{ id?: number, clientMessageId?: string }>,
    db: ImDbClient = getDb(),
  ) {
    await enqueueConversationWrite(
      clientConversationId,
      () => removeMessageListNow(clientConversationId, messages, db),
    )
  }

  /** 实际持久删除消息；调用方必须持有当前会话写 lane */
  async function removeMessageListNow(
    clientConversationId: string,
    messages: Array<{ id?: number, clientMessageId?: string }>,
    db: ImDbClient,
  ) {
    const oldKeys = (await db.getSetting<string[]>(
      `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`,
    )) || []
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
    const keys = Array.from(new Set([...oldKeys, ...deletedKeys]))
    const keySet = new Set(keys)
    await db.setSetting(
      `${StorageKeys.settings.conversationDeletedMessagesPrefix}${clientConversationId}`,
      keys,
    )
    await db.removeWhere<MessageDO>('messages', item => item.clientConversationId === clientConversationId
      && ((item.id && keySet.has(`id:${item.id}`))
        || keySet.has(`client:${item.clientMessageId}`)))
    await useConversationStore().recomputeConversationFromStoredMessages(
      clientConversationId,
      db,
    )
  }

  /** 应用私聊或群聊消息回执并持久化 */
  async function applyMessageReadReceipt(options: {
    conversationType: number
    targetId: number
    privateReadMaxId?: number
    groupMessageId?: number
    readCount?: number
    receiptStatus?: number
  }, db: ImDbClient = getDb()) {
    const clientConversationId = getClientConversationId(
      options.conversationType,
      options.targetId,
    )
    await enqueueConversationWrite(
      clientConversationId,
      () => applyMessageReadReceiptNow(options, db),
    )
  }

  /** 实际应用消息回执；调用方必须持有当前会话写 lane */
  async function applyMessageReadReceiptNow(options: {
    conversationType: number
    targetId: number
    privateReadMaxId?: number
    groupMessageId?: number
    readCount?: number
    receiptStatus?: number
  }, db: ImDbClient) {
    const clientConversationId = getClientConversationId(
      options.conversationType,
      options.targetId,
    )
    const messages = await db.filter<MessageDO>(
      'messages',
      message => message.clientConversationId === clientConversationId,
    )
    let changed: MessageDO[] = []
    if (options.conversationType === ImConversationType.PRIVATE && options.privateReadMaxId) {
      updatePrivateReadMaxId(options.targetId, options.privateReadMaxId)
      changed = messages
        .filter(message => message.selfSend
          && !!message.id
          && message.id <= options.privateReadMaxId!
          && message.receiptStatus === ImMessageReceiptStatus.PENDING)
        .map(message => ({ ...message, receiptStatus: ImMessageReceiptStatus.DONE }))
    } else if (options.conversationType === ImConversationType.GROUP && options.groupMessageId) {
      changed = messages
        .filter(message => message.id === options.groupMessageId)
        .map(message => ({
          ...message,
          ...(options.readCount !== undefined
            ? { readCount: Math.max(message.readCount || 0, options.readCount) }
            : {}),
          ...(options.receiptStatus !== undefined
            ? {
                receiptStatus: Math.max(
                  message.receiptStatus || ImMessageReceiptStatus.NO_RECEIPT,
                  options.receiptStatus,
                ),
              }
            : {}),
        }))
    }
    if (changed.length > 0) {
      await db.bulkPut<MessageDO>('messages', changed)
    }
  }

  return {
    clear,
    pullAllMessages,
    buildIncomingMessage,
    insertMessage,
    recallMessage,
    getConversationPendingMessages,
    getConversationStoredMessages,
    getConversationClearBefore,
    getConversationDeletedMessageKeys,
    deleteConversationMessageListNow,
    removeMessageList,
    deriveLastSenderDisplayName,
    getPrivateReadMaxId,
    updatePrivateReadMaxId,
    clearPrivateReadMaxIdCache,
    applyMessageReadReceipt,
  }
})
