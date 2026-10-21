import type { InjectionKey, Ref } from 'vue'
import type { RtcParticipantTracks } from './useLiveKitRoom'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { provide, ref, shallowRef, watch } from 'vue'
import { RTC_APP_DISPOSE_TIMEOUT_MS } from '@/pages-im/utils/config'
import { requestRtcPermissions } from '@/pages-im/utils/rtcPermission'
import { useImRtc } from './useImRtc'

/** App 视图层房间目标状态；房间 token 只经 renderjs prop 进入当前通话页视图层 */
export interface RtcLiveKitBridgeState {
  livekitUrl: string
  token: string
  micEnabled: boolean
  cameraEnabled: boolean
  speakerEnabled: boolean
}

/** App 视图层回传的参与者媒体状态；Track 与媒体元素只保留在视图层 */
export interface RtcLiveKitBridgeMedia {
  userId: number
  isLocal: boolean
  videoVisible: boolean
}

/** App 视图层回传的 LiveKit 事件 */
export type RtcLiveKitBridgeEvent
  = | { type: 'connected', micEnabled: boolean, cameraEnabled: boolean }
    | { type: 'connect-failed', reason: 'unsupported' | 'permission' | 'error' }
    | { type: 'disconnected' }
    | { type: 'disposed' }
    | { type: 'reconnecting' }
    | { type: 'reconnected' }
    | { type: 'participant', userId: number, joined: boolean }
    | { type: 'media', participants: RtcLiveKitBridgeMedia[] }
    | { type: 'device', device: 'mic' | 'camera', enabled: boolean }
    | { type: 'device-failed', device: 'mic' | 'camera', enabled: boolean }
    | { type: 'audio-blocked' }

/** 通话容器与 renderjs 媒体桥之间的通道 */
export interface RtcLiveKitBridge {
  state: Readonly<Ref<RtcLiveKitBridgeState | undefined>>
  handleEvent: (event: RtcLiveKitBridgeEvent) => void
}

export const RTC_LIVEKIT_BRIDGE_KEY: InjectionKey<RtcLiveKitBridge> = Symbol('rtc-livekit-bridge')

const CONNECT_FAILED_MESSAGES = { // 连接失败原因提示
  unsupported: '当前 App 环境不支持音视频通话',
  permission: '无法使用麦克风或摄像头，请检查 App 权限',
  error: '通话连接失败，请检查设备权限和网络',
} as const

let roomDisposeTask: Promise<void> | undefined // 跨通话页面串行释放视图层房间

