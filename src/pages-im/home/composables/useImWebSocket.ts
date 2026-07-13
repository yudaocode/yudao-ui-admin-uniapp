// IM 实时链路：复用 yudao 内置 /infra/ws 通道（帧 type=im-notification）
// 普通消息写本地库并更新会话；撤回、已读、群状态与 RTC 信令通过全局事件实时分发

import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { isDoubleTokenRes } from '@/api/types/login'
import { getEnvBaseUrlRoot } from '@/utils'
import {
  ImConversationType,
  ImMessageStatus,
  ImMessageType,
  isFriendChatTip,
  isGroupNotification,
  isNormalMessage,
  isRtcCallTip,
} from '@/utils/constants'
import { useImConversations } from './useImConversations'
import { useImRtc } from './useImRtc'

/** IM 通知帧 type */
const IM_NOTIFICATION = 'im-notification'
let socketTask: UniApp.SocketTask | null = null
let connected = false
let connecting = false
let manualClosed = false
let reconnectAttempts = 0
let resyncOnReopen = false // 断线重连成功后需补拉一次，补齐断线期间漏收的消息
let connectionUrl = '' // 当前连接身份；仅用于识别账号或令牌是否切换
let connectionGeneration = 0 // 连接代次；忽略已被替换连接的迟到回调
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let frameProcessing: Promise<void> = Promise.resolve() // 按连接顺序串行处理 WebSocket 帧

/** 拼接 ws 地址 */
function buildUrl(): string | undefined {
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
    if (socketTask && connected) {
      socketTask.send({ data: 'ping', fail: () => {} })
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
function scheduleReconnect() {
  if (manualClosed || reconnectTimer) {
    return
  }
  reconnectAttempts++
  const delay = Math.min(1000 * 2 ** Math.min(reconnectAttempts, 5), 30000)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectImWebSocket()
  }, delay)
}

/** 处理收到的帧 */
async function handleFrame(data: string, isActive: () => boolean, currentUserId: number) {
  if (!isActive() || !data || data === 'pong') {
    return
  }
  let frame: { type?: string, content?: string }
  try {
    frame = JSON.parse(data)
  } catch {
    return
  }
  if (frame.type !== IM_NOTIFICATION || !frame.content) {
    return
  }
  let notification: { conversationType?: number, contentType?: number, payload?: any }
  try {
    notification = JSON.parse(frame.content)
  } catch {
    return
  }
  const { conversationType, contentType, payload } = notification
  if (!payload || contentType == null || conversationType == null) {
    return
  }
  if (conversationType === ImConversationType.PRIVATE
    && Number(payload.senderId) !== currentUserId
    && Number(payload.receiverId) !== currentUserId) {
    return
  }
  if (conversationType === ImConversationType.GROUP
    && Number(payload.senderId) !== currentUserId
    && Array.isArray(payload.receiverUserIds)
    && payload.receiverUserIds.length > 0
    && !payload.receiverUserIds.map(Number).includes(currentUserId)) {
    return
  }
  if (contentType === ImMessageType.RTC_CALL) {
    await useImRtc().receiveSignal({ ...payload, conversationType: payload.conversationType ?? conversationType }, contentType)
    return
  }
  if (contentType === ImMessageType.RTC_PARTICIPANT_CONNECTED
    || contentType === ImMessageType.RTC_PARTICIPANT_DISCONNECTED) {
    await useImRtc().receiveSignal({ ...payload, conversationType: payload.conversationType ?? conversationType }, contentType)
    return
  }
  if (contentType === ImMessageType.RTC_CALL_END) {
    const callPayload = typeof payload.content === 'string' ? safeParse(payload.content) : payload
    useImRtc().end(callPayload?.room || payload.room)
  }
  if (contentType === ImMessageType.READ) {
    const messageId = Number(payload.readId || payload.messageId || payload.id)
    const targetId = conversationType === ImConversationType.GROUP
      ? Number(payload.groupId)
      : conversationType === ImConversationType.CHANNEL
        ? Number(payload.channelId)
        : Number(payload.receiverId)
    if (messageId && targetId) {
      await useImConversations().applyConversationReadList([{
        id: Number(payload.id || messageId),
        conversationType,
        targetId,
        messageId,
        updateTime: payload.updateTime,
      }], isActive)
    }
  }
  if (!isActive()) {
    return
  }
  if (contentType === ImMessageType.RECALL) {
    const { buildIncomingMessage, applyRecallMessage } = useImConversations()
    const signal = buildIncomingMessage(conversationType, { ...payload, type: contentType }, currentUserId)
    if (signal) {
      await applyRecallMessage(conversationType, signal.targetId, signal.content, currentUserId)
    }
    if (isActive()) {
      uni.$emit('im:event', { conversationType, contentType, payload })
    }
    return
  }
  // 所有事件先广播，打开的聊天、通讯录和群详情按需更新
  uni.$emit('im:event', { conversationType, contentType, payload })
  const removedSelf = await dispatchRelationEvent(contentType, payload, isActive, currentUserId)
  if (!isActive()) {
    return
  }
  if (conversationType !== ImConversationType.PRIVATE
    && conversationType !== ImConversationType.GROUP
    && conversationType !== ImConversationType.CHANNEL) {
    return
  }
  const isChatMessage = isNormalMessage(contentType)
    || isRtcCallTip(contentType)
    || (conversationType === ImConversationType.GROUP && isGroupNotification(contentType))
    || (conversationType === ImConversationType.PRIVATE && isFriendChatTip(contentType))
  if (!isChatMessage || removedSelf) {
    // 事件消息不直接增加未读，刷新会话保证撤回、群名和免打扰等摘要最终一致
    if (contentType !== ImMessageType.READ && contentType !== ImMessageType.RECEIPT) {
      const { isLoaded, load } = useImConversations()
      if (isLoaded()) {
        void load()
      }
    }
    return
  }
  const { buildIncomingMessage, applyIncomingMessage } = useImConversations()
  const message = buildIncomingMessage(conversationType, { ...payload, type: contentType }, currentUserId)
  if (!message) {
    return
  }
  const appliedMessage = await applyIncomingMessage(message, currentUserId, true)
  if (!isActive()) {
    return
  }
  if (!appliedMessage
    || appliedMessage.type === ImMessageType.RECALL
    || appliedMessage.status === ImMessageStatus.RECALL) {
    return
  }
  // 广播给聊天页（若正打开该会话则追加气泡）
  uni.$emit('im:message', { message, payload: { ...payload, type: contentType }, conversationType })
}

