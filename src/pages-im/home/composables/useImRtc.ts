import type { ImRtcCallRespVO } from '@/api/im/rtc'
import type { ImRtcCallStageValue } from '@/utils/constants'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, getCurrentInstance, ref } from 'vue'
import { acceptCall, cancelCall, createCall, inviteCall, joinCall, leaveCall, rejectCall } from '@/api/im/rtc'
import { useUserStore } from '@/store/user'
import {
  ImConversationType,
  ImMessageType,
  ImRtcCallStage,
  ImRtcCallStatus,
  ImRtcParticipantStatus,
} from '@/utils/constants'

export interface ImRtcSignalPayload extends Partial<ImRtcCallRespVO> {
  status: number
  room: string
  inviterId?: number
  inviterUserId?: number
  inviterNickname?: string
  inviterAvatar?: string
  operatorUserId?: number
  userId?: number
  participantUserId?: number
}

const stage = ref<ImRtcCallStageValue>(ImRtcCallStage.IDLE) // 当前通话阶段
const call = ref<ImRtcCallRespVO>() // 当前通话
const incoming = ref<ImRtcSignalPayload>() // 当前来电
const peerName = ref('') // 对端或群聊名称
const peerAvatar = ref('') // 对端头像
const startedAt = ref(0) // 通话开始时间
let openingPage = false
let showToast: ((message: string) => void) | undefined

/** 显示通话提示 */
function showRtcTip(message: string) {
  showToast?.(message)
}

/** 当前是否有通话 */
const active = computed(() => stage.value !== ImRtcCallStage.IDLE)

