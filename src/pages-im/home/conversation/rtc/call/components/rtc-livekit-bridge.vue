<template>
  <!-- App 通话媒体桥：逻辑层只下发目标状态，LiveKit 在 renderjs 视图层运行 -->
  <!-- `livekit` 是 renderjs 模块名，由 uni 编译器解析为视图层方法；Volar 按组件实例属性检查，无法识别该绑定 -->
  <!-- @vue-expect-error renderjs 模块绑定不属于组件实例类型 -->
  <view class="hidden" :prop="state" :change:prop="livekit.applyState">
    <view id="rtc-livekit-audio-host" />
  </view>
</template>

<script lang="ts">
import type { RtcLiveKitBridgeEvent, RtcLiveKitBridgeState } from '../../../../composables/useLiveKitAppRoom'
import { computed, defineComponent, inject } from 'vue'
import { RTC_LIVEKIT_BRIDGE_KEY } from '../../../../composables/useLiveKitAppRoom'

const IDLE_STATE: RtcLiveKitBridgeState = { // 空闲目标：uni 把 nullish 属性当作移除且不触发 change:prop，空闲时也下发非空对象
  livekitUrl: '',
  token: '',
  micEnabled: false,
  cameraEnabled: false,
  speakerEnabled: false,
}

// renderjs 不支持 script setup，ownerInstance.callMethod 只能调用 Options API methods
export default defineComponent({
  setup() {
    const bridge = inject(RTC_LIVEKIT_BRIDGE_KEY)
    if (!bridge) {
      throw new Error('rtc-livekit-bridge 需在通话容器内使用')
    }
    return {
      state: computed(() => bridge.state.value ?? IDLE_STATE), // 逻辑层无目标时映射为空 token 的空闲状态
      handleEvent: bridge.handleEvent,
    }
  },
  methods: {
    /** 接收 renderjs 视图层事件 */
    onRenderEvent(event: RtcLiveKitBridgeEvent) {
      this.handleEvent(event)
    },
  },
})
</script>

<script module="livekit" lang="renderjs">
import { parseId } from '@/utils/id'
const AUDIO_HOST_ID = 'rtc-livekit-audio-host' // 远端音频元素容器
const VIDEO_HOST_PREFIX = 'rtc-video-host-' // 与 rtc-call-participant-tile 的视频容器 id 保持一致
const VIDEO_HOST_RETRY_FRAMES = 30 // 等待 Tile 视频容器渲染的最多帧数

