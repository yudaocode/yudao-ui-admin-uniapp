<template>
  <view class="rtc-page">
    <!-- 视频画面 -->
    <view id="rtc-media-stage" class="rtc-media-stage" />

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

      <RtcCallParticipantList v-if="isGroup" :members="participantMembers" />
    </view>

    <!-- 来电操作 -->
    <RtcCallIncoming
      v-if="stage === ImRtcCallStage.INCOMING"
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
import type { GroupMember } from '../../../types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getMemberDisplayName as getMemberName } from '@/pages-im/utils/user'
import { RTC_NO_ANSWER_CALL_CHECK_INTERVAL_MS } from '@/pages-im/utils/config'
import { formatCallDuration } from '@/pages-im/utils/time'
import { noAnswerCallCheck } from '@/api/im/rtc'
import { useUserStore } from '@/store/user'
import { useImRtc } from '../../../composables/useImRtc'
import { useLiveKitRoom } from '../../../composables/useLiveKitRoom'
import { useGroupCallMembers } from '../../../composables/useGroupCallMembers'
import { useGroupStore } from '../../../store/groupStore'
import { useRtcStore } from '../../../store/rtcStore'
import { useImRuntimeStore } from '../../../store/runtimeStore'
import { CommonStatusEnum, ImConversationType, ImRtcCallMediaType, ImRtcCallStage } from '@/pages-im/utils/constants'
import ImAvatar from '../../../components/im-avatar.vue'
import RtcCallControls from './components/rtc-call-controls.vue'
import RtcCallIncoming from './components/rtc-call-incoming.vue'
import RtcCallParticipantList from './components/rtc-call-participant-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

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
  reject,
  hangup,
  invite,
} = useImRtc()
const groupMembers = ref<GroupMember[]>([]) // 群通话成员
const elapsed = ref(0) // 通话时长
let durationTimer: ReturnType<typeof setInterval> | undefined
let noAnswerTimer: ReturnType<typeof setInterval> | undefined
let cleanupStarted = false
let pageLeaving = false

/** 是否视频通话 */
const isVideo = computed(() =>
  (call.value?.mediaType || incomingPayload.value?.mediaType) === ImRtcCallMediaType.VIDEO)
const {
  micEnabled,
  cameraEnabled,
  speakerEnabled,
  reconnecting,
  screenShareEnabled,
  connectRoom,
  toggleScreenShare,
  toggleMic,
  toggleCamera,
  disposeRoom,
} = useLiveKitRoom({
  isVideo,
  onConnectFailed: handleHangup,
  onRoomDisconnected: handleHangup,
})
const isGroup = computed(() => call.value?.conversationType === ImConversationType.GROUP) // 是否群通话
const currentUserId = computed(() => userStore.userInfo.userId) // 当前用户编号
const groupId = computed(() => call.value?.groupId) // 当前群编号
const inviterId = computed(() => call.value?.inviterId) // 当前通话发起人
const participantMembers = useGroupCallMembers(groupId, inviterId)
const participantUserIds = computed(() => participantMembers.value.map(item => item.userId)) // 已加入或邀请中的成员
const inviteCandidates = computed(() => groupMembers.value
  .filter(item => item.status !== CommonStatusEnum.DISABLE
    && item.userId !== currentUserId.value
    && !participantUserIds.value.includes(item.userId)
    && !rtcStore.isUserLeft(call.value?.room || '', item.userId))
  .map(item => ({ ...item, displayUserName: getMemberName(item) }))) // 可追加邀请成员

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
  const currentCall = call.value
  const currentGroupId = currentCall?.groupId
  const currentRoom = currentCall?.room
  const userId = userStore.userInfo.userId
  if (!currentGroupId) {
    groupMembers.value = []
    return
  }
  const rows = await groupStore.fetchGroupMemberList(currentGroupId)
  if (pageLeaving
    || userStore.userInfo.userId !== userId
    || call.value?.groupId !== currentGroupId
    || call.value?.room !== currentRoom) {
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
  await accept()
  await connectRoom()
}

/** 拒绝 */
async function handleReject() {
  await reject()
}

/** 幂等结束通话 */
async function cleanupCall() {
  if (cleanupStarted) {
    return
  }
  cleanupStarted = true
  await disposeRoom()
  await hangup()
}

/** 挂断 */
async function handleHangup() {
  await cleanupCall()
}

/** 通话结束后返回 */
async function handleRtcEnded() {
  if (!cleanupStarted) {
    cleanupStarted = true
    await disposeRoom()
  }
  if (!pageLeaving) {
    pageLeaving = true
    uni.navigateBack()
  }
}

/** 刷新通话时长 */
function refreshDuration() {
  elapsed.value = startedAt.value ? Math.max(0, Math.floor((Date.now() - startedAt.value) / 1000)) : 0
}

/** 触发服务端未应答检查 */
function checkNoAnswer() {
  if (!call.value?.room || !(call.value.inviteeIds || []).length) {
    return
  }
  void noAnswerCallCheck(call.value.room).catch(() => undefined)
}

watch(() => call.value?.token, () => connectRoom())
watch(() => call.value?.groupId, loadGroupMembers, { immediate: true })

/** 初始化通话页 */
onMounted(() => {
  void useImRuntimeStore().ensure()
  if (stage.value === ImRtcCallStage.IDLE) {
    uni.navigateBack()
    return
  }
  connectRoom()
  refreshDuration()
  durationTimer = setInterval(refreshDuration, 1000)
  noAnswerTimer = setInterval(checkNoAnswer, RTC_NO_ANSWER_CALL_CHECK_INTERVAL_MS)
  uni.$on('im:rtc-ended', handleRtcEnded)
})

/** 系统返回或侧滑退出时兜底结束通话 */
onUnload(() => {
  pageLeaving = true
  void cleanupCall()
})

/** 释放本地媒体资源 */
onUnmounted(() => {
  if (durationTimer) {
    clearInterval(durationTimer)
  }
  if (noAnswerTimer) {
    clearInterval(noAnswerTimer)
  }
  uni.$off('im:rtc-ended', handleRtcEnded)
  void cleanupCall()
})
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

.rtc-media-stage[data-video-count='1'] {
  grid-template-columns: 1fr;
}

:global(.rtc-video-track) {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
}

:global(.rtc-audio-track) {
  display: none;
}
</style>
