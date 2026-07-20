import type {
  ImRtcCallNotification,
  ImRtcParticipantConnectedNotification,
  ImRtcParticipantDisconnectedNotification,
} from '../store/rtcStore'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { storeToRefs } from 'pinia'
import { getCurrentInstance } from 'vue'
import {
  acceptCall,
  cancelCall,
  createCall,
  inviteCall,
  joinCall,
  leaveCall,
  rejectCall,
} from '@/api/im/rtc'
import {
  ImConversationType,
  ImMessageType,
  ImRtcCallStage,
  ImRtcCallStatus,
  ImRtcParticipantStatus,
} from '@/pages-im/utils/constants'
import { useUserStore } from '@/store/user'
import { useRtcStore } from '../store/rtcStore'

let openingPage = false // 通话页是否正在入栈
let startCallTask: { // 发起通话 single-flight
  task: Promise<boolean>
} | undefined
let joinCallTask: { // 加入通话 single-flight
  room: string
  task: Promise<boolean>
} | undefined
let acceptCallTask: { // 接听通话 single-flight
  room: string
  task: Promise<boolean>
} | undefined

/** 退出登录时释放未完成通话任务的发布权 */
function clearPendingRtcTasks() {
  openingPage = false
  startCallTask = undefined
  joinCallTask = undefined
  acceptCallTask = undefined
}

uni.$on('auth:logout', clearPendingRtcTasks)

