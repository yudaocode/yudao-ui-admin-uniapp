<template>
  <view class="rtc-page">
    <!-- 视频画面 -->
    <view
      id="rtc-media-stage"
      class="rtc-media-stage"
      :data-tile-count="mediaParticipants.length"
    >
      <RtcCallParticipantTile
        v-for="participant in mediaParticipants"
        :key="participant.userId"
        :member="participant"
        :is-local="participant.isLocal"
        :video-track="participant.videoTrack"
        :audio-track="participant.audioTrack"
        :speaker-enabled="speakerEnabled"
      />
    </view>

    <!-- 通话信息 -->
    <view class="relative z-2 flex flex-1 flex-col items-center px-48rpx pt-[calc(100rpx+env(safe-area-inset-top))]">
      <ImAvatar :src="peerAvatar" :name="peerNickname" size="168rpx" />
      <view class="line-clamp-1 mt-30rpx max-w-560rpx text-40rpx text-white font-medium">
        {{ peerNickname || '音视频通话' }}
      </view>
      <view class="mt-16rpx text-28rpx text-white/70">
        {{ statusText }}
      </view>
      <view v-if="reconnecting" class="mt-16rpx rounded-full bg-black/30 px-24rpx py-10rpx text-24rpx text-white">
        网络重连中…
      </view>
    </view>

    <!-- 来电操作 -->
    <RtcCallIncoming
      v-if="stage === ImRtcCallStage.INCOMING"
      :accepting="accepting"
      :rejecting="rejecting"
      @accept="handleAccept"
      @reject="handleReject"
    />

    <!-- 呼叫中 / 通话中操作 -->
    <RtcCallControls
      v-else
      :stage="stage"
      :is-group="isGroup"
      :is-video="isVideo"
      :mic-enabled="micEnabled"
      :camera-enabled="cameraEnabled"
      :speaker-enabled="speakerEnabled"
      :screen-share-enabled="screenShareEnabled"
      :invite-candidates="inviteCandidates"
      @hangup="handleHangup"
      @invite="handleInvite"
      @toggle-mic="toggleMic"
      @toggle-camera="toggleCamera"
      @toggle-speaker="toggleSpeaker"
      @toggle-screen-share="toggleScreenShare"
    />
  </view>
</template>

<script lang="ts" setup>
import type { GroupMember } from '../../../../types'
import type { RtcParticipantTracks } from '../../../../composables/useLiveKitRoom'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  getMemberDisplayName as getMemberName,
  getSenderAvatar,
  getSenderDisplayName,
} from '@/pages-im/utils/user'
import { RTC_NO_ANSWER_CALL_CHECK_INTERVAL_MS } from '@/pages-im/utils/config'
import { formatCallDuration } from '@/pages-im/utils/time'
import { noAnswerCallCheck } from '@/api/im/rtc'
import { useUserStore } from '@/store/user'
import { useImRtc } from '../../../../composables/useImRtc'
import { useLiveKitRoom } from '../../../../composables/useLiveKitRoom'
import { useGroupCallMembers } from '../../../../composables/useGroupCallMembers'
import { useGroupStore } from '../../../../store/groupStore'
import { useRtcStore } from '../../../../store/rtcStore'
import { useImRuntimeStore } from '../../../../store/runtimeStore'
import { CommonStatusEnum, ImConversationType, ImRtcCallMediaType, ImRtcCallStage } from '@/pages-im/utils/constants'
import ImAvatar from '../../../../components/im-avatar.vue'
import RtcCallControls from './rtc-call-controls.vue'
import RtcCallIncoming from './rtc-call-incoming.vue'
import RtcCallParticipantTile from './rtc-call-participant-tile.vue'

const emit = defineEmits<{
  ended: [] // 通话结束
}>()

const toast = useToast()
const userStore = useUserStore()
const groupStore = useGroupStore()
const rtcStore = useRtcStore()
const {
  stage,
  call,
  incomingPayload,
  peerNickname,
  peerAvatar,
  startedAt,
  accept,
  hangup,
  invite,
} = useImRtc()
const groupMembers = ref<GroupMember[]>([]) // 群通话成员
const elapsed = ref(0) // 通话时长
const accepting = ref(false) // 接听进行状态
const rejecting = ref(false) // 拒绝进行状态
let durationTimer: ReturnType<typeof setInterval> | undefined
let noAnswerTimer: ReturnType<typeof setInterval> | undefined
let pageLeaving = false
let releaseTask: Promise<void> | undefined
let finishTask: Promise<void> | undefined
let localEndContext: ReturnType<typeof snapshotEndContext> | undefined
let endedEmitted = false

/** 是否视频通话 */
const isVideo = computed(() =>
  (call.value?.mediaType || incomingPayload.value?.mediaType) === ImRtcCallMediaType.VIDEO)