/** 视图层 LiveKit 房间；renderjs 无卸载钩子，释放由逻辑层清空目标状态驱动 */
export default {
  created() {
    this.target = undefined // 逻辑层目标状态
    this.sdk = undefined // LiveKit SDK，首次连接时加载
    this.room = undefined // 当前房间
    this.roomToken = undefined // 当前房间 token
    this.loadingToken = undefined // 正在加载 SDK 的目标 token
    this.connected = false // 当前房间是否已连接
    this.releaseTask = undefined // 房间释放任务
    this.deviceTask = undefined // 设备切换串行任务
    this.videoElements = new Map() // userId -> 视频轨道与元素
    this.audioElements = new Map() // trackSid -> 远端音频轨道与元素
    this.unlockAudio = undefined // 等待用户轻触后恢复音频播放
  },
  methods: {
    /** 接收逻辑层目标状态；空 token 为空闲状态，释放房间而不是连接 */
    applyState(state) {
      this.target = state && state.token ? state : undefined
      this.reconcile()
    },

    /** 回传逻辑层事件 */
    sendEvent(event) {
      const ownerInstance = this.$ownerInstance
      if (ownerInstance) {
        ownerInstance.callMethod('onRenderEvent', event)
      }
    },

    /** 让房间与目标状态一致 */
    reconcile() {
      if (this.releaseTask) {
        return
      }
      const target = this.target
      if (this.room && (!target || target.token !== this.roomToken)) {
        this.releaseRoom()
        return
      }
      if (this.room) {
        this.applyDevices()
        this.applySpeaker()
        this.placeVideos(VIDEO_HOST_RETRY_FRAMES)
        return
      }
      if (this.loadingToken) {
        return
      }
      if (target) {
        void this.connectRoom(target)
        return
      }
      this.sendEvent({ type: 'disposed' })
    },

    /** 连接房间并发布本地音视频 */
    async connectRoom(target) {
      if (!window.RTCPeerConnection || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.target = undefined
        this.sendEvent({ type: 'connect-failed', reason: 'unsupported' })
        return
      }
      this.loadingToken = target.token
      try {
        this.sdk = this.sdk || await import('livekit-client')
      } catch {
        this.sdk = undefined
      }
      this.loadingToken = undefined
      if (!this.target || this.target.token !== target.token || this.room) {
        this.reconcile()
        return
      }
      if (!this.sdk) {
        this.target = undefined
        this.sendEvent({ type: 'connect-failed', reason: 'error' })
        return
      }
      const room = new this.sdk.Room({ adaptiveStream: true, dynacast: true })
      this.room = room
      this.roomToken = target.token
      this.connected = false
      this.bindRoomEvents(room)
      try {
        await room.connect(target.livekitUrl, target.token)
        if (this.room !== room) {
          return
        }
        this.connected = true
        await room.localParticipant.setMicrophoneEnabled(this.target.micEnabled)
        if (this.room !== room) {
          return
        }
        if (this.target.cameraEnabled) {
          await room.localParticipant.setCameraEnabled(true)
          if (this.room !== room) {
            return
          }
        }
        this.sendEvent({
          type: 'connected',
          micEnabled: room.localParticipant.isMicrophoneEnabled,
          cameraEnabled: room.localParticipant.isCameraEnabled,
        })
        this.syncMedia()
        this.reconcile()
      } catch (error) {
        if (this.room !== room) {
          return
        }
        this.clearRoom(room)
        this.target = undefined
        try {
          await room.disconnect()
        } catch {
          // 连接失败后的断开异常不影响结束通话
        }
        this.sendEvent({
          type: 'connect-failed',
          reason: error && error.name === 'NotAllowedError' ? 'permission' : 'error',
        })
      }
    },

    /** 绑定房间事件；失效房间的事件直接忽略 */
    bindRoomEvents(room) {
      const { RoomEvent } = this.sdk
      const isCurrentRoom = () => this.room === room
      const syncMedia = () => { // LiveKit 在清空 publication.track、移除 publication 前同步派发退订等事件，待本轮变更完成后再按房间现状刷新
        if (!isCurrentRoom()) {
          return
        }
        Promise.resolve().then(() => {
          if (isCurrentRoom()) {
            this.syncMedia()
          }
        })
      }
      room
        .on(RoomEvent.TrackSubscribed, syncMedia)
        .on(RoomEvent.TrackUnsubscribed, syncMedia)
        .on(RoomEvent.TrackMuted, syncMedia)
        .on(RoomEvent.TrackUnmuted, syncMedia)
        .on(RoomEvent.LocalTrackPublished, syncMedia)
        .on(RoomEvent.LocalTrackUnpublished, syncMedia)
        .on(RoomEvent.ParticipantConnected, (participant) => {
          const userId = parseId(participant.identity)
          if (isCurrentRoom() && userId) {
            this.sendEvent({ type: 'participant', userId, joined: true })
          }
        })
        .on(RoomEvent.ParticipantDisconnected, (participant) => {
          const userId = parseId(participant.identity)
          if (isCurrentRoom() && userId) {
            this.sendEvent({ type: 'participant', userId, joined: false })
            syncMedia()
          }
        })
        .on(RoomEvent.Reconnecting, () => {
          if (isCurrentRoom()) {
            this.sendEvent({ type: 'reconnecting' })
          }
        })
        .on(RoomEvent.Reconnected, () => {
          if (isCurrentRoom()) {
            this.sendEvent({ type: 'reconnected' })
          }
        })
        .on(RoomEvent.AudioPlaybackStatusChanged, () => {
          if (isCurrentRoom() && !room.canPlaybackAudio) {
            this.waitAudioUnlock(room)
            this.sendEvent({ type: 'audio-blocked' })
          }
        })
        .on(RoomEvent.Disconnected, () => {
          if (!isCurrentRoom() || !this.connected) {
            return
          }
          this.clearRoom(room)
          this.target = undefined
          this.sendEvent({ type: 'disconnected' })
        })
    },

    /** 主动释放房间：断开连接、停止本地采集并移除媒体元素 */
    releaseRoom() {
      const room = this.room
      this.clearRoom(room)
      this.releaseTask = (async () => {
        try {
          await room.disconnect()
        } catch {
          // 断开失败时媒体元素已移除，继续收敛目标状态
        }
        this.releaseTask = undefined
        this.reconcile()
      })()
    },

    /** 清空房间引用及视图层媒体元素 */
    clearRoom(room) {
      room.removeAllListeners()
      this.room = undefined
      this.roomToken = undefined
      this.connected = false
      this.deviceTask = undefined
      this.videoElements.forEach(item => this.detachElement(item))
      this.videoElements.clear()
      this.audioElements.forEach(item => this.detachElement(item))
      this.audioElements.clear()
      if (this.unlockAudio) {
        document.removeEventListener('touchend', this.unlockAudio, true)
        this.unlockAudio = undefined
      }
    },

    /** 卸载媒体元素 */
    detachElement(item) {
      item.track.detach(item.element)
      item.element.remove()
    },

    /** 串行同步麦克风、摄像头到目标状态 */
    applyDevices() {
      const room = this.room
      if (!room || !this.connected) {
        return
      }
      this.deviceTask = (this.deviceTask || Promise.resolve())
        .then(() => this.syncDevice(room, 'mic'))
        .then(() => this.syncDevice(room, 'camera'))
    },

    /** 同步单个本地设备 */
    async syncDevice(room, device) {
      if (this.room !== room || !this.target) {
        return
      }
      const participant = room.localParticipant
      const current = device === 'mic' ? participant.isMicrophoneEnabled : participant.isCameraEnabled
      const enabled = device === 'mic' ? this.target.micEnabled : this.target.cameraEnabled
      if (current === enabled) {
        return
      }
      try {
        if (device === 'mic') {
          await participant.setMicrophoneEnabled(enabled)
        } else {
          await participant.setCameraEnabled(enabled)
        }
        if (this.room === room) {
          this.sendEvent({ type: 'device', device, enabled })
        }
      } catch {
        if (this.room === room) {
          this.sendEvent({ type: 'device-failed', device, enabled: current })
        }
      }
    },

    /** 同步远端音频播放开关 */
    applySpeaker() {
      const muted = !this.target || !this.target.speakerEnabled
      this.audioElements.forEach((item) => {
        item.element.muted = muted
      })
    },

    /** 选择参与者展示的视频轨道；屏幕共享优先，其次摄像头 */
    pickVideoTrack(participant) {
      const { Track } = this.sdk
      const screenShare = participant.getTrackPublication(Track.Source.ScreenShare)
      if (screenShare && screenShare.track && !screenShare.isMuted) {
        return screenShare.track
      }
      const camera = participant.getTrackPublication(Track.Source.Camera)
      return camera && camera.track && !camera.isMuted ? camera.track : undefined
    },

    /** 按房间现状重建视图层媒体元素，并回传参与者媒体状态 */
    syncMedia() {
      const room = this.room
      if (!room || !this.connected) {
        return
      }
      const { Track } = this.sdk
      const videoTracks = new Map()
      const audioTracks = new Map()
      const participants = []
      const localParticipant = room.localParticipant
      const roomParticipants = [localParticipant, ...room.remoteParticipants.values()]
      roomParticipants.forEach((participant) => {
        const userId = parseId(participant.identity)
        const publications = Array.from(participant.trackPublications.values())
        if (!userId || !publications.some(item => item.track)) {
          return
        }
        const isLocal = participant === localParticipant
        const videoTrack = this.pickVideoTrack(participant)
        if (videoTrack) {
          videoTracks.set(userId, videoTrack)
        }
        const microphone = participant.getTrackPublication(Track.Source.Microphone)
        if (!isLocal && microphone && microphone.track && !microphone.isMuted) {
          audioTracks.set(microphone.trackSid, microphone.track)
        }
        participants.push({ userId, isLocal, videoVisible: !!videoTrack })
      })
      this.videoElements.forEach((item, userId) => {
        if (videoTracks.get(userId) !== item.track) {
          this.detachElement(item)
          this.videoElements.delete(userId)
        }
      })
      videoTracks.forEach((track, userId) => {
        if (!this.videoElements.has(userId)) {
          const element = track.attach()
          element.autoplay = true
          element.playsInline = true
          element.className = 'rtc-video-track'
          this.videoElements.set(userId, { track, element })
        }
      })
      this.audioElements.forEach((item, trackSid) => {
        if (audioTracks.get(trackSid) !== item.track) {
          this.detachElement(item)
          this.audioElements.delete(trackSid)
        }
      })
      const audioHost = document.getElementById(AUDIO_HOST_ID) || document.body
      audioTracks.forEach((track, trackSid) => {
        if (!this.audioElements.has(trackSid)) {
          const element = track.attach()
          element.autoplay = true
          element.className = 'rtc-audio-track'
          audioHost.appendChild(element)
          this.audioElements.set(trackSid, { track, element })
        }
      })
      this.applySpeaker()
      this.sendEvent({ type: 'media', participants })
      this.placeVideos(VIDEO_HOST_RETRY_FRAMES)
    },

    /** 把视频元素挂到对应 Tile 容器；Tile 由逻辑层渲染，未就绪时按帧重试 */
    placeVideos(retryFrames) {
      let pending = false
      this.videoElements.forEach((item, userId) => {
        const host = document.getElementById(VIDEO_HOST_PREFIX + userId)
        if (!host) {
          pending = true
          return
        }
        if (item.element.parentNode !== host) {
          host.replaceChildren(item.element)
        }
      })
      if (pending && retryFrames > 0) {
        requestAnimationFrame(() => this.placeVideos(retryFrames - 1))
      }
    },

    /** 自动播放受限时，等待用户下一次轻触恢复远端音频 */
    waitAudioUnlock(room) {
      if (this.unlockAudio) {
        return
      }
      const unlock = () => {
        document.removeEventListener('touchend', unlock, true)
        this.unlockAudio = undefined
        if (this.room === room) {
          room.startAudio().catch(() => undefined)
        }
      }
      this.unlockAudio = unlock
      document.addEventListener('touchend', unlock, true)
    },
  },
}
</script>
