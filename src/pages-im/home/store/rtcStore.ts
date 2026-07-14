import type { ImRtcCallRespVO, ImRtcGroupCallRespVO } from '@/api/im/rtc'
import type {
  ImRtcCallEndReasonValue,
  ImRtcCallStageValue,
  ImRtcParticipantStatusValue,
} from '@/pages-im/utils/constants'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  ImConversationType,
  ImRtcCallStage,
  ImRtcCallStatus,
} from '@/pages-im/utils/constants'
import { useUserStore } from '@/store/user'
import { useFriendStore } from './friendStore'
import { useGroupStore } from './groupStore'

type GroupActiveCallCache = ImRtcGroupCallRespVO & {
  participantsLoaded?: boolean
}

/** RTC_CALL 通话信令载荷 */
export interface ImRtcCallNotification {
  status: ImRtcParticipantStatusValue
  room: string
  conversationType: number
  mediaType: number
  groupId?: number
  livekitUrl?: string
  token?: string
  inviterUserId?: number
  inviterNickname?: string
  inviterAvatar?: string
  inviteeIds?: number[]
  operatorUserId?: number
  operatorNickname?: string
  operatorAvatar?: string
}

/** RTC 参与者加入载荷 */
export interface ImRtcParticipantConnectedNotification {
  room: string
  userId: number
  conversationType: number
  groupId?: number
  mediaType?: number
  inviterUserId?: number
}

/** RTC 参与者离开载荷 */
export interface ImRtcParticipantDisconnectedNotification {
  room: string
  userId: number
  conversationType: number
  groupId?: number
}

/** RTC 通话结束载荷 */
export interface ImRtcCallEndNotification {
  room: string
  conversationType: number
  mediaType: number
  endReason: ImRtcCallEndReasonValue
  durationSeconds?: number
  operatorUserId?: number
  operatorNickname?: string
  operatorAvatar?: string
}