const isGroup = computed(() => // 是否群通话
  (call.value?.conversationType ?? incomingPayload.value?.conversationType) === ImConversationType.GROUP)
const initialCameraEnabled = computed(() => isVideo.value && !isGroup.value) // 私聊视频默认开启摄像头
const {
  micEnabled,
  cameraEnabled,
  speakerEnabled,
  reconnecting,
  screenShareEnabled,
  participantTracks,
  connectRoom,
  toggleScreenShare,
  toggleMic,
  toggleCamera,
  disposeRoom,
} = useLiveKitRoom({
  initialCameraEnabled,
  onConnectFailed: handleHangup,
  onRoomDisconnected: handleHangup,
})
const currentUserId = computed(() => userStore.userInfo.userId) // 当前用户编号
const groupId = computed(() => call.value?.groupId ?? incomingPayload.value?.groupId) // 当前群编号
const inviterId = computed(() => call.value?.inviterId ?? incomingPayload.value?.inviterUserId) // 当前通话发起人
const participantMembers = useGroupCallMembers(groupId, inviterId, groupMembers)
const participantUserIds = computed(() => participantMembers.value.map(item => item.userId)) // 已加入或邀请中的成员
const mediaParticipants = computed(() => { // 参与者资料与 LiveKit 轨道映射
  const trackByUserId = new Map(participantTracks.value.map(item => [item.userId, item]))
  const memberByUserId = new Map(participantMembers.value.map(item => [item.userId, item]))
  const userIds = new Set<number>([
    ...Array.from(memberByUserId.keys()),
    ...Array.from(trackByUserId.keys()),
  ])
  return Array.from(userIds).filter(Boolean).map((userId) => {
    const track = trackByUserId.get(userId)
    const member = memberByUserId.get(userId) ?? resolveParticipantMember(userId, track)
    return {
      ...member,
      pending: member.pending && !track,
      isLocal: track?.isLocal ?? userId === currentUserId.value,
      videoTrack: !track?.screenShareMuted && track?.screenShareTrack
        ? track.screenShareTrack
        : !track?.cameraMuted ? track?.cameraTrack : undefined,
      audioTrack: track?.audioMuted ? undefined : track?.audioTrack,
    }
  })
})
const inviteCandidates = computed(() => groupMembers.value
  .filter(item => item.status !== CommonStatusEnum.DISABLE
    && item.userId !== currentUserId.value
    && !participantUserIds.value.includes(item.userId)
    && !rtcStore.isUserLeft(call.value?.room || '', item.userId))
  .map(item => ({ ...item, displayUserName: getMemberName(item) }))) // 可追加邀请成员

/** 补齐轨道参与者资料 */
function resolveParticipantMember(userId: number, track?: RtcParticipantTracks) {
  const groupMember = groupMembers.value.find(item => item.userId === userId)
  if (groupMember) {
    return {
      userId,
      nickname: getMemberName(groupMember),
      avatar: groupMember.avatar,
      pending: false,
    }
  }
  const isLocal = track?.isLocal ?? userId === currentUserId.value
  const remoteNickname = isGroup.value
    ? getSenderDisplayName(userId, ImConversationType.GROUP, groupId.value) || '通话成员'
    : peerNickname.value || '通话成员'
  return {
    userId,
    nickname: isLocal ? userStore.userInfo.nickname || '我' : remoteNickname,
    avatar: isLocal
      ? userStore.userInfo.avatar
      : isGroup.value
        ? getSenderAvatar(userId, ImConversationType.GROUP, groupId.value || 0) || undefined
        : peerAvatar.value || undefined,
    pending: false,
  }
}

/** 通话状态文案 */
const statusText = computed(() => {
  if (stage.value === ImRtcCallStage.INCOMING) {
    return isVideo.value ? '邀请你进行视频通话' : '邀请你进行语音通话'
  }
  if (stage.value === ImRtcCallStage.INVITING) {
    return '正在等待对方接听…'
  }
  return formatCallDuration(elapsed.value)
})

/** 加载群通话成员 */
async function loadGroupMembers() {
  const currentGroupId = call.value?.groupId ?? incomingPayload.value?.groupId
  const currentRoom = call.value?.room ?? incomingPayload.value?.room
  const userId = userStore.userInfo.userId
  if (!currentGroupId) {
    groupMembers.value = []
    return
  }
  const rows = await groupStore.fetchGroupMemberList(currentGroupId)
  if (pageLeaving
    || userStore.userInfo.userId !== userId
    || (call.value?.groupId ?? incomingPayload.value?.groupId) !== currentGroupId
    || (call.value?.room ?? incomingPayload.value?.room) !== currentRoom) {
    return
  }
  groupMembers.value = rows
}

