import type { FriendNotificationPayload } from './friendStore'
import type { ImNotificationWebSocketDTO, WebSocketFrame } from '../types'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImChannelMessageRespVO } from '@/api/im/message/channel'
import type { ImRtcCallNotification } from './rtcStore'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isDoubleTokenRes } from '@/api/types/login'
import { getEnvBaseUrlRoot } from '@/utils'
import {
  ImConversationType,
  ImMessageStatus,
  ImMessageType,
  ImWebSocketMessageType,
  isFriendChatTip,
  isFriendNotification,
  isGroupNotification,
  isGroupRequestNotification,
  isNormalMessage,
  isRtcCallTip,
} from '@/pages-im/utils/constants'
import { parseRtcCallPayload } from '@/pages-im/utils/message'
import { useConversationStore } from './conversationStore'
import { useFriendStore } from './friendStore'
import { useGroupRequestStore } from './groupRequestStore'
import { useGroupStore } from './groupStore'
import { useMessageStore } from './messageStore'
import { useRtcStore } from './rtcStore'
import { useImRtc } from '../composables/useImRtc'
import {
  MESSAGE_GROUP_READ_ENABLED,
  MESSAGE_PRIVATE_READ_ENABLED,
  WS_RECONNECT_BASE_MS,
  WS_RECONNECT_JITTER_MS,
  WS_RECONNECT_MAX_MS,
} from '@/pages-im/utils/config'

