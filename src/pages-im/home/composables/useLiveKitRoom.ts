// noinspection UnreachableCodeJS

import type { Ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, shallowRef } from 'vue'
import { Room, RoomEvent, Track } from 'livekit-client'
import { useImRtc } from './useImRtc'

/** 参与者媒体轨道；视频优先屏幕共享，其次摄像头 */
export interface RtcParticipantTracks {
  userId: number
  isLocal: boolean
  cameraTrack?: Track
  cameraMuted?: boolean
  screenShareTrack?: Track
  screenShareMuted?: boolean
  audioTrack?: Track
  audioMuted?: boolean
}

let roomDisposeTask: Promise<void> | undefined // 跨通话页面串行释放物理房间

/** 管理 H5 LiveKit 房间及本地媒体设备 */
export function useLiveKitRoom(options: {
  initialCameraEnabled: Readonly<Ref<boolean>>
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
  const participantTracks = shallowRef<RtcParticipantTracks[]>([]) // 按参与者归属的媒体轨道
  let room: Room | undefined

  /** 当前是否已有新的房间 owner */
  function hasActiveRoom() {
    return !!room
  }

  /** 释放已经失效的房间实例 */
  async function disconnectStaleRoom(staleRoom: Room) {
    staleRoom.removeAllListeners()
    try {
      await staleRoom.disconnect()
    } catch {
      // 失效实例断开失败时不影响当前房间
    }
  }

  /** 写入参与者媒体轨道 */
  function upsertParticipantTrack(track: Track, userId: number, isLocal: boolean) {
    if (!userId || (track.kind === Track.Kind.Audio && track.source !== Track.Source.Microphone)) {
      return
    }
    const current = participantTracks.value.find(item => item.userId === userId)
    const next: RtcParticipantTracks = {
      ...current,
      userId,
      isLocal,
    }
    if (track.kind === Track.Kind.Audio) {
      next.audioTrack = track
      next.audioMuted = track.isMuted
    } else if (track.source === Track.Source.ScreenShare) {
      next.screenShareTrack = track
      next.screenShareMuted = track.isMuted
    } else {
      next.cameraTrack = track
      next.cameraMuted = track.isMuted
    }
    participantTracks.value = [
      ...participantTracks.value.filter(item => item.userId !== userId),
      next,
    ]
  }

  /** 移除参与者媒体轨道 */
  function removeParticipantTrack(userId: number, track?: Track, trackSid?: string) {
    const current = participantTracks.value.find(item => item.userId === userId)
    if (!current) {
      return
    }
    const isTargetTrack = (item?: Track) => !!item && (item === track || (!!trackSid && item.sid === trackSid))
    const next: RtcParticipantTracks = {
      ...current,
      cameraTrack: isTargetTrack(current.cameraTrack) ? undefined : current.cameraTrack,
      cameraMuted: isTargetTrack(current.cameraTrack) ? undefined : current.cameraMuted,
      screenShareTrack: isTargetTrack(current.screenShareTrack) ? undefined : current.screenShareTrack,
      screenShareMuted: isTargetTrack(current.screenShareTrack) ? undefined : current.screenShareMuted,
      audioTrack: isTargetTrack(current.audioTrack) ? undefined : current.audioTrack,
      audioMuted: isTargetTrack(current.audioTrack) ? undefined : current.audioMuted,
    }
    const rows = participantTracks.value.filter(item => item.userId !== userId)
    if (next.cameraTrack || next.screenShareTrack || next.audioTrack) {
      rows.push(next)
    }
    participantTracks.value = rows
  }

  /** 同步参与者媒体轨道静音状态 */
  function updateParticipantTrackMuted(userId: number, trackSid: string, muted: boolean) {
    const current = participantTracks.value.find(item => item.userId === userId)
    if (!current) {
      return
    }
    const next = { ...current }
    if (current.cameraTrack?.sid === trackSid) {
      next.cameraMuted = muted
    } else if (current.screenShareTrack?.sid === trackSid) {
      next.screenShareMuted = muted
    } else if (current.audioTrack?.sid === trackSid) {
      next.audioMuted = muted
    } else {
      return
    }
    participantTracks.value = participantTracks.value.map(item => item.userId === userId ? next : item)
  }

  /** 清空指定参与者或全部媒体轨道 */
  function clearParticipantTracks(userId?: number) {
    participantTracks.value = userId
      ? participantTracks.value.filter(item => item.userId !== userId)
      : []
  }

  /** 连接 LiveKit 房间 */
  async function connectRoom() {
    // #ifndef H5
    toast.show('当前通话页面仅支持 H5')
    return
    // #endif
    await roomDisposeTask
    if (!call.value?.token || !call.value.livekitUrl || room) {
      return
    }
    const currentRoom = new Room({ adaptiveStream: true, dynacast: true })
    let connected = false
    room = currentRoom
    const isCurrentRoom = () => room === currentRoom
    currentRoom
      .on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (!isCurrentRoom()) {
          return
        }
        upsertParticipantTrack(track, Number(participant.identity), false)
      })
      .on(RoomEvent.LocalTrackPublished, (publication) => {
        if (!isCurrentRoom()) {
          return
        }
        if (publication.track) {
          upsertParticipantTrack(
            publication.track,
            Number(currentRoom.localParticipant.identity),
            true,
          )
        }
      })
      .on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (!isCurrentRoom()) {
          return
        }
        removeParticipantTrack(
          Number(currentRoom.localParticipant.identity),
          publication.track,
          publication.trackSid,
        )
      })
      .on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        if (!isCurrentRoom()) {
          return
        }
        removeParticipantTrack(Number(participant.identity), track, publication.trackSid)
      })
      .on(RoomEvent.TrackMuted, (publication, participant) => {
        if (!isCurrentRoom()) {
          return
        }
        updateParticipantTrackMuted(Number(participant.identity), publication.trackSid, true)
      })
      .on(RoomEvent.TrackUnmuted, (publication, participant) => {
        if (!isCurrentRoom()) {
          return
        }
        updateParticipantTrackMuted(Number(participant.identity), publication.trackSid, false)
      })
      .on(RoomEvent.ParticipantConnected, (participant) => {
        if (!isCurrentRoom()) {
          return
        }
        const userId = Number(participant.identity)
        if (userId) {
          syncParticipant(userId, true)
        }
      })
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        if (!isCurrentRoom()) {
          return
        }
        const userId = Number(participant.identity)
        if (userId) {
          syncParticipant(userId, false)
          clearParticipantTracks(userId)
        }
      })
      .on(RoomEvent.Reconnecting, () => {
        if (!isCurrentRoom()) {
          return
        }
        reconnecting.value = true
      })
      .on(RoomEvent.Reconnected, () => {
        if (!isCurrentRoom()) {
          return
        }
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
        clearParticipantTracks()
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
      if (options.initialCameraEnabled.value) {
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
            upsertParticipantTrack(publication.track, Number(participant.identity), false)
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
    const currentRoom = room
    if (!currentRoom) {
      return
    }
    const enabled = !screenShareEnabled.value
    try {
      await currentRoom.localParticipant.setScreenShareEnabled(enabled)
      if (room === currentRoom) {
        screenShareEnabled.value = enabled
      }
    } catch {
      toast.show('无法共享屏幕，请检查浏览器权限')
    }
  }

  /** 切换麦克风 */
  async function toggleMic() {
    const currentRoom = room
    if (!currentRoom) {
      return
    }
    const enabled = !micEnabled.value
    try {
      await currentRoom.localParticipant.setMicrophoneEnabled(enabled)
      if (room === currentRoom) {
        micEnabled.value = enabled
      }
    } catch {
      toast.show('无法切换麦克风，请检查设备权限')
    }
  }

  /** 切换摄像头 */
  async function toggleCamera() {
    const currentRoom = room
    if (!currentRoom) {
      return
    }
    const enabled = !cameraEnabled.value
    try {
      await currentRoom.localParticipant.setCameraEnabled(enabled)
      if (room === currentRoom) {
        cameraEnabled.value = enabled
      }
    } catch {
      toast.show('无法切换摄像头，请检查设备权限')
    }
  }

  /** 释放房间和本地媒体资源 */
  function disposeRoom(): Promise<void> {
    if (!room && roomDisposeTask) {
      return roomDisposeTask
    }
    const currentRoom = room
    room = undefined
    currentRoom?.removeAllListeners()
    const task = (async () => {
      if (currentRoom && screenShareEnabled.value) {
        try {
          await currentRoom.localParticipant.setScreenShareEnabled(false)
        } catch {
          // 共享关闭失败时仍继续释放房间
        }
      }
      try {
        await currentRoom?.disconnect()
      } catch {
        // 断开失败时仍清理本地媒体元素
      } finally {
        if (!hasActiveRoom()) {
          reconnecting.value = false
          micEnabled.value = true
          cameraEnabled.value = false
          speakerEnabled.value = true
          screenShareEnabled.value = false
          clearParticipantTracks()
        }
      }
    })().finally(() => {
      if (roomDisposeTask === task) {
        roomDisposeTask = undefined
      }
    })
    roomDisposeTask = task
    return task
  }

  return {
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
  }
}