/** 追加邀请群成员 */
async function handleInvite(userIds: number[]) {
  if (await invite(userIds)) {
    toast.success('已发出邀请')
  }
}

/** 切换扬声器 */
function toggleSpeaker() {
  speakerEnabled.value = !speakerEnabled.value
}

/** 接听 */
async function handleAccept() {
  if (accepting.value || rejecting.value) {
    return
  }
  const context = {
    accountId: userStore.userInfo.userId,
    room: incomingPayload.value?.room || '',
  }
  accepting.value = true
  try {
    if (!await accept()) {
      return
    }
    const acceptedRoom = call.value?.room || ''
    if (pageLeaving
      || finishTask
      || userStore.userInfo.userId !== context.accountId
      || !context.room
      || acceptedRoom !== context.room
      || stage.value !== ImRtcCallStage.RUNNING) {
      if (acceptedRoom === context.room && stage.value !== ImRtcCallStage.IDLE) {
        await hangup()
      }
      return
    }
    await connectRoom()
  } finally {
    accepting.value = false
  }
}

/** 拒绝 */
async function handleReject() {
  if (rejecting.value || accepting.value) {
    return
  }
  rejecting.value = true
  try {
    await finishCall('local')
  } finally {
    rejecting.value = false
  }
}

/** 快照当前通话结束上下文 */
function snapshotEndContext() {
  return {
    room: call.value?.room || incomingPayload.value?.room || '',
    stage: stage.value,
  }
}

/** 释放本地媒体、计时器与事件订阅 */
function releaseLocalResources() {
  if (!releaseTask) {
    releaseTask = (async () => {
      if (durationTimer) {
        clearInterval(durationTimer)
        durationTimer = undefined
      }
      if (noAnswerTimer) {
        clearInterval(noAnswerTimer)
        noAnswerTimer = undefined
      }
      uni.$off('im:rtc-ended', handleRtcEnded)
      await disposeRoom()
    })()
  }
  return releaseTask
}

/** 只向路由壳发送一次结束事件 */
function emitEnded() {
  if (!endedEmitted) {
    endedEmitted = true
    emit('ended')
  }
}

/** 统一结束通话；远端结束只释放本地资源，不反向发送信令 */
function finishCall(source: 'local' | 'remote' | 'page-unload') {
  if (finishTask) {
    return finishTask
  }
  const snapshot = snapshotEndContext()
  if (source !== 'remote' && snapshot.room && snapshot.stage !== ImRtcCallStage.IDLE) {
    localEndContext = snapshot
  }
  pageLeaving = true
  finishTask = (async () => {
    if (localEndContext) {
      await Promise.allSettled([releaseLocalResources(), hangup()])
    } else {
      await releaseLocalResources()
    }
    if (source !== 'page-unload') {
      emitEnded()
    }
  })()
  return finishTask
}

/** 挂断 */
async function handleHangup() {
  await finishCall('local')
}

/** Store 进入空闲：本地结束时是 reset 回声，远端结束时才驱动收尾 */
function handleRtcEnded() {
  if (localEndContext) {
    return
  }
  void finishCall('remote')
}

/** 刷新通话时长 */
function refreshDuration() {
  elapsed.value = startedAt.value ? Math.max(0, Math.floor((Date.now() - startedAt.value) / 1000)) : 0
}

/** 触发服务端未应答检查 */
function checkNoAnswer() {
  const source = call.value ?? incomingPayload.value
  if (!source?.room || !(source.inviteeIds || []).length) {
    return
  }
  void noAnswerCallCheck(source.room).catch(() => undefined)
}

watch(() => call.value?.token, () => connectRoom())
watch(groupId, loadGroupMembers, { immediate: true })

/** 初始化通话页 */
onMounted(() => {
  void useImRuntimeStore().ensure()
  if (stage.value === ImRtcCallStage.IDLE) {
    pageLeaving = true
    emitEnded()
    return
  }
  connectRoom()
  refreshDuration()
  durationTimer = setInterval(refreshDuration, 1000)
  noAnswerTimer = setInterval(checkNoAnswer, RTC_NO_ANSWER_CALL_CHECK_INTERVAL_MS)
  uni.$on('im:rtc-ended', handleRtcEnded)
})

/** 页面卸载前兜底结束通话 */
function teardown() {
  return finishCall('page-unload')
}

/** 组件卸载时执行同一套幂等清理 */
onUnmounted(() => {
  void finishCall('page-unload')
})

defineExpose({ teardown })
</script>

<style lang="scss" scoped>
.rtc-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: radial-gradient(circle at 50% 30%, #4c5960, #182025 72%);
}

.rtc-media-stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(0, 1fr);
  gap: 4rpx;
  overflow: hidden;
}

.rtc-media-stage[data-tile-count='1'] {
  grid-template-columns: 1fr;
}
</style>
