import type { Ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import { Room, RoomEvent, Track } from 'livekit-client'
import { useImRtc } from './useImRtc'

/** 管理 H5 LiveKit 房间及本地媒体设备 */
export function useLiveKitRoom(options: {
  isVideo: Readonly<Ref<boolean>>
  onConnectFailed: () => Promise<void>
  onRoomDisconnected: () => Promise<void>
}) {
  const toast = useToast()
  const { call, syncParticipant } = useImRtc()
  const micEnabled = ref(true) // 麦克风状态
  const cameraEnabled = ref(false) // 摄像头状态
  const speakerEnabled = ref(true) // 扬声器状态
  const reconnecting = ref(false) // 网络重连状态
  const screenShareEnabled = ref(false) // 屏幕共享状态
  let room: Room | undefined

  /** 释放已经失效的房间实例 */
  async function disconnectStaleRoom(staleRoom: Room) {
    staleRoom.removeAllListeners()
    try {
      await staleRoom.disconnect()
    } catch {
      // 失效实例断开失败时不影响当前房间
    }
  }

  /** 获取媒体容器 */
  function getMediaStage() {
    // #ifdef H5
    return document.getElementById('rtc-media-stage')
    // #endif
    return undefined
  }

  /** 刷新视频宫格数量 */
  function refreshMediaLayout() {
    const mediaStage = getMediaStage()
    if (mediaStage) {
      mediaStage.dataset.videoCount = String(mediaStage.querySelectorAll('video').length)
    }
  }

  /** 挂载 LiveKit 媒体轨道 */
  function attachTrack(track: Track) {
    // #ifdef H5
    const element = track.attach()
    element.autoplay = true
    element.className = track.kind === Track.Kind.Video ? 'rtc-video-track' : 'rtc-audio-track'
    if (element instanceof HTMLAudioElement) {
      element.muted = !speakerEnabled.value
    }
    getMediaStage()?.appendChild(element)
    refreshMediaLayout()
    // #endif
  }

  /** 清理媒体元素 */
  function clearMediaElements() {
    getMediaStage()?.querySelectorAll('video,audio').forEach(element => element.remove())
    refreshMediaLayout()
  }

  /** 连接 LiveKit 房间 */
  async function connectRoom() {
    // #ifndef H5
    toast.show('当前通话页面仅支持 H5')
    return
    // #endif
    if (!call.value?.token || !call.value.livekitUrl || room) {
      return
    }
    const currentRoom = new Room({ adaptiveStream: true, dynacast: true })
    let connected = false
    room = currentRoom
    currentRoom
      .on(RoomEvent.TrackSubscribed, track => attachTrack(track))
      .on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.track?.kind === Track.Kind.Video) {
          attachTrack(publication.track)
        }
      })
      .on(RoomEvent.LocalTrackUnpublished, (publication) => {
        publication.track?.detach().forEach(element => element.remove())
        refreshMediaLayout()
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach(element => element.remove())
        refreshMediaLayout()
      })
      .on(RoomEvent.ParticipantConnected, (participant) => {
        const userId = Number(participant.identity)
        if (userId) {
          syncParticipant(userId, true)
        }
      })
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        const userId = Number(participant.identity)
        if (userId) {
          syncParticipant(userId, false)
        }
      })
      .on(RoomEvent.Reconnecting, () => {
        reconnecting.value = true
      })
      .on(RoomEvent.Reconnected, () => {
        reconnecting.value = false
      })
      .on(RoomEvent.Disconnected, () => {
        if (room !== currentRoom || !connected) {
          return
        }
        room = undefined
        currentRoom.removeAllListeners()
        reconnecting.value = false
        micEnabled.value = true
        cameraEnabled.value = false
        speakerEnabled.value = true
        screenShareEnabled.value = false
        clearMediaElements()
        void options.onRoomDisconnected()
      })
    try {
      await currentRoom.connect(call.value.livekitUrl, call.value.token)
      if (room !== currentRoom) {
        await disconnectStaleRoom(currentRoom)
        return
      }
      connected = true
      await currentRoom.localParticipant.setMicrophoneEnabled(true)
      if (room !== currentRoom) {
        await disconnectStaleRoom(currentRoom)
        return
      }
      if (options.isVideo.value) {
        await currentRoom.localParticipant.setCameraEnabled(true)
        if (room !== currentRoom) {
          await disconnectStaleRoom(currentRoom)
          return
        }
        cameraEnabled.value = true
      }
      currentRoom.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track) {
            attachTrack(publication.track)
          }
        })
      })
    } catch {
      if (room !== currentRoom) {
        return
      }
      toast.error('通话连接失败，请检查设备权限和网络')
      await options.onConnectFailed()
    }
  }

  /** 切换屏幕共享 */
  async function toggleScreenShare() {
    if (!room) {
      return
    }
    const enabled = !screenShareEnabled.value
    try {
      await room.localParticipant.setScreenShareEnabled(enabled)
      screenShareEnabled.value = enabled
    } catch {
      toast.show('无法共享屏幕，请检查浏览器权限')
    }
  }

  /** 切换麦克风 */
  async function toggleMic() {
    if (!room) {
      return
    }
    const enabled = !micEnabled.value
    try {
      await room.localParticipant.setMicrophoneEnabled(enabled)
      micEnabled.value = enabled
    } catch {
      toast.show('无法切换麦克风，请检查设备权限')
    }
  }

  /** 切换摄像头 */
  async function toggleCamera() {
    if (!room) {
      return
    }
    const enabled = !cameraEnabled.value
    try {
      await room.localParticipant.setCameraEnabled(enabled)
      cameraEnabled.value = enabled
    } catch {
      toast.show('无法切换摄像头，请检查设备权限')
    }
  }

  /** 释放房间和本地媒体资源 */
  async function disposeRoom() {
    const currentRoom = room
    room = undefined
    if (currentRoom && screenShareEnabled.value) {
      try {
        await currentRoom.localParticipant.setScreenShareEnabled(false)
      } catch {
        // 共享关闭失败时仍继续释放房间
      } finally {
        screenShareEnabled.value = false
      }
    }
    currentRoom?.removeAllListeners()
    try {
      await currentRoom?.disconnect()
    } catch {
      // 断开失败时仍清理本地媒体元素
    } finally {
      reconnecting.value = false
      micEnabled.value = true
      cameraEnabled.value = false
      speakerEnabled.value = true
      screenShareEnabled.value = false
      clearMediaElements()
    }
  }

  /** 同步本地音频轨道的扬声器状态 */
  watch(speakerEnabled, (enabled) => {
    getMediaStage()?.querySelectorAll('audio').forEach((element) => {
      ;(element as HTMLAudioElement).muted = !enabled
    })
  })

  return {
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
  }
}
