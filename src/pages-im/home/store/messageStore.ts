import type { ConversationDO, ConversationReadDO, MessageDO } from '@/pages-im/utils/db'
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
  getDbSession,
  getImDb,
  getServerMessageKey,
  ImSettingKeys,
  initImDb,
  isCurrentDbSession,
  setMessageMaxId,
} from '@/pages-im/utils/db'
import {
  MESSAGE_GROUP_PULL_SIZE,
  MESSAGE_PRIVATE_PULL_SIZE,
} from '@/pages-im/utils/config'
import {
  generateClientMessageId,
  getPrivateMessagePeerId,
  parseRecallMessageId,
} from '@/pages-im/utils/message'
import { runMinIdPull } from '@/pages-im/utils/pull'
import { toTimestamp } from '@/pages-im/utils/time'
import {
  ImConversationType,
  ImMessageReceiptStatus,
  ImMessageStatus,
  ImMessageType,
  isFriendChatTip,
  isFriendNotification,
} from '@/pages-im/utils/constants'
import { useUserStore } from '@/store/user'
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
  return {
    ...message,
    messageKey: message.id
      ? getServerMessageKey(conversationType, message.id)
      : getClientMessageKey(message.clientMessageId),
    conversationType,
    clientConversationId: getClientConversationId(conversationType, message.targetId),
  }
}