/** 移动端通话 API 与页面跳转适配 */
export function useImRtc() {
  const toast = getCurrentInstance() ? useToast() : undefined
  const userStore = useUserStore()
  const rtcStore = useRtcStore()

  /** 当前平台是否支持 LiveKit 通话 */
  function supportsRtc() {
    // #ifdef H5
    return true
    // #endif
    // #ifndef H5
    return false
    // #endif
  }

  /** 打开通话页 */
  function openCallPage() {
    if (openingPage
      || getCurrentPages().some(page => page.route === 'pages-im/home/conversation/rtc/call/index')) {
      return
    }
    openingPage = true
    uni.navigateTo({
      url: '/pages-im/home/conversation/rtc/call/index',
      complete: () => openingPage = false,
    })
  }

  /** 发起私聊或群聊通话 */
  async function start(options: {
    conversationType: number
    mediaType: number
    inviteeIds: number[]
    groupId?: number
  }) {
    if (startCallTask) {
      return startCallTask.task
    }
    const userId = userStore.userInfo.userId
    const task = (async () => {
      if (!supportsRtc()) {
        toast?.show('请在 H5 或 PC 端使用通话')
        return false
      }
      if (rtcStore.isActive) {
        toast?.show('当前正在通话中')
        return false
      }
      const data = await createCall(options)
      if (startCallTask?.task !== task || userStore.userInfo.userId !== userId) {
        return false
      }
      if (rtcStore.isActive) {
        const activeRoom = rtcStore.call?.room || rtcStore.incomingPayload?.room
        if (activeRoom !== data.room) {
          await leaveCall(data.room).catch(() => undefined)
        }
        return false
      }
      if (data.status === ImRtcCallStatus.ENDED) {
        toast?.show('对方当前无法接听')
        return false
      }
      rtcStore.startInviting(data)
      openCallPage()
      return true
    })().finally(() => {
      if (startCallTask?.task === task) {
        startCallTask = undefined
      }
    })
    startCallTask = { task }
    return task
  }

  /** 加入群通话 */
  async function join(room: string) {
    if (joinCallTask) {
      return joinCallTask.room === room ? joinCallTask.task : false
    }
    if (!supportsRtc()) {
      toast?.show('请在 H5 或 PC 端使用通话')
      return false
    }
    if (rtcStore.isActive) {
      return false
    }
    const userId = userStore.userInfo.userId
    const task = (async () => {
      const data = await joinCall(room)
      if (joinCallTask?.task !== task || userStore.userInfo.userId !== userId) {
        return false
      }
      if (rtcStore.isActive) {
        const activeRoom = rtcStore.call?.room || rtcStore.incomingPayload?.room
        if (activeRoom !== (data.room || room)) {
          await leaveCall(data.room || room).catch(() => undefined)
        }
        return false
      }
      rtcStore.enterRunning(data)
      openCallPage()
      return true
    })().finally(() => {
      if (joinCallTask?.task === task) {
        joinCallTask = undefined
      }
    })
    joinCallTask = { room, task }
    return task
  }

  /** 接听来电 */
  async function accept() {
    const room = rtcStore.incomingPayload?.room
    if (!room) {
      return false
    }
    if (acceptCallTask) {
      return acceptCallTask.room === room ? acceptCallTask.task : false
    }
    const userId = userStore.userInfo.userId
    const task = (async () => {
      const data = await acceptCall(room)
      if (acceptCallTask?.task !== task || userStore.userInfo.userId !== userId) {
        return false
      }
      if (rtcStore.stage !== ImRtcCallStage.INCOMING
        || rtcStore.incomingPayload?.room !== room) {
        const activeRoom = rtcStore.call?.room || rtcStore.incomingPayload?.room
        if (activeRoom !== room) {
          await leaveCall(room).catch(() => undefined)
        }
        return false
      }
      rtcStore.enterRunning(data)
      return true
    })().finally(() => {
      if (acceptCallTask?.task === task) {
        acceptCallTask = undefined
      }
    })
    acceptCallTask = { room, task }
    return task
  }

  /** 拒绝来电 */
  async function reject() {
    const payload = rtcStore.incomingPayload
    if (payload?.room) {
      await rejectCall(payload.room)
      if (rtcStore.incomingPayload !== payload) {
        return
      }
      rtcStore.applyParticipantRejected({
        ...payload,
        operatorUserId: useUserStore().userInfo.userId,
      })
    }
    rtcStore.reset()
  }

  /** 取消呼叫、拒绝来电或离开通话 */
  async function hangup() {
    const currentCall = rtcStore.call
    const incomingPayload = rtcStore.incomingPayload
    const currentStage = rtcStore.stage
    const room = currentCall?.room || incomingPayload?.room
    try {
      if (!room) {
        return
      }
      if (currentStage === ImRtcCallStage.INVITING) {
        await cancelCall(room)
      } else if (currentStage === ImRtcCallStage.INCOMING) {
        await rejectCall(room)
        if (incomingPayload) {
          rtcStore.applyParticipantRejected({
            ...incomingPayload,
            operatorUserId: useUserStore().userInfo.userId,
          })
        }
      } else {
        await leaveCall(room)
        if (currentCall) {
          rtcStore.applyParticipantDisconnected({
            room,
            conversationType: currentCall.conversationType,
            groupId: currentCall.groupId,
            userId: useUserStore().userInfo.userId,
          })
        }
      }
    } finally {
      if (rtcStore.call?.room === room || rtcStore.incomingPayload?.room === room) {
        rtcStore.reset()
      }
    }
  }

  /** 通话中追加邀请成员 */
  async function invite(userIds: number[]) {
    const room = rtcStore.call?.room
    if (!room || userIds.length === 0) {
      return false
    }
    await inviteCall({ room, inviteeIds: userIds })
    if (rtcStore.call?.room !== room) {
      return false
    }
    rtcStore.appendInvitees(userIds)
    return true
  }

  /** 同步 LiveKit 本地参与成员 */
  function syncParticipant(userId: number, joined: boolean) {
    const currentCall = rtcStore.call
    if (!currentCall) {
      return
    }
    const currentIds = currentCall.joinedUserIds || []
    if (joined) {
      rtcStore.restoreUser(currentCall.room, userId)
    } else {
      rtcStore.markUserLeft(currentCall.room, userId)
    }
    const data = {
      ...currentCall,
      joinedUserIds: joined
        ? Array.from(new Set([...currentIds, userId]))
        : currentIds.filter(id => id !== userId),
      inviteeIds: joined
        ? currentCall.inviteeIds
        : currentCall.inviteeIds?.filter(id => id !== userId),
    }
    rtcStore.call = data
    if (data.conversationType === ImConversationType.GROUP && data.groupId) {
      rtcStore.setGroupCall({
        room: data.room,
        groupId: data.groupId,
        mediaType: data.mediaType,
        inviterId: data.inviterId,
        joinedUserIds: data.joinedUserIds,
        inviteeIds: data.inviteeIds,
      })
    }
    if (joined
      && userId !== userStore.userInfo.userId
      && rtcStore.stage === ImRtcCallStage.INVITING) {
      rtcStore.enterRunning(data)
    }
  }

  /** 同步拒绝或未接听成员 */
  function syncUnavailableParticipant(notification: ImRtcCallNotification) {
    if (notification.conversationType === ImConversationType.GROUP) {
      if (notification.room === rtcStore.call?.room && notification.operatorUserId) {
        syncParticipant(notification.operatorUserId, false)
      }
      return
    }
    if (notification.room === rtcStore.call?.room
      || notification.room === rtcStore.incomingPayload?.room) {
      rtcStore.reset()
    }
  }

  /** 接收 RTC 信令 */
  async function receiveSignal(
    payload: ImRtcCallNotification
      | ImRtcParticipantConnectedNotification
      | ImRtcParticipantDisconnectedNotification,
    contentType: number = ImMessageType.RTC_CALL,
  ) {
    if (contentType === ImMessageType.RTC_PARTICIPANT_CONNECTED) {
      const participant = payload as ImRtcParticipantConnectedNotification
      rtcStore.applyParticipantConnected(participant)
      if (participant.room === rtcStore.call?.room) {
        syncParticipant(participant.userId, true)
      }
      return
    }
    if (contentType === ImMessageType.RTC_PARTICIPANT_DISCONNECTED) {
      const participant = payload as ImRtcParticipantDisconnectedNotification
      rtcStore.applyParticipantDisconnected(participant)
      if (participant.room === rtcStore.call?.room) {
        syncParticipant(participant.userId, false)
      }
      return
    }
    const notification = payload as ImRtcCallNotification
    if (notification.status === ImRtcParticipantStatus.INVITING) {
      if (rtcStore.isActive || notification.inviterUserId === userStore.userInfo.userId) {
        return
      }
      if (!supportsRtc()) {
        await rejectCall(notification.room)
        return
      }
      rtcStore.showIncoming(notification)
      openCallPage()
      return
    }
    if (notification.status === ImRtcParticipantStatus.REJECTED) {
      rtcStore.applyParticipantRejected(notification)
      syncUnavailableParticipant(notification)
      return
    }
    if (notification.status === ImRtcParticipantStatus.NO_ANSWER) {
      rtcStore.applyParticipantNoAnswer(notification)
      syncUnavailableParticipant(notification)
      return
    }
    if (notification.room === rtcStore.call?.room
      && notification.status === ImRtcParticipantStatus.JOINED
      && rtcStore.stage === ImRtcCallStage.INVITING
      && rtcStore.call) {
      rtcStore.enterRunning(rtcStore.call)
    }
  }

  /** 应用通话结束通知 */
  function end(room?: string, groupId?: number) {
    if (groupId) {
      rtcStore.removeGroupCall(groupId, room)
    }
    if (!room || room === rtcStore.call?.room || room === rtcStore.incomingPayload?.room) {
      rtcStore.reset()
    }
  }

  return {
    ...storeToRefs(rtcStore),
    start,
    join,
    accept,
    reject,
    hangup,
    invite,
    syncParticipant,
    receiveSignal,
    end,
    reset: rtcStore.reset,
  }
}