/** 派发好友、群关系与申请实时刷新 */
async function dispatchRelationEvent(
  contentType: number,
  payload: any,
  isActive: () => boolean,
  currentUserId: number,
) {
  const { isLoaded, load, removeConversation } = useImConversations()
  if (contentType >= ImMessageType.FRIEND_REQUEST_APPROVED && contentType <= ImMessageType.FRIEND_UPDATE) {
    uni.$emit('im:friends:reload')
    uni.$emit('im:requests:reload')
    if (isLoaded()) {
      void load()
    }
    return false
  }
  if (contentType < ImMessageType.GROUP_CREATE || contentType > ImMessageType.GROUP_BANNED) {
    return false
  }
  const groupId = Number(payload.groupId)
  uni.$emit('im:groups:reload')
  uni.$emit('im:group-detail:reload', groupId)
  if (contentType === ImMessageType.GROUP_REQUEST_RECEIVED
    || contentType === ImMessageType.GROUP_REQUEST_APPROVED
    || contentType === ImMessageType.GROUP_REQUEST_REJECTED) {
    uni.$emit('im:requests:reload')
  }
  const eventContent = typeof payload.content === 'string' ? safeParse(payload.content) || {} : payload
  const removedSelf = contentType === ImMessageType.GROUP_DISSOLVE
    || (contentType === ImMessageType.GROUP_MEMBER_QUIT
      && Number(eventContent.operatorUserId || payload.operatorUserId) === currentUserId)
    || (contentType === ImMessageType.GROUP_MEMBER_KICK
      && (eventContent.memberUserIds || payload.memberUserIds || []).map(Number).includes(currentUserId))
  if (removedSelf && groupId) {
    await removeConversation(`${ImConversationType.GROUP}:${groupId}`)
  }
  if (isActive() && isLoaded()) {
    void load()
  }
  return removedSelf
}

/** 安全解析 JSON */
function safeParse(content: string) {
  try {
    return JSON.parse(content)
  } catch {
    return undefined
  }
}

/** 建立连接（幂等） */
export function connectImWebSocket() {
  const url = buildUrl()
  if (!url) {
    return
  }
  // 同一身份处于 CONNECTING / OPEN 时直接复用，避免页面 onShow 叠加连接
  if (socketTask && connectionUrl === url && (connecting || connected)) {
    return
  }
  // 账号或令牌变化时替换旧连接；旧连接的迟到回调由 generation 隔离
  const previousTask = socketTask
  connectionGeneration++
  const generation = connectionGeneration
  const connectionUserId = useUserStore().userInfo.userId
  frameProcessing = Promise.resolve()
  socketTask = null
  connecting = true
  connected = false
  connectionUrl = url
  stopHeartbeat()
  previousTask?.close({})
  manualClosed = false
  const task = uni.connectSocket({
    url,
    fail: () => {
      if (generation !== connectionGeneration) {
        return
      }
      connecting = false
      socketTask = null
      scheduleReconnect()
    },
  })
  if (!task) {
    connecting = false
    scheduleReconnect()
    return
  }
  socketTask = task
  task.onOpen(() => {
    if (generation !== connectionGeneration || socketTask !== task) {
      return
    }
    connecting = false
    connected = true
    reconnectAttempts = 0
    startHeartbeat()
    // 断线重连成功后补拉一次离线消息，补齐断线期间漏收的消息
    if (resyncOnReopen) {
      resyncOnReopen = false
      const { isLoaded, load } = useImConversations()
      if (isLoaded()) {
        load()
      }
    }
  })
  task.onMessage((res) => {
    const isActive = () => generation === connectionGeneration
      && socketTask === task
      && useUserStore().userInfo.userId === connectionUserId
    if (!isActive()) {
      return
    }
    frameProcessing = frameProcessing
      .then(() => isActive() ? handleFrame(res.data as string, isActive, connectionUserId) : undefined)
      .catch((error) => {
        if (isActive()) {
          console.warn('[IM WebSocket] 消息处理失败', error)
        }
      })
  })
  task.onClose(() => {
    if (generation !== connectionGeneration || socketTask !== task) {
      return
    }
    connecting = false
    connected = false
    socketTask = null
    stopHeartbeat()
    resyncOnReopen = true
    scheduleReconnect()
  })
  task.onError(() => {
    if (generation !== connectionGeneration || socketTask !== task) {
      return
    }
    connecting = false
    connected = false
    task.close({})
    scheduleReconnect()
  })
}

/** 主动断开（退出登录时调用） */
export function disconnectImWebSocket() {
  manualClosed = true
  connectionGeneration++
  stopHeartbeat()
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  socketTask?.close({})
  socketTask = null
  connectionUrl = ''
  connecting = false
  connected = false
  frameProcessing = Promise.resolve()
}

uni.$on('auth:logout', disconnectImWebSocket)