/** IM 消息 Store：负责增量拉取、持久化和服务端消息转换 */
export const useMessageStore = defineStore('imMessageStore', () => {
  const privateReadMaxIds = ref<Record<number, number>>({}) // 私聊对方已读位置缓存
  const privateMessageMaxId = ref(0) // 私聊消息拉取游标
  const groupMessageMaxId = ref(0) // 群聊消息拉取游标
  const channelMessageMaxId = ref(0) // 频道消息拉取游标
  const getCurrentUserId = () => useUserStore().userInfo.userId

  /** 清空消息内存状态 */
  function clear() {
    privateReadMaxIds.value = {}
    privateMessageMaxId.value = 0
    groupMessageMaxId.value = 0
    channelMessageMaxId.value = 0
  }

  /** 加载消息游标 */
  async function loadMessageCursorList(isActive: () => boolean = () => true) {
    const expectedUserId = getCurrentUserId()
    if (expectedUserId <= 0 || !isActive()) {
      return false
    }
    await initImDb()
    if (getCurrentUserId() !== expectedUserId || !isActive()) {
      return false
    }
    const session = getDbSession()
    const db = getImDb()
    const [privateMaxId, groupMaxId, channelMaxId] = await Promise.all([
      db.getSetting<number>(ImSettingKeys.privateMessageMaxId),
      db.getSetting<number>(ImSettingKeys.groupMessageMaxId),
      db.getSetting<number>(ImSettingKeys.channelMessageMaxId),
    ])
    if (getCurrentUserId() !== expectedUserId
      || !isCurrentDbSession(session)
      || !isActive()) {
      return false
    }
    privateMessageMaxId.value = privateMaxId || 0
    groupMessageMaxId.value = groupMaxId || 0
    channelMessageMaxId.value = channelMaxId || 0
    return true
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

  /** 保存消息游标 */
  async function saveMessageCursor(conversationType: number, messageId?: number) {
    if (!messageId) {
      return
    }
    const expectedUserId = getCurrentUserId()
    if (expectedUserId <= 0) {
      return
    }
    await initImDb()
    if (getCurrentUserId() !== expectedUserId) {
      return
    }
    const session = getDbSession()
    await setMessageMaxId(conversationType, messageId)
    if (getCurrentUserId() !== expectedUserId || !isCurrentDbSession(session)) {
      return
    }
    updateMessageCursor(conversationType, messageId)
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
        ? groupStore.fetchGroupMemberList(conversation.targetId)
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
  function mapPrivateMessage(vo: ImPrivateMessageRespVO, currentUserId = getCurrentUserId()): MessageDO {
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
  function mapGroupMessage(vo: ImGroupMessageRespVO, currentUserId = getCurrentUserId()): MessageDO {
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

  /** 持久化单条消息 */
  async function saveMessageRecord(
    message: Message | MessageDO,
    conversationType: number,
    options?: { mergeClientRecord?: boolean },
  ) {
    await initImDb()
    const db = getImDb()
    const record = 'messageKey' in message ? message : buildMessageDO(message, conversationType)
    if (options?.mergeClientRecord && record.id && record.clientMessageId) {
      await db.delete('messages', getClientMessageKey(record.clientMessageId))
    }
    await db.put<MessageDO>('messages', record)
  }

  /** 拉取一类消息并持久化 */
  async function pullMessages<T extends { id: number, type: number, content: string }>(
    conversationType: number,
    cursorKey: string,
    fetchPage: (minId: number) => Promise<T[]>,
    mapper: (vo: T) => MessageDO,
    isActive: () => boolean,
  ) {
    const expectedUserId = getCurrentUserId()
    const session = getDbSession()
    const db = getImDb()
    const isCurrentPull = () => expectedUserId > 0
      && getCurrentUserId() === expectedUserId
      && isCurrentDbSession(session)
      && isActive()
    if (!isCurrentPull()) {
      return
    }
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
          .map(mapper)
        const messages: MessageDO[] = []
        for (const candidate of candidates) {
          const stored = await db.get<MessageDO>('messages', candidate.messageKey)
          if (stored?.type === ImMessageType.RECALL || stored?.status === ImMessageStatus.RECALL) {
            messages.push(stored)
          } else if (candidate.status === ImMessageStatus.RECALL) {
            messages.push({
              ...candidate,
              type: ImMessageType.RECALL,
              content: '',
              status: ImMessageStatus.RECALL,
            })
          } else {
            messages.push(candidate)
          }
        }
        await Promise.all(messages
          .filter(message => !!message.id && !!message.clientMessageId)
          .map(message => db.delete('messages', getClientMessageKey(message.clientMessageId))))
        await db.bulkPut<MessageDO>('messages', messages)
        for (const signal of list.filter(item => item.type === ImMessageType.RECALL)) {
          const messageId = parseRecallMessageId(signal.content)
          if (!messageId) {
            continue
          }
          const messageKey = getServerMessageKey(mapper(signal).conversationType, messageId)
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
        if (!isCurrentPull()) {
          return false
        }
        if (nextMinId) {
          await db.setSettingMax(cursorKey, nextMinId)
          if (!isCurrentPull()) {
            return false
          }
          updateMessageCursor(conversationType, nextMinId)
        }
        return true
      },
      isActive: isCurrentPull,
    })
  }

  /** 并行拉取私聊、群聊和频道消息 */
  async function pullAllMessages(isActive: () => boolean) {
    const cursorLoaded = await loadMessageCursorList(isActive)
    if (!cursorLoaded || !isActive()) {
      return
    }
    await Promise.all([
      pullMessages(
        ImConversationType.PRIVATE,
        ImSettingKeys.privateMessageMaxId,
        minId => pullPrivateMessages({ minId, size: MESSAGE_PRIVATE_PULL_SIZE }),
        mapPrivateMessage,
        isActive,
      ),
      pullMessages(
        ImConversationType.GROUP,
        ImSettingKeys.groupMessageMaxId,
        minId => pullGroupMessages({ minId, size: MESSAGE_GROUP_PULL_SIZE }),
        mapGroupMessage,
        isActive,
      ),
      pullMessages(
        ImConversationType.CHANNEL,
        ImSettingKeys.channelMessageMaxId,
        minId => pullChannelMessages({ minId, size: MESSAGE_GROUP_PULL_SIZE }),
        mapChannelMessage,
        isActive,
      ),
    ])
  }

  /** 把 WebSocket 通知转换为本地消息 */
  function buildIncomingMessage(
    conversationType: number,
    payload: ImPrivateMessageRespVO | ImGroupMessageRespVO | ImChannelMessageRespVO,
    currentUserId = getCurrentUserId(),
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
    expectedUserId = getCurrentUserId(),
    waitForReplay = false,
  ) {
    return useConversationStore().applyIncomingMessage(
      message,
      expectedUserId,
      waitForReplay,
    )
  }

  /** 撤回消息并同步会话摘要；撤回终态不可被普通消息覆盖 */
  function recallMessage(
    conversationType: number,
    targetId: number,
    content: string,
    expectedUserId = getCurrentUserId(),
  ) {
    return useConversationStore().applyRecallMessage(
      conversationType,
      targetId,
      content,
      expectedUserId,
    )
  }

  /** 获取当前会话未完成的本地消息；重启后的发送中消息统一降级为失败 */
  async function getConversationPendingMessages(clientConversationId: string): Promise<MessageDO[]> {
    await initImDb()
    const db = getImDb()
    const allMessages = await db.filter<MessageDO>(
      'messages',
      item => item.clientConversationId === clientConversationId,
    )
    const serverClientMessageIds = new Set(
      allMessages.filter(item => !!item.id).map(item => item.clientMessageId),
    )
    const staleLocalMessages = allMessages.filter(item =>
      !item.id && serverClientMessageIds.has(item.clientMessageId))
    await Promise.all(staleLocalMessages.map(item => db.delete('messages', item.messageKey)))
    const messages = allMessages.filter(item => !item.id
      && !serverClientMessageIds.has(item.clientMessageId)
      && (item.status === ImMessageStatus.SENDING || item.status === ImMessageStatus.FAILED))
    const recovered = messages.map(message => message.status === ImMessageStatus.SENDING
      ? { ...message, status: ImMessageStatus.FAILED }
      : message)
    await db.bulkPut<MessageDO>('messages', recovered)
    return recovered.sort((left, right) => right.sendTime - left.sendTime)
  }

  /** 获取当前会话本地缓存消息 */
  async function getConversationStoredMessages(clientConversationId: string, limit = 50) {
    await initImDb()
    return getImDb().getMessageListByConversation(clientConversationId, { limit })
  }

  /** 获取会话本地清理边界 */
  async function getConversationClearBefore(clientConversationId: string) {
    await initImDb()
    return (await getImDb().getSetting<number>(
      `${ImSettingKeys.conversationClearBeforePrefix}${clientConversationId}`,
    )) || 0
  }

  /** 获取会话已本地删除的消息标识 */
  async function getConversationDeletedMessageKeys(clientConversationId: string) {
    await initImDb()
    return (await getImDb().getSetting<string[]>(
      `${ImSettingKeys.conversationDeletedMessagesPrefix}${clientConversationId}`,
    )) || []
  }

  /** 删除会话全部本地消息，并记录服务端历史清理边界 */
  async function deleteConversationMessageList(
    clientConversationId: string,
    expectedUserId = getCurrentUserId(),
  ) {
    if (expectedUserId <= 0 || getCurrentUserId() !== expectedUserId) {
      return
    }
    await initImDb()
    if (getCurrentUserId() !== expectedUserId) {
      return
    }
    const db = getImDb()
    const conversation = useConversationStore().conversations.find(item =>
      item.clientConversationId === clientConversationId)
    const messages = await db.filter<MessageDO>(
      'messages',
      item => item.clientConversationId === clientConversationId,
    )
    if (getCurrentUserId() !== expectedUserId) {
      return
    }
    const clearBeforeMessageId = Math.max(
      conversation?.lastMessageId || 0,
      ...messages.map(item => item.id || 0),
    )
    await Promise.all([
      db.setSetting(
        `${ImSettingKeys.conversationClearBeforePrefix}${clientConversationId}`,
        clearBeforeMessageId,
      ),
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
    expectedUserId = getCurrentUserId(),
  ) {
    if (expectedUserId <= 0 || getCurrentUserId() !== expectedUserId) {
      return
    }
    await initImDb()
    if (getCurrentUserId() !== expectedUserId) {
      return
    }
    const db = getImDb()
    const oldKeys = (await db.getSetting<string[]>(
      `${ImSettingKeys.conversationDeletedMessagesPrefix}${clientConversationId}`,
    )) || []
    if (getCurrentUserId() !== expectedUserId) {
      return
    }
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
    const keySet = new Set(keys)
    await Promise.all([
      db.setSetting(`${ImSettingKeys.conversationDeletedMessagesPrefix}${clientConversationId}`, keys),
      db.removeWhere<MessageDO>('messages', item => item.clientConversationId === clientConversationId
        && ((item.id && keySet.has(`id:${item.id}`))
          || keySet.has(`client:${item.clientMessageId}`))),
    ])
    if (getCurrentUserId() === expectedUserId) {
      await useConversationStore().recomputeConversationFromStoredMessages(
        clientConversationId,
        expectedUserId,
      )
    }
  }

  /** 应用私聊或群聊消息回执并持久化 */
  async function applyMessageReadReceipt(options: {
    conversationType: number
    targetId: number
    privateReadMaxId?: number
    groupMessageId?: number
    readCount?: number
    receiptStatus?: number
  }, expectedUserId = getCurrentUserId()) {
    if (expectedUserId <= 0 || getCurrentUserId() !== expectedUserId) {
      return
    }
    await initImDb()
    if (getCurrentUserId() !== expectedUserId) {
      return
    }
    const db = getImDb()
    const clientConversationId = getClientConversationId(
      options.conversationType,
      options.targetId,
    )
    const messages = await db.filter<MessageDO>(
      'messages',
      message => message.clientConversationId === clientConversationId,
    )
    if (getCurrentUserId() !== expectedUserId) {
      return
    }
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
          ...(options.readCount !== undefined ? { readCount: options.readCount } : {}),
          ...(options.receiptStatus !== undefined
            ? { receiptStatus: options.receiptStatus }
            : {}),
        }))
    }
    if (changed.length > 0 && getCurrentUserId() === expectedUserId) {
      await db.bulkPut<MessageDO>('messages', changed)
    }
  }

  uni.$on('auth:logout', clear)

  return {
    privateReadMaxIds,
    privateMessageMaxId,
    groupMessageMaxId,
    channelMessageMaxId,
    clear,
    // TODO @AI：有一些方法没在用，是因为没迁移么？
    //     loadMessageCursorList,
    //     updateMessageCursor,
    //     saveMessageCursor,
    //     saveMessageRecord,
    loadMessageCursorList,
    updateMessageCursor,
    saveMessageCursor,
    saveMessageRecord,
    pullAllMessages,
    buildIncomingMessage,
    insertMessage,
    recallMessage,
    getConversationPendingMessages,
    getConversationStoredMessages,
    getConversationClearBefore,
    getConversationDeletedMessageKeys,
    deleteConversationMessageList,
    removeMessageList,
    deriveLastSenderDisplayName,
    getPrivateReadMaxId,
    updatePrivateReadMaxId,
    clearPrivateReadMaxIdCache,
    applyMessageReadReceipt,
  }
})