/** IM WebSocket Store */
export const useImWebSocketStore = defineStore('imWebSocketStore', () => {
  let socketTask: UniApp.SocketTask | null = null
  const isConnected = ref(false) // WebSocket 是否已连接
  const isConnecting = ref(false) // WebSocket 是否正在连接
  let manualClosed = false
  let reconnectAttempts = 0
  let resyncOnReopen = false // 断线重连成功后需补拉一次，补齐断线期间漏收的消息
  let connectionUrl = '' // 当前连接地址；用于复用同一令牌的连接
  let connectionOwner = {} // 当前连接 owner；忽略已被替换连接的迟到回调
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let frameProcessingTail: Promise<void> = Promise.resolve() // 按连接顺序串行处理 WebSocket 帧

  /** 拼接 ws 地址 */
  function buildWsUrl(): string | undefined {
    const wsBase = getEnvBaseUrlRoot().replace(/^http/, 'ws')
    const tokenStore = useTokenStore()
    const token = isDoubleTokenRes(tokenStore.tokenInfo)
      ? tokenStore.tokenInfo.refreshToken
      : tokenStore.updateNowTime().validToken
    if (!token) {
      return undefined
    }
    return `${wsBase}/infra/ws?token=${encodeURIComponent(token)}`
  }

  /** 启动心跳 */
  function startHeartbeat() {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      if (socketTask && isConnected.value) {
        sendHeartBeat()
      }
    }, 30000)
  }

  /** 停止心跳 */
  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  /** 断线重连（指数退避，封顶 30s） */
  function reconnect() {
    if (manualClosed || reconnectTimer) {
      return
    }
    const backoff = Math.min(WS_RECONNECT_BASE_MS * 2 ** reconnectAttempts, WS_RECONNECT_MAX_MS)
    const delay = backoff + Math.floor(Math.random() * WS_RECONNECT_JITTER_MS)
    reconnectAttempts++
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay)
  }

  /** 处理收到的原始帧 */
  async function handleFrame(data: string, isActive: () => boolean) {
    if (!isActive() || !data || data === 'pong') {
      return
    }
    const frame = safeParse<WebSocketFrame>(data)
    if (frame?.type !== ImWebSocketMessageType.NOTIFICATION || !frame.content) {
      return
    }
    const notification = safeParse<ImNotificationWebSocketDTO>(frame.content)
    if (!notification?.payload
      || notification.contentType == null
      || notification.conversationType == null) {
      return
    }
    await dispatchFrame(notification, isActive)
  }

  /** 按会话类型分发通知 */
  async function dispatchFrame(
    notification: ImNotificationWebSocketDTO,
    isActive: () => boolean,
  ) {
    if (notification.conversationType === ImConversationType.NONE) {
      await dispatchNoConversationFrame(notification)
      return
    }
    if (notification.conversationType === ImConversationType.PRIVATE) {
      await dispatchPrivateFrame(notification, isActive)
    } else if (notification.conversationType === ImConversationType.GROUP) {
      await dispatchGroupFrame(notification, isActive)
    } else if (notification.conversationType === ImConversationType.CHANNEL) {
      await dispatchChannelFrame(notification, isActive)
    }
  }

  /** 分发无会话 RTC 通知 */
  async function dispatchNoConversationFrame(
    notification: ImNotificationWebSocketDTO,
  ) {
    const { conversationType, contentType, payload } = notification
    if (isFriendNotification(contentType)) {
      await handleFriendNotification(
        contentType,
        payload as FriendNotificationPayload,
        Number(payload.friendUserId),
      )
      return
    }
    if (isGroupRequestNotification(contentType)) {
      handleGroupRequestNotification(contentType, payload)
      return
    }
    if (contentType === ImMessageType.RTC_CALL) {
      await useImRtc().receiveSignal({
        ...payload,
        conversationType: payload.conversationType ?? conversationType,
        inviterUserId: payload.inviterUserId ?? payload.inviterId,
      } as ImRtcCallNotification, contentType)
      return
    }
    if (contentType === ImMessageType.RTC_PARTICIPANT_CONNECTED
      || contentType === ImMessageType.RTC_PARTICIPANT_DISCONNECTED) {
      await useImRtc().receiveSignal({
        room: payload.room,
        conversationType: payload.conversationType ?? conversationType,
        groupId: payload.groupId,
        userId: Number(payload.userId || payload.participantUserId || payload.operatorUserId),
        mediaType: payload.mediaType,
        inviterUserId: payload.inviterUserId ?? payload.inviterId,
      }, contentType)
      return
    }
  }

  /** 分发私聊通知 */
  async function dispatchPrivateFrame(
    notification: ImNotificationWebSocketDTO,
    isActive: () => boolean,
  ) {
    const currentUserId = useUserStore().userInfo.userId
    const { conversationType, contentType, payload } = notification
    if (Number(payload.senderId) !== currentUserId
      && Number(payload.receiverId) !== currentUserId) {
      return
    }
    if (contentType === ImMessageType.READ) {
      await handlePrivateRead(payload, isActive)
    } else if (contentType === ImMessageType.RECEIPT) {
      await handlePrivateReceipt(payload)
    } else if (contentType === ImMessageType.RECALL) {
      await handleRecall(conversationType, contentType, payload, isActive)
      return
    } else if (contentType === ImMessageType.RTC_CALL_END) {
      handleRtcCallEnd(payload)
    }
    await handleMessage(notification, isActive)
  }

  /** 分发群聊通知 */
  async function dispatchGroupFrame(
    notification: ImNotificationWebSocketDTO,
    isActive: () => boolean,
  ) {
    const currentUserId = useUserStore().userInfo.userId
    const { conversationType, contentType, payload } = notification
    if (Number(payload.senderId) !== currentUserId
      && Array.isArray(payload.receiverUserIds)
      && payload.receiverUserIds.length > 0
      && !payload.receiverUserIds.map(Number).includes(currentUserId)) {
      return
    }
    if (contentType === ImMessageType.READ) {
      await handleGroupRead(payload, isActive)
    } else if (contentType === ImMessageType.RECEIPT) {
      await handleGroupReceipt(payload)
    } else if (contentType === ImMessageType.RECALL) {
      await handleRecall(conversationType, contentType, payload, isActive)
      return
    } else if (contentType === ImMessageType.RTC_CALL_START) {
      handleRtcCallStart(payload)
    } else if (contentType === ImMessageType.RTC_CALL_END) {
      handleRtcCallEnd(payload)
    }
    await handleMessage(notification, isActive)
  }

  /** 分发频道通知 */
  async function dispatchChannelFrame(
    notification: ImNotificationWebSocketDTO,
    isActive: () => boolean,
  ) {
    if (notification.contentType === ImMessageType.READ) {
      await handleChannelRead(notification.payload, isActive)
    }
    await handleMessage(notification, isActive)
  }

  /** 应用私聊已读位置 */
  async function handlePrivateRead(payload: any, isActive: () => boolean) {
    if (!MESSAGE_PRIVATE_READ_ENABLED) {
      return
    }
    await applyConversationRead(ImConversationType.PRIVATE, Number(payload.receiverId), payload, isActive)
  }

  /** 应用群聊已读位置 */
  async function handleGroupRead(payload: any, isActive: () => boolean) {
    if (!MESSAGE_GROUP_READ_ENABLED) {
      return
    }
    await applyConversationRead(ImConversationType.GROUP, Number(payload.groupId), payload, isActive)
  }

  /** 应用频道已读位置 */
  async function handleChannelRead(payload: any, isActive: () => boolean) {
    await applyConversationRead(ImConversationType.CHANNEL, Number(payload.channelId), payload, isActive)
  }

  /** 应用会话已读位置 */
  async function applyConversationRead(
    conversationType: number,
    targetId: number,
    payload: any,
    isActive: () => boolean,
  ) {
    const messageId = Number(payload.readId || payload.messageId || payload.id)
    if (!messageId || !targetId) {
      return
    }
    await useConversationStore().applyConversationReadList([{
      id: Number(payload.id || messageId),
      conversationType,
      targetId,
      messageId,
      updateTime: payload.updateTime,
    }])
  }

  /** 应用私聊回执 */
  async function handlePrivateReceipt(payload: any) {
    if (!MESSAGE_PRIVATE_READ_ENABLED) {
      return
    }
    await useMessageStore().applyMessageReadReceipt({
      conversationType: ImConversationType.PRIVATE,
      targetId: Number(payload.senderId),
      privateReadMaxId: Number(payload.messageId || payload.id),
    })
  }

  /** 应用群聊回执 */
  async function handleGroupReceipt(payload: any) {
    if (!MESSAGE_GROUP_READ_ENABLED) {
      return
    }
    await useMessageStore().applyMessageReadReceipt({
      conversationType: ImConversationType.GROUP,
      targetId: Number(payload.groupId),
      groupMessageId: Number(payload.messageId || payload.id),
      readCount: payload.readCount,
      receiptStatus: payload.receiptStatus,
    })
  }

  /** 应用撤回通知 */
  async function handleRecall(
    conversationType: number,
    contentType: number,
    payload: any,
    isActive: () => boolean,
  ) {
    const messageStore = useMessageStore()
    const signal = messageStore.buildIncomingMessage(
      conversationType,
      { ...payload, type: contentType },
      useUserStore().userInfo.userId,
    )
    if (signal) {
      await messageStore.recallMessage(
        conversationType,
        signal.targetId,
        signal.content,
      )
    }
    if (isActive()) {
      uni.$emit('im:event', { conversationType, contentType, payload })
    }
  }

  /** 应用关系事件并写入可展示消息 */
  async function handleMessage(
    notification: ImNotificationWebSocketDTO,
    isActive: () => boolean,
  ) {
    const currentUserId = useUserStore().userInfo.userId
    const { conversationType, contentType, payload } = notification
    if (!isActive()) {
      return
    }
    const removedSelf = await dispatchRelationEvent(contentType, payload, isActive)
    if (!isActive()) {
      return
    }
    uni.$emit('im:event', { conversationType, contentType, payload })
    const isChatMessage = isNormalMessage(contentType)
      || isRtcCallTip(contentType)
      || (conversationType === ImConversationType.GROUP
        && isGroupNotification(contentType)
        && contentType !== ImMessageType.GROUP_MEMBER_SETTING_UPDATE
        && contentType !== ImMessageType.GROUP_MEMBER_NICKNAME_UPDATE)
      || (conversationType === ImConversationType.PRIVATE && isFriendChatTip(contentType))
    if (!isChatMessage || removedSelf || contentType === ImMessageType.READ
      || contentType === ImMessageType.RECEIPT) {
      return
    }
    if (conversationType === ImConversationType.PRIVATE) {
      const peerUserId = computeFriendPeerId(payload, currentUserId)
      if (peerUserId && !useFriendStore().getFriend(peerUserId)) {
        void useFriendStore().fetchFriendInfo(peerUserId).catch(() => undefined)
      }
    } else if (conversationType === ImConversationType.GROUP) {
      const groupId = Number(payload.groupId)
      if (groupId && !useGroupStore().getGroup(groupId)) {
        void useGroupStore().fetchGroupInfo(groupId, true).catch(() => undefined)
      }
    }
    const messageStore = useMessageStore()
    const messagePayload = { ...payload, type: contentType } as
      | ImPrivateMessageRespVO
      | ImGroupMessageRespVO
      | ImChannelMessageRespVO
    const message = messageStore.buildIncomingMessage(
      conversationType,
      messagePayload,
      currentUserId,
    )
    if (!message) {
      return
    }
    const appliedMessage = await messageStore.insertMessage(message, true)
    if (!isActive() || !appliedMessage
      || appliedMessage.type === ImMessageType.RECALL
      || appliedMessage.status === ImMessageStatus.RECALL) {
      return
    }
    uni.$emit('im:message', {
      message: appliedMessage,
      payload: { ...payload, type: contentType },
      conversationType,
    })
  }

  /** 计算私聊对端用户编号 */
  function computeFriendPeerId(payload: any, currentUserId: number) {
    return Number(payload.senderId) === currentUserId
      ? Number(payload.receiverId)
      : Number(payload.senderId)
  }

  /** 应用群通话开始消息 */
  function handleRtcCallStart(payload: any) {
    const callPayload = typeof payload.content === 'string'
      ? parseRtcCallPayload(payload.content)
      : payload
    const groupId = Number(payload.groupId || callPayload?.groupId)
    if (!groupId || !callPayload?.room || !callPayload.mediaType || !callPayload.inviterUserId) {
      return
    }
    useRtcStore().setGroupCall({
      room: callPayload.room,
      groupId,
      mediaType: Number(callPayload.mediaType || 0),
      inviterId: Number(callPayload.inviterUserId || payload.senderId || 0),
      joinedUserIds: callPayload.inviterUserId ? [Number(callPayload.inviterUserId)] : [],
      inviteeIds: [],
    })
  }

  /** 应用通话结束消息 */
  function handleRtcCallEnd(payload: any) {
    const callPayload = typeof payload.content === 'string' ? safeParse(payload.content) : payload
    useImRtc().end(
      callPayload?.room || payload.room,
      Number(payload.groupId || callPayload?.groupId || 0) || undefined,
    )
  }

  /** 分发好友关系通知 */
  async function handleFriendNotification(
    contentType: number,
    payload: FriendNotificationPayload,
    peerUserId: number,
  ) {
    const friendStore = useFriendStore()
    switch (contentType) {
      case ImMessageType.FRIEND_REQUEST_RECEIVED:
        friendStore.applyFriendRequestReceivedNotification(payload)
        break
      case ImMessageType.FRIEND_REQUEST_APPROVED:
        friendStore.applyFriendRequestApprovedNotification(payload)
        break
      case ImMessageType.FRIEND_REQUEST_REJECTED:
        friendStore.applyFriendRequestRejectedNotification(payload)
        break
      case ImMessageType.FRIEND_ADD:
        friendStore.applyFriendAddNotification(payload, peerUserId)
        break
      case ImMessageType.FRIEND_DELETE:
        await friendStore.applyFriendDeleteNotification(payload, peerUserId)
        break
      case ImMessageType.FRIEND_BLOCK:
        friendStore.applyFriendBlockNotification(payload)
        break
      case ImMessageType.FRIEND_UNBLOCK:
        friendStore.applyFriendUnblockNotification(payload)
        break
      case ImMessageType.FRIEND_INFO_UPDATED:
        friendStore.applyFriendInfoUpdatedNotification(payload)
        break
      case ImMessageType.FRIEND_UPDATE:
        friendStore.applyFriendUpdateNotification(payload)
        break
    }
  }

  /** 分发加群申请通知 */
  function handleGroupRequestNotification(contentType: number, payload: { requestId?: number }) {
    const requestId = Number(payload.requestId)
    if (!requestId) {
      return
    }
    const groupRequestStore = useGroupRequestStore()
    if (contentType === ImMessageType.GROUP_REQUEST_RECEIVED) {
      void groupRequestStore.addGroupRequestById(requestId).catch(() => undefined)
    } else if (contentType === ImMessageType.GROUP_REQUEST_APPROVED
      || contentType === ImMessageType.GROUP_REQUEST_REJECTED) {
      groupRequestStore.removeGroupRequestById(requestId)
    }
  }

  /** 同步当前用户的群备注与免打扰设置 */
  function handleGroupMemberSettingUpdate(groupId: number, payload: Record<string, any>) {
    useGroupStore().updateGroupFields(groupId, {
      ...(payload.groupRemark !== undefined ? { groupRemark: payload.groupRemark } : {}),
      ...(payload.silent !== undefined ? { silent: payload.silent } : {}),
    })
  }

  /** 同步群成员昵称 */
  async function handleGroupMemberNicknameUpdate(
    groupId: number,
    content: string,
  ) {
    await useGroupStore().applyGroupNotification(
      groupId,
      ImMessageType.GROUP_MEMBER_NICKNAME_UPDATE,
      content,
    )
  }

  /** 派发好友、群关系与申请实时刷新 */
  async function dispatchRelationEvent(
    contentType: number,
    payload: any,
    isActive: () => boolean,
  ) {
    const currentUserId = useUserStore().userInfo.userId
    if (contentType >= ImMessageType.FRIEND_REQUEST_APPROVED && contentType <= ImMessageType.FRIEND_UPDATE) {
      const eventContent = typeof payload.content === 'string' ? safeParse(payload.content) || {} : payload
      const peerUserId = Number(payload.senderId) === currentUserId
        ? Number(payload.receiverId)
        : Number(payload.senderId)
      const friendPayload = {
        ...eventContent,
        operatorUserId: Number(eventContent.operatorUserId || payload.senderId || 0),
        friendUserId: Number(eventContent.friendUserId || peerUserId || 0),
      } as FriendNotificationPayload
      await handleFriendNotification(
        contentType,
        friendPayload,
        peerUserId,
      )
      return contentType === ImMessageType.FRIEND_DELETE
        && eventContent.clear !== false
        && !!peerUserId
    }
    if (contentType < ImMessageType.GROUP_CREATE || contentType > ImMessageType.GROUP_BANNED) {
      return false
    }
    const groupId = Number(payload.groupId)
    const eventContent = typeof payload.content === 'string' ? safeParse(payload.content) || {} : payload
    const groupEventContent = JSON.stringify(eventContent)
    if (contentType === ImMessageType.GROUP_MEMBER_SETTING_UPDATE) {
      handleGroupMemberSettingUpdate(groupId, eventContent)
    } else if (contentType === ImMessageType.GROUP_MEMBER_NICKNAME_UPDATE) {
      await handleGroupMemberNicknameUpdate(groupId, groupEventContent)
    } else {
      await useGroupStore().applyGroupNotification(
        groupId,
        contentType,
        groupEventContent,
      )
    }
    if (contentType === ImMessageType.GROUP_REQUEST_RECEIVED
      || contentType === ImMessageType.GROUP_REQUEST_APPROVED
      || contentType === ImMessageType.GROUP_REQUEST_REJECTED) {
      handleGroupRequestNotification(contentType, {
        requestId: Number(eventContent.requestId || payload.requestId),
      })
    }
    const removedSelf = contentType === ImMessageType.GROUP_DISSOLVE
      || (contentType === ImMessageType.GROUP_MEMBER_QUIT
        && Number(eventContent.operatorUserId || payload.operatorUserId) === currentUserId)
      || (contentType === ImMessageType.GROUP_MEMBER_KICK
        && (eventContent.memberUserIds || payload.memberUserIds || []).map(Number).includes(currentUserId))
    return removedSelf
  }

  /** 安全解析 JSON */
  function safeParse<T = Record<string, any>>(content: unknown): T | undefined {
    if (!content) {
      return undefined
    }
    if (typeof content === 'object') {
      return content as T
    }
    try {
      return JSON.parse(content as string) as T
    } catch {
      return undefined
    }
  }

  /** 发送心跳包 */
  function sendHeartBeat() {
    socketTask?.send({ data: 'ping', fail: () => {} })
  }

  /** 建立连接（幂等） */
  function connect() {
    const url = buildWsUrl()
    if (!url) {
      return
    }
    // 同一地址处于 CONNECTING / OPEN 时直接复用，避免页面 onShow 叠加连接
    if (socketTask && connectionUrl === url
      && (isConnecting.value || isConnected.value)) {
      return
    }
    // 令牌变化时替换旧连接；旧连接的迟到回调由 owner 隔离
    const previousTask = socketTask
    const owner = {}
    connectionOwner = owner
    frameProcessingTail = Promise.resolve()
    socketTask = null
    isConnecting.value = true
    isConnected.value = false
    connectionUrl = url
    stopHeartbeat()
    previousTask?.close({})
    manualClosed = false
    const task = uni.connectSocket({
      url,
      fail: () => {
        if (connectionOwner !== owner) {
          return
        }
        isConnecting.value = false
        socketTask = null
        reconnect()
      },
    })
    if (!task) {
      isConnecting.value = false
      reconnect()
      return
    }
    socketTask = task
    task.onOpen(() => {
      if (connectionOwner !== owner || socketTask !== task) {
        return
      }
      isConnecting.value = false
      isConnected.value = true
      reconnectAttempts = 0
      startHeartbeat()
      // 断线重连成功后补拉一次离线消息，补齐断线期间漏收的消息
      if (resyncOnReopen) {
        resyncOnReopen = false
        const { isLoaded, loadConversationList } = useConversationStore()
        uni.$emit('im:state:resync')
        if (isLoaded()) {
          void loadConversationList(true)
        }
      }
    })
    task.onMessage((res) => {
      const isActive = () => connectionOwner === owner
        && socketTask === task

      if (!isActive()) {
        return
      }
      frameProcessingTail = frameProcessingTail
        .then(() => isActive() ? handleFrame(res.data as string, isActive) : undefined)
        .catch((error) => {
          if (isActive()) {
            console.warn('[IM WebSocket] 消息处理失败', error)
          }
        })
    })
    task.onClose(() => {
      if (connectionOwner !== owner || socketTask !== task) {
        return
      }
      isConnecting.value = false
      isConnected.value = false
      socketTask = null
      stopHeartbeat()
      resyncOnReopen = true
      reconnect()
    })
    task.onError(() => {
      if (connectionOwner !== owner || socketTask !== task) {
        return
      }
      isConnecting.value = false
      isConnected.value = false
      task.close({})
      reconnect()
    })
  }

  /** 主动断开（退出登录时调用） */
  function disconnect() {
    manualClosed = true
    connectionOwner = {}
    stopHeartbeat()
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    socketTask?.close({})
    socketTask = null
    connectionUrl = ''
    isConnecting.value = false
    isConnected.value = false
    frameProcessingTail = Promise.resolve()
  }

  /** 暴露连接状态与动作 */
  return {
    connect,
    disconnect,
  }
})