/** 管理 App 视图层 LiveKit 房间；逻辑层只维护目标状态，不加载 LiveKit SDK */
export function useLiveKitAppRoom(options: {
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
  const screenShareEnabled = ref(false) // App 不支持屏幕共享，保持关闭
  const participantTracks = shallowRef<RtcParticipantTracks[]>([]) // 视图层回传的参与者媒体状态
  const bridgeState = shallowRef<RtcLiveKitBridgeState>() // 视图层房间目标状态
  let connected = false
  let closed = false // 页面已收尾释放房间，不再发布新目标或连接等待
  let finishConnect: (() => void) | undefined
  let finishDispose: (() => void) | undefined

  provide(RTC_LIVEKIT_BRIDGE_KEY, { state: bridgeState, handleEvent })

  /** 合并视图层目标状态 */
  function updateBridgeState(patch: Partial<RtcLiveKitBridgeState>) {
    if (bridgeState.value) {
      bridgeState.value = { ...bridgeState.value, ...patch }
    }
  }

  /** 结束当前连接等待 */
  function resolveConnect() {
    finishConnect?.()
    finishConnect = undefined
  }

  /** 重置本地媒体状态 */
  function resetMediaState() {
    connected = false
    reconnecting.value = false
    micEnabled.value = true
    cameraEnabled.value = false
    speakerEnabled.value = true
    screenShareEnabled.value = false
    participantTracks.value = []
  }

  /** 执行通话收尾回调；挂断等业务请求错误已由请求层提示，这里不再抛出未处理拒绝 */
  async function runFinishCallback(callback: () => Promise<void>) {
    try {
      await callback()
    } catch (error) {
      console.warn('[IM rtc] App 通话收尾回调失败', error)
    }
  }

  /** 视图层连接失败：释放目标状态并按原流程结束通话 */
  function handleConnectFailed(reason: keyof typeof CONNECT_FAILED_MESSAGES) {
    bridgeState.value = undefined
    resetMediaState()
    toast.error(CONNECT_FAILED_MESSAGES[reason])
    void runFinishCallback(options.onConnectFailed).then(resolveConnect)
  }

  /** 视图层设备切换结果 */
  function applyDeviceState(device: 'mic' | 'camera', enabled: boolean) {
    if (device === 'mic') {
      micEnabled.value = enabled
    } else {
      cameraEnabled.value = enabled
    }
  }

  /** 接收视图层事件 */
  function handleEvent(event: RtcLiveKitBridgeEvent) {
    if (event.type === 'disposed') {
      finishDispose?.()
      return
    }
    if (!bridgeState.value) {
      return
    }
    if (event.type === 'connected') {
      connected = true
      micEnabled.value = event.micEnabled
      cameraEnabled.value = event.cameraEnabled
      resolveConnect()
    } else if (event.type === 'connect-failed') {
      handleConnectFailed(event.reason)
    } else if (event.type === 'disconnected') {
      bridgeState.value = undefined
      resetMediaState()
      void runFinishCallback(options.onRoomDisconnected)
    } else if (event.type === 'reconnecting' || event.type === 'reconnected') {
      reconnecting.value = event.type === 'reconnecting'
    } else if (event.type === 'participant') {
      syncParticipant(event.userId, event.joined)
    } else if (event.type === 'media') {
      participantTracks.value = event.participants.map(item => ({
        userId: item.userId,
        isLocal: item.isLocal,
        videoVisible: item.videoVisible,
      }))
    } else if (event.type === 'device') {
      applyDeviceState(event.device, event.enabled)
    } else if (event.type === 'device-failed') {
      applyDeviceState(event.device, event.enabled)
      updateBridgeState(event.device === 'mic' ? { micEnabled: event.enabled } : { cameraEnabled: event.enabled })
      toast.show(event.device === 'mic' ? '无法切换麦克风，请检查设备权限' : '无法切换摄像头，请检查设备权限')
    } else if (event.type === 'audio-blocked') {
      toast.show('请轻触屏幕开启通话声音')
    }
  }

  /** 连接 LiveKit 房间：下发目标状态，等待视图层连接结果 */
  async function connectRoom() {
    if (closed) {
      return
    }
    await roomDisposeTask
    if (closed) { // 等待其他页面释放期间本页已收尾，不再读取后续通话
      return
    }
    const current = call.value
    if (!current?.token || !current.livekitUrl || bridgeState.value) {
      return
    }
    connected = false
    const task = new Promise<void>((resolve) => {
      finishConnect = resolve
    })
    bridgeState.value = {
      livekitUrl: current.livekitUrl,
      token: current.token,
      micEnabled: true,
      cameraEnabled: options.initialCameraEnabled.value,
      speakerEnabled: speakerEnabled.value,
    }
    return task
  }

  /** App 无屏幕共享入口，调用时如实提示 */
  async function toggleScreenShare() {
    toast.show('App 暂不支持屏幕共享')
  }

  /** 切换麦克风 */
  async function toggleMic() {
    if (!bridgeState.value || !connected) {
      return
    }
    updateBridgeState({ micEnabled: !micEnabled.value })
  }

  /** 切换摄像头；打开前申请相机权限 */
  async function toggleCamera() {
    const state = bridgeState.value
    if (!state || !connected) {
      return
    }
    const enabled = !cameraEnabled.value
    if (enabled && !await requestRtcPermissions(true)) {
      toast.show('请在系统设置中允许相机权限')
      return
    }
    if (bridgeState.value?.token !== state.token) {
      return
    }
    updateBridgeState({ cameraEnabled: enabled })
  }

  /** 释放视图层房间、轨道和媒体元素；只在通话页收尾时调用，之后本实例不再连接 */
  function disposeRoom(): Promise<void> {
    closed = true
    resolveConnect()
    if (!bridgeState.value) {
      return roomDisposeTask ?? Promise.resolve()
    }
    bridgeState.value = undefined
    resetMediaState()
    const task = new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, RTC_APP_DISPOSE_TIMEOUT_MS)
      finishDispose = () => {
        clearTimeout(timer)
        resolve()
      }
    }).finally(() => {
      finishDispose = undefined
      if (roomDisposeTask === task) {
        roomDisposeTask = undefined
      }
    })
    roomDisposeTask = task
    return task
  }

  watch(speakerEnabled, enabled => updateBridgeState({ speakerEnabled: enabled }))

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
