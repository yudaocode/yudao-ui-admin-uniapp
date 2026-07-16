<template>
  <view class="rtc-participant-tile">
    <!-- #ifdef H5 -->
    <view ref="videoHostRef" class="absolute inset-0" />
    <view ref="audioHostRef" class="hidden" />
    <!-- #endif -->

    <view v-if="!videoTrack" class="flex flex-1 items-center justify-center">
      <ImAvatar :src="member.avatar" :name="member.nickname" size="128rpx" />
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
import { onBeforeUnmount, ref, watch } from 'vue'
import ImAvatar from '../../../../components/im-avatar.vue'

const props = defineProps<{
  member: GroupCallMember // 参与者资料及接入状态
  isLocal: boolean // 是否当前用户
  videoTrack?: Track // 摄像头或屏幕共享轨道
  audioTrack?: Track // 远端音频轨道
  speakerEnabled: boolean // 是否播放远端音频
}>()

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