/** 当前平台是否支持 LiveKit 通话 */
function supportsRtc() {
  // #ifdef H5
  return true
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/** 打开通话页，避免重复入栈 */
function openCallPage() {
  if (openingPage || getCurrentPages().some(page => page.route === 'pages-im/home/rtc/call/index')) {
    return
  }
  openingPage = true
  uni.navigateTo({
    url: '/pages-im/home/rtc/call/index',
    complete: () => {
      openingPage = false
    },
  })
}

/** 发起私聊或群聊通话 */
async function start(options: {
  conversationType: number
  mediaType: number
  inviteeIds: number[]
  groupId?: number
  name?: string
  avatar?: string
}) {
  if (!supportsRtc()) {
    showRtcTip('请在 H5 或 PC 端使用通话')
    return false
  }
  if (active.value) {
    showRtcTip('当前正在通话中')
    return false
  }
  const data = await createCall({
    conversationType: options.conversationType,
    mediaType: options.mediaType,
    groupId: options.groupId,
    inviteeIds: options.inviteeIds,
  })
  if (data.status === ImRtcCallStatus.ENDED) {
    showRtcTip('对方当前无法接听')
    return false
  }
  call.value = data
  peerName.value = options.name || (options.conversationType === ImConversationType.GROUP ? '群聊通话' : '好友')
  peerAvatar.value = options.avatar || ''
  stage.value = data.status === ImRtcCallStatus.RUNNING ? ImRtcCallStage.RUNNING : ImRtcCallStage.INVITING
  if (stage.value === ImRtcCallStage.RUNNING) {
    startedAt.value = Date.now()
  }
  openCallPage()
  return true
}

/** 接收 RTC WebSocket 信令 */
async function receiveSignal(payload: ImRtcSignalPayload, contentType: number = ImMessageType.RTC_CALL) {
  if (contentType === ImMessageType.RTC_PARTICIPANT_CONNECTED
    || contentType === ImMessageType.RTC_PARTICIPANT_DISCONNECTED) {
    if (payload.room !== call.value?.room) {
      return
    }
    const participantUserId = payload.participantUserId || payload.userId || payload.operatorUserId
    if (participantUserId) {
      syncParticipant(participantUserId, contentType === ImMessageType.RTC_PARTICIPANT_CONNECTED)
    }
    return
  }
  const userId = useUserStore().userInfo.userId
  if (payload.status === ImRtcParticipantStatus.INVITING) {
    if (active.value || payload.inviterId === userId || payload.inviterUserId === userId) {
      return
    }
    if (!supportsRtc()) {
      await rejectCall(payload.room)
      return
    }
    incoming.value = payload
    peerName.value = payload.inviterNickname || '收到新来电'
    peerAvatar.value = payload.inviterAvatar || ''
    stage.value = ImRtcCallStage.INCOMING
    openCallPage()
    return
  }
  if (payload.room !== call.value?.room && payload.room !== incoming.value?.room) {
    return
  }
  if (payload.status === ImRtcParticipantStatus.JOINED && stage.value === ImRtcCallStage.INVITING) {
    stage.value = ImRtcCallStage.RUNNING
    startedAt.value ||= Date.now()
  }
  if (payload.status === ImRtcParticipantStatus.REJECTED || payload.status === ImRtcParticipantStatus.NO_ANSWER) {
    reset()
  }
}

/** 同步通话参与成员 */
function syncParticipant(userId: number, joined: boolean) {
  if (!call.value) {
    return
  }
  const currentIds = call.value.joinedUserIds || []
  call.value = {
    ...call.value,
    joinedUserIds: joined
      ? Array.from(new Set([...currentIds, userId]))
      : currentIds.filter(id => id !== userId),
  }
  if (joined && stage.value === ImRtcCallStage.INVITING) {
    stage.value = ImRtcCallStage.RUNNING
    startedAt.value ||= Date.now()
  }
}

/** 通话中追加邀请群成员 */
async function invite(userIds: number[]) {
  if (!call.value?.room || userIds.length === 0) {
    return false
  }
  await inviteCall({ room: call.value.room, inviteeIds: userIds })
  call.value = {
    ...call.value,
    inviteeIds: Array.from(new Set([...(call.value.inviteeIds || []), ...userIds])),
  }
  return true
}

/** 接听来电 */
async function accept() {
  if (!incoming.value?.room) {
    return
  }
  call.value = await acceptCall(incoming.value.room)
  incoming.value = undefined
  stage.value = ImRtcCallStage.RUNNING
  startedAt.value = Date.now()
}

/** 加入群通话 */
async function join(room: string, name?: string) {
  if (!supportsRtc()) {
    showRtcTip('请在 H5 或 PC 端使用通话')
    return false
  }
  if (active.value) {
    return false
  }
  call.value = await joinCall(room)
  peerName.value = name || '群聊通话'
  stage.value = ImRtcCallStage.RUNNING
  startedAt.value = Date.now()
  openCallPage()
  return true
}

/** 拒绝来电 */
async function reject() {
  if (incoming.value?.room) {
    await rejectCall(incoming.value.room)
  }
  reset()
}

/** 取消呼叫或离开通话 */
async function hangup() {
  const room = call.value?.room || incoming.value?.room
  try {
    if (room) {
      if (stage.value === ImRtcCallStage.INVITING) {
        await cancelCall(room)
      } else if (stage.value === ImRtcCallStage.INCOMING) {
        await rejectCall(room)
      } else {
        await leaveCall(room)
      }
    }
  } finally {
    reset()
  }
}

/** 通话结束通知 */
function end(room?: string) {
  if (!room || room === call.value?.room || room === incoming.value?.room) {
    reset()
  }
}

/** 清理本地通话状态 */
function reset() {
  stage.value = ImRtcCallStage.IDLE
  call.value = undefined
  incoming.value = undefined
  peerName.value = ''
  peerAvatar.value = ''
  startedAt.value = 0
  uni.$emit('im:rtc-ended')
}

export function useImRtc() {
  if (getCurrentInstance()) {
    showToast = useToast().show
  }
  return {
    stage,
    call,
    incoming,
    peerName,
    peerAvatar,
    startedAt,
    active,
    start,
    join,
    accept,
    reject,
    hangup,
    invite,
    syncParticipant,
    receiveSignal,
    end,
    reset,
  }
}