/** IM 通话 Store */
export const useRtcStore = defineStore('imRtc', () => {
  const stage = ref<ImRtcCallStageValue>(ImRtcCallStage.IDLE) // 当前通话阶段
  const call = ref<ImRtcCallRespVO | null>(null) // 当前通话
  const incomingPayload = ref<ImRtcCallNotification | null>(null) // 当前来电载荷
  const startedAt = ref(0) // 进入通话中的时间戳
  const groupActiveCalls = ref<Map<number, GroupActiveCallCache>>(new Map()) // 群活跃通话缓存
  const leftUserIds = ref<Set<number>>(new Set()) // 已退出或拒绝的参与者

  const isActive = computed(() => stage.value !== ImRtcCallStage.IDLE) // 是否处于通话阶段
  const peerNickname = computed(() => { // 对端或群聊显示名
    if (stage.value === ImRtcCallStage.INCOMING) {
      return incomingPayload.value?.inviterNickname || ''
    }
    const currentCall = call.value
    if (!currentCall) {
      return ''
    }
    if (currentCall.conversationType === ImConversationType.GROUP) {
      return useGroupStore().getGroup(currentCall.groupId || 0)?.name || ''
    }
    const peerUserId = resolvePrivatePeerUserId(currentCall)
    return (peerUserId && useFriendStore().getFriend(peerUserId)?.nickname) || ''
  })
  const peerAvatar = computed(() => { // 对端或群聊头像
    if (stage.value === ImRtcCallStage.INCOMING) {
      return incomingPayload.value?.inviterAvatar || ''
    }
    const currentCall = call.value
    if (!currentCall) {
      return ''
    }
    if (currentCall.conversationType === ImConversationType.GROUP) {
      return useGroupStore().getGroup(currentCall.groupId || 0)?.avatar || ''
    }
    const peerUserId = resolvePrivatePeerUserId(currentCall)
    return (peerUserId && useFriendStore().getFriend(peerUserId)?.avatar) || ''
  })

  /** 获取私聊对端用户编号 */
  function resolvePrivatePeerUserId(currentCall: ImRtcCallRespVO): number | undefined {
    const userId = useUserStore().userInfo.userId
    return currentCall.inviterId === userId ? currentCall.inviteeIds?.[0] : currentCall.inviterId
  }

  /** 主叫进入邀请阶段 */
  function startInviting(data: ImRtcCallRespVO) {
    call.value = data
    syncGroupActiveCall(data)
    if (data.conversationType === ImConversationType.GROUP) {
      stage.value = ImRtcCallStage.RUNNING
      startedAt.value = Date.now()
      return
    }
    const running = data.status === ImRtcCallStatus.RUNNING
    stage.value = running ? ImRtcCallStage.RUNNING : ImRtcCallStage.INVITING
    if (running) {
      startedAt.value = Date.now()
    }
  }

  /** 被叫显示来电 */
  function showIncoming(payload: ImRtcCallNotification) {
    if (isActive.value) {
      return
    }
    incomingPayload.value = payload
    stage.value = ImRtcCallStage.INCOMING
    syncGroupActiveCall({
      conversationType: payload.conversationType,
      room: payload.room,
      groupId: payload.groupId,
      mediaType: payload.mediaType,
      inviterId: payload.inviterUserId || 0,
      joinedUserIds: payload.inviterUserId ? [payload.inviterUserId] : [],
      inviteeIds: payload.inviteeIds,
    })
  }

  /** 进入通话中阶段 */
  function enterRunning(data: ImRtcCallRespVO) {
    call.value = data
    incomingPayload.value = null
    stage.value = ImRtcCallStage.RUNNING
    startedAt.value = Date.now()
    syncGroupActiveCall(data)
  }

  /** 重置当前通话 */
  function reset() {
    stage.value = ImRtcCallStage.IDLE
    call.value = null
    incomingPayload.value = null
    startedAt.value = 0
    leftUserIds.value = new Set()
    uni.$emit('im:rtc-ended')
  }

  /** 追加被邀请人 */
  function appendInvitees(userIds: number[]) {
    if (!call.value || userIds.length === 0) {
      return
    }
    const existing = call.value.inviteeIds || []
    const merged = Array.from(new Set([...existing, ...userIds]))
    if (merged.length === existing.length) {
      return
    }
    call.value = { ...call.value, inviteeIds: merged }
    syncGroupActiveCall(call.value)
  }

  /** 同步群活跃通话缓存 */
  function syncGroupActiveCall(input: {
    conversationType: number
    room: string
    groupId?: number
    mediaType: number
    inviterId: number
    joinedUserIds?: number[]
    inviteeIds?: number[]
  }) {
    if (input.conversationType !== ImConversationType.GROUP || !input.groupId) {
      return
    }
    setGroupCall({
      room: input.room,
      groupId: input.groupId,
      mediaType: input.mediaType,
      inviterId: input.inviterId,
      joinedUserIds: input.joinedUserIds || [],
      inviteeIds: input.inviteeIds || [],
    })
  }

  /** 写入群活跃通话 */
  function setGroupCall(payload: ImRtcGroupCallRespVO, participantsLoaded?: boolean) {
    if (!payload.groupId) {
      return
    }
    useGroupStore().markGroupActiveCallLoaded(payload.groupId)
    const existing = groupActiveCalls.value.get(payload.groupId)
    const nextParticipantsLoaded = participantsLoaded
      ?? (existing?.room === payload.room && !!existing.participantsLoaded)
    if (existing
      && isSameGroupCall(existing, payload)
      && !!existing.participantsLoaded === nextParticipantsLoaded) {
      return
    }
    const next = new Map(groupActiveCalls.value)
    next.set(payload.groupId, { ...payload, participantsLoaded: nextParticipantsLoaded })
    groupActiveCalls.value = next
  }

  /** 清空群活跃通话缓存 */
  function clearGroupCallCache(groupId?: number) {
    if (!groupId) {
      groupActiveCalls.value = new Map()
      return
    }
    const next = new Map(groupActiveCalls.value)
    next.delete(groupId)
    groupActiveCalls.value = next
  }

  /** 判断群通话参与者是否已完整拉取 */
  function isGroupCallParticipantsLoaded(groupId: number, room?: string): boolean {
    const currentCall = groupActiveCalls.value.get(groupId)
    return !!groupId && !!room && !!currentCall
      && currentCall.room === room && !!currentCall.participantsLoaded
  }

  /** 判断两条群通话摘要是否一致 */
  function isSameGroupCall(left: ImRtcGroupCallRespVO, right: ImRtcGroupCallRespVO): boolean {
    return left.room === right.room
      && left.mediaType === right.mediaType
      && left.inviterId === right.inviterId
      && isSameNumberList(left.joinedUserIds, right.joinedUserIds)
      && isSameNumberList(left.inviteeIds, right.inviteeIds)
  }

  /** 移除已结束的群通话 */
  function removeGroupCall(groupId: number, room?: string) {
    if (!groupId) {
      return
    }
    const existing = groupActiveCalls.value.get(groupId)
    if (room && existing?.room !== room) {
      return
    }
    clearGroupCallCache(groupId)
    useGroupStore().markGroupActiveCallLoaded(groupId)
  }

  /** 获取群活跃通话 */
  function getGroupCall(groupId: number): ImRtcGroupCallRespVO | undefined {
    return groupActiveCalls.value.get(groupId)
  }

  /** 标记参与者已退出或拒绝 */
  function markUserLeft(userId: number) {
    if (!userId || leftUserIds.value.has(userId)) {
      return
    }
    leftUserIds.value = new Set([...Array.from(leftUserIds.value), userId])
  }

  /** 判断参与者是否已退出或拒绝 */
  function isUserLeft(userId: number) {
    return leftUserIds.value.has(userId)
  }

  /** 应用参与者加入通知 */
  function applyParticipantConnected(payload: ImRtcParticipantConnectedNotification) {
    if (payload.conversationType !== ImConversationType.GROUP || !payload.groupId) {
      return
    }
    const existing = groupActiveCalls.value.get(payload.groupId)
    if (!existing) {
      setGroupCall({
        room: payload.room,
        groupId: payload.groupId,
        mediaType: payload.mediaType || 0,
        inviterId: payload.inviterUserId || 0,
        joinedUserIds: [payload.userId],
        inviteeIds: [],
      })
      return
    }
    if (existing.room !== payload.room || existing.joinedUserIds?.includes(payload.userId)) {
      return
    }
    setGroupCall({
      ...existing,
      joinedUserIds: [...(existing.joinedUserIds || []), payload.userId],
    })
  }

  /** 应用参与者离开通知 */
  function applyParticipantDisconnected(payload: ImRtcParticipantDisconnectedNotification) {
    markUserLeft(payload.userId)
    if (payload.conversationType === ImConversationType.GROUP && payload.groupId) {
      dropFromGroupActiveCall(payload.groupId, payload.room, payload.userId)
    }
  }

  /** 应用参与者拒绝通知 */
  function applyParticipantRejected(
    payload: Pick<ImRtcCallNotification, 'room' | 'conversationType' | 'groupId' | 'operatorUserId'>,
  ) {
    if (!payload.operatorUserId) {
      return
    }
    markUserLeft(payload.operatorUserId)
    if (payload.conversationType === ImConversationType.GROUP && payload.groupId) {
      dropFromGroupActiveCall(payload.groupId, payload.room, payload.operatorUserId)
    }
  }

  /** 应用参与者振铃超时通知 */
  function applyParticipantNoAnswer(
    payload: Pick<ImRtcCallNotification, 'room' | 'conversationType' | 'groupId' | 'operatorUserId'>,
  ) {
    applyParticipantRejected(payload)
  }

  /** 从群活跃通话中移除参与者 */
  function dropFromGroupActiveCall(groupId: number, room: string, userId: number) {
    const existing = groupActiveCalls.value.get(groupId)
    if (!existing || existing.room !== room) {
      return
    }
    const joinedUserIds = (existing.joinedUserIds || []).filter(id => id !== userId)
    const inviteeIds = (existing.inviteeIds || []).filter(id => id !== userId)
    if (joinedUserIds.length === existing.joinedUserIds?.length
      && inviteeIds.length === existing.inviteeIds?.length) {
      return
    }
    if (joinedUserIds.length === 0 && inviteeIds.length === 0) {
      removeGroupCall(groupId, room)
      return
    }
    setGroupCall({ ...existing, joinedUserIds, inviteeIds })
  }

  /** 退出登录时清理全部通话状态 */
  function handleLogout() {
    reset()
    clearGroupCallCache()
  }

  uni.$on('auth:logout', handleLogout)

  return {
    stage,
    call,
    incomingPayload,
    peerNickname,
    peerAvatar,
    startedAt,
    isActive,
    startInviting,
    showIncoming,
    enterRunning,
    reset,
    appendInvitees,
    // TODO @AI：是因为功能没迁移么？
    //     markUserLeft,
    //     isUserLeft,    isGroupCallParticipantsLoaded,
    markUserLeft,
    isUserLeft,
    setGroupCall,
    removeGroupCall,
    getGroupCall,
    isGroupCallParticipantsLoaded,
    clearGroupCallCache,
    applyParticipantConnected,
    applyParticipantDisconnected,
    applyParticipantRejected,
    applyParticipantNoAnswer,
  }
})

/** 判断两个用户编号数组是否一致 */
// TODO @AI：是不是应该全局方法？
function isSameNumberList(left: number[] = [], right: number[] = []) {
  return left.length === right.length && left.every((item, index) => item === right[index])
}
