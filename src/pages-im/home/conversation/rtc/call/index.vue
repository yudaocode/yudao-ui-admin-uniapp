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

      <!-- 群通话成员 -->
      <scroll-view v-if="isGroup && participantMembers.length" scroll-x class="mt-30rpx max-w-full whitespace-nowrap">
        <view class="inline-flex gap-22rpx px-16rpx">
          <view v-for="item in participantMembers" :key="item.userId" class="w-104rpx flex flex-col items-center">
            <view class="relative">
              <ImAvatar :src="item.avatar" :name="item.nickname" size="76rpx" />
              <view
                class="absolute bottom-0 right-0 h-18rpx w-18rpx border-3rpx border-[#263239] rounded-full"
                :class="item.pending ? 'bg-[#f0ad4e]' : 'bg-[#07c160]'"
              />
            </view>
            <text class="mt-8rpx w-full truncate text-center text-21rpx text-white/80">{{ item.nickname }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 来电操作 -->
    <view
      v-if="stage === ImRtcCallStage.INCOMING"
      class="relative z-2 grid grid-cols-2 gap-100rpx px-100rpx pb-[calc(100rpx+env(safe-area-inset-bottom))]"
    >
      <view class="flex flex-col items-center gap-18rpx" @click="handleReject">
        <view class="rtc-action bg-[#fa5151]">
          <wd-icon name="close" size="52rpx" color="#fff" />
        </view>
        <text class="text-26rpx text-white">拒绝</text>
      </view>
      <view class="flex flex-col items-center gap-18rpx" @click="handleAccept">
        <view class="rtc-action bg-[#07c160]">
          <wd-icon name="phone" size="52rpx" color="#fff" />
        </view>
        <text class="text-26rpx text-white">接听</text>
      </view>
    </view>

    <!-- 呼叫中 / 通话中操作 -->
    <view v-else class="relative z-2 pb-[calc(72rpx+env(safe-area-inset-bottom))]">
      <view class="mb-56rpx flex flex-wrap justify-center gap-x-40rpx gap-y-28rpx px-32rpx">
        <view class="flex flex-col items-center gap-14rpx" @click="toggleMic">
          <view class="rtc-tool" :class="micEnabled ? 'bg-white/20' : 'bg-white text-[#222]'">
            <wd-icon name="mic" size="44rpx" :color="micEnabled ? '#fff' : '#222'" />
          </view>
          <text class="text-24rpx text-white">{{ micEnabled ? '静音' : '取消静音' }}</text>
        </view>
        <view v-if="isVideo" class="flex flex-col items-center gap-14rpx" @click="toggleCamera">
          <view class="rtc-tool" :class="cameraEnabled ? 'bg-white/20' : 'bg-white text-[#222]'">
            <wd-icon name="camera" size="44rpx" :color="cameraEnabled ? '#fff' : '#222'" />
          </view>
          <text class="text-24rpx text-white">{{ cameraEnabled ? '关闭摄像头' : '打开摄像头' }}</text>
        </view>
        <view class="flex flex-col items-center gap-14rpx" @click="speakerEnabled = !speakerEnabled">
          <view class="rtc-tool" :class="speakerEnabled ? 'bg-white/20' : 'bg-white text-[#222]'">
            <wd-icon name="sound-fill" size="44rpx" :color="speakerEnabled ? '#fff' : '#222'" />
          </view>
          <text class="text-24rpx text-white">扬声器</text>
        </view>
        <view v-if="isGroup && stage === ImRtcCallStage.RUNNING" class="flex flex-col items-center gap-14rpx" @click="openInvitePicker">
          <view class="rtc-tool bg-white/20">
            <wd-icon name="add" size="44rpx" color="#fff" />
          </view>
          <text class="text-24rpx text-white">邀请成员</text>
        </view>
        <!-- #ifdef H5 -->
        <view v-if="stage === ImRtcCallStage.RUNNING" class="flex flex-col items-center gap-14rpx" @click="toggleScreenShare">
          <view class="rtc-tool" :class="screenShareEnabled ? 'bg-white text-[#222]' : 'bg-white/20'">
            <wd-icon name="computer" size="44rpx" :color="screenShareEnabled ? '#222' : '#fff'" />
          </view>
          <text class="text-24rpx text-white">{{ screenShareEnabled ? '停止共享' : '共享屏幕' }}</text>
        </view>
        <!-- #endif -->
      </view>
      <view class="flex flex-col items-center gap-18rpx" @click="handleHangup">
        <view class="rtc-action bg-[#fa5151]">
          <wd-icon name="close" size="52rpx" color="#fff" />
        </view>
        <text class="text-26rpx text-white">{{ stage === ImRtcCallStage.INVITING ? '取消' : '挂断' }}</text>
      </view>
    </view>

    <!-- 通话中邀请成员 -->
    <wd-select-picker
      ref="invitePickerRef"
      :model-value="[]"
      title="邀请群成员"
      :columns="inviteCandidates"
      value-key="userId"
      label-key="displayUserName"
      type="checkbox"
      filterable
      root-portal
      @confirm="handleInviteConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
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

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
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
const invitePickerRef = ref<SelectPickerInstance>() // 邀请成员选择器
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
const currentUserId = computed(() => useUserStore().userInfo.userId) // 当前用户编号
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
  if (!call.value?.groupId) {
    groupMembers.value = []
    return
  }
  groupMembers.value = await useGroupStore().fetchGroupMemberList(call.value.groupId)
}

/** 打开追加邀请选择器 */
function openInvitePicker() {
  if (inviteCandidates.value.length === 0) {
    toast.show('暂无可邀请成员')
    return
  }
  invitePickerRef.value?.open()
}

/** 确认追加邀请 */
async function handleInviteConfirm({ value }: { value: number[] }) {
  const userIds = Array.isArray(value) ? value : []
  if (userIds.length === 0) {
    toast.show('请选择成员')
    return
  }
  await invite(userIds)
  toast.success('已发出邀请')
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

.rtc-action {
  width: 124rpx;
  height: 124rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.rtc-tool {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
</style>
