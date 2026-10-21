<template>
  <view class="rtc-participant-tile">
    <!-- #ifdef H5 -->
    <view ref="videoHostRef" class="absolute inset-0" />
    <view ref="audioHostRef" class="hidden" />
    <!-- #endif -->
    <!-- App 视频由 rtc-livekit-bridge 在视图层按 id 挂载 -->
    <!-- #ifdef APP-PLUS -->
    <view :id="`rtc-video-host-${member.userId}`" class="absolute inset-0" />
    <!-- #endif -->
    <!-- 小程序由原生 live-pusher / live-player 经网关推拉流 -->
    <!-- #ifdef MP-WEIXIN -->
    <RtcMpStream :user-id="member.userId" :is-local="isLocal" :video-visible="!!videoVisible" />
    <!-- #endif -->

    <view v-if="!videoTrack && !videoVisible" class="flex flex-1 flex-col items-center justify-center">
      <ImAvatar :src="member.avatar" :name="member.nickname" size="128rpx" />
      <!-- 小程序网关的远端媒体状态；绿色圆点只表示已加入通话，不代表音视频已转发成功 -->
      <text v-if="mediaHint" class="mt-16rpx px-20rpx text-center text-22rpx text-white/75">
        {{ mediaHint }}
      </text>
    </view>

    <view class="absolute bottom-20rpx left-20rpx max-w-[calc(100%-40rpx)] flex items-center gap-10rpx rounded-full bg-black/45 px-14rpx py-8rpx">
      <view
        class="h-14rpx w-14rpx flex-shrink-0 rounded-full"
        :class="member.pending ? 'bg-[#f0ad4e]' : 'bg-[#07c160]'"
      />
      <text class="truncate text-22rpx text-white">
        {{ member.nickname }}{{ isLocal ? '（我）' : '' }}{{ member.pending ? ' · 接入中' : '' }}
      </text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Track } from 'livekit-client'
import type { GroupCallMember } from '../../../../composables/useGroupCallMembers'
import type { RtcMediaState } from '../../../../composables/useLiveKitRoom'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ImAvatar from '../../../../components/im-avatar.vue'
// #ifdef MP-WEIXIN
import RtcMpStream from './rtc-mp-stream.vue'
// #endif

const props = defineProps<{
  member: GroupCallMember // 参与者资料及接入状态
  isLocal: boolean // 是否当前用户
  videoTrack?: Track // 摄像头或屏幕共享轨道
  videoVisible?: boolean // App 视图层是否已展示视频
  mediaState?: RtcMediaState // 小程序网关下的远端媒体状态；H5 / App 不传
  audioTrack?: Track // 远端音频轨道
  speakerEnabled: boolean // 是否播放远端音频
}>()

const MEDIA_STATE_HINTS: Partial<Record<RtcMediaState, string>> = { // 远端媒体不可用时的提示；ready 为正常（含纯语音）不提示
  starting: '音视频连接中…',
  waiting: '对方暂未开启音视频',
  overflow: '超出小程序同时观看人数，暂不播放',
  capacity: '转发资源已满，稍后自动重试',
  failed: '音视频转发失败',
  unavailable: '音视频播放失败',
}

const mediaHint = computed(() => props.mediaState ? MEDIA_STATE_HINTS[props.mediaState] : undefined) // 媒体状态提示

const videoHostRef = ref<HTMLElement>() // 视频轨道容器
const audioHostRef = ref<HTMLElement>() // 音频轨道容器
let videoElement: HTMLMediaElement | undefined
let audioElement: HTMLMediaElement | undefined

/** 卸载指定媒体元素 */
function detachElement(track: Track | undefined, element: HTMLMediaElement | undefined) {
  if (!track || !element) {
    return
  }
  track.detach(element)
  element.remove()
}

/** 挂载参与者视频轨道 */
watch([() => props.videoTrack, videoHostRef], ([track, host], [oldTrack]) => {
  detachElement(oldTrack, videoElement)
  videoElement = undefined
  if (!track || !host) {
    return
  }
  const element = track.attach()
  element.autoplay = true
  element.className = 'rtc-video-track'
  host.replaceChildren(element)
  videoElement = element
}, { immediate: true, flush: 'post' })

/** 挂载参与者远端音频轨道 */
watch([() => props.audioTrack, audioHostRef, () => props.isLocal], ([track, host, isLocal], [oldTrack]) => {
  detachElement(oldTrack, audioElement)
  audioElement = undefined
  if (!track || !host || isLocal) {
    return
  }
  const element = track.attach()
  element.autoplay = true
  element.className = 'rtc-audio-track'
  element.muted = !props.speakerEnabled
  host.replaceChildren(element)
  audioElement = element
}, { immediate: true, flush: 'post' })

/** 同步扬声器开关 */
watch(() => props.speakerEnabled, (enabled) => {
  if (audioElement) {
    audioElement.muted = !enabled
  }
})

/** 释放当前 Tile 的媒体元素 */
onBeforeUnmount(() => {
  detachElement(props.videoTrack, videoElement)
  detachElement(props.audioTrack, audioElement)
})
</script>

<style scoped>
.rtc-participant-tile {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #2a3439;
}

:global(.rtc-video-track) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:global(.rtc-audio-track) {
  display: none;
}
</style>
