import { parseId } from '@/utils/id'
import type { InjectionKey, Ref } from 'vue'
import type { RtcConnectFailedReason, RtcMediaState, RtcParticipantTracks } from './useLiveKitRoom'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { provide, ref, shallowRef } from 'vue'
import {
  RTC_MP_CONNECT_TIMEOUT_MS,
  RTC_MP_GATEWAY_URL,
  RTC_MP_PUBLISH_LOST_TIMEOUT_MS,
  RTC_MP_REQUEST_TIMEOUT_MS,
} from '@/pages-im/utils/config'
import { requestRtcPermissions } from '@/pages-im/utils/rtcPermission'
import { useImRtc } from './useImRtc'

/** 网关会话；凭证与推流地址只保存在当前通话页内存 */
interface MpGatewaySession {
  sessionId: string
  sessionToken: string
  userId: number
  pushUrl: string
  pollIntervalMs: number
  leaseTtlMs: number
}

/** 网关回传的远端媒体转发状态 */
type MpGatewayRemoteState = Exclude<RtcMediaState, 'unavailable'>

/** 网关回传的远端成员 */
interface MpGatewayRemote {
  userId: number
  state: MpGatewayRemoteState
  ready: boolean
  playUrl: string | null
  hasAudio: boolean
  hasVideo: boolean
  videoVisible: boolean
}

/** 网关会话状态 */
interface MpGatewayView {
  publishing: boolean
  remotes: MpGatewayRemote[]
  error: string | null
}

/** 网关请求结果 */
interface MpGatewayResponse {
  statusCode: number
  data: unknown
}

/** 小程序原生推拉流组件使用的媒体状态 */
export interface RtcMpStreamContext {
  pushUrl: Readonly<Ref<string>>
  playUrls: Readonly<Ref<ReadonlyMap<number, string>>>
  micEnabled: Readonly<Ref<boolean>>
  cameraEnabled: Readonly<Ref<boolean>>
  speakerEnabled: Readonly<Ref<boolean>>
  handlePusherError: (code: number) => void
  handlePlayerFailed: (userId: number) => void
  handlePlayerReady: (userId: number) => void
}

export const RTC_MP_STREAM_KEY: InjectionKey<RtcMpStreamContext> = Symbol('rtc-mp-stream')

const PUSHER_PERMISSION_CODES = new Set([10001, 10002, -1301, -1302]) // live-pusher 摄像头 / 麦克风不可用
const PUSHER_DISCONNECTED_CODE = -1307 // live-pusher 网络断开且内部重连已耗尽；其它推流中断由接通后推流丢失时限兜底
const REMOTE_STATES = new Set<MpGatewayRemoteState>(['ready', 'starting', 'waiting', 'overflow', 'capacity', 'failed']) // 可识别的远端状态

const CREATE_FAILED_MESSAGES: Record<number, string> = { // 创建网关会话失败提示
  401: '通话凭证无效，请重新发起通话',
  403: '通话凭证无效，请重新发起通话',
  429: '小程序通话名额已满，请稍后再试',
}
const CREATE_CONFLICT_MESSAGES = { // 创建网关会话 409 按错误码提示
  session_busy: '本账号在该通话已有小程序接入或资源未释放，请先结束另一端；持续出现请联系管理员',
  session_closed: '小程序通话会话创建时已被网关关闭，请重新发起通话',
}

/** 读取创建会话 409 的错误码；只接受网关定义的取值 */
function parseConflictCode(data: unknown): keyof typeof CREATE_CONFLICT_MESSAGES | undefined {
  const code = (data as { code?: unknown } | null)?.code
  return code === 'session_busy' || code === 'session_closed' ? code : undefined
}

/** 调用小程序通话网关；只携带房间 Token 或网关会话凭证，不使用登录态请求封装 */
function requestGateway(method: 'POST' | 'GET' | 'DELETE', path: string, bearer: string): Promise<MpGatewayResponse> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${RTC_MP_GATEWAY_URL}${path}`,
      method,
      header: { Authorization: `Bearer ${bearer}` },
      timeout: RTC_MP_REQUEST_TIMEOUT_MS,
      success: res => resolve({ statusCode: res.statusCode, data: res.data }),
      fail: reject,
    })
  })
}

/** 校验创建会话响应 */
function parseSession(data: unknown): MpGatewaySession | undefined {
  const value = data as Partial<MpGatewaySession> | null
  if (!value
    || typeof value.sessionId !== 'string' || !/^[0-9a-f]{32}$/.test(value.sessionId)
    || typeof value.sessionToken !== 'string' || !value.sessionToken
    || typeof value.pushUrl !== 'string' || !value.pushUrl.startsWith('rtmp://')
    || typeof value.userId !== 'number') {
    return undefined
  }
  return {
    sessionId: value.sessionId,
    sessionToken: value.sessionToken,
    userId: value.userId,
    pushUrl: value.pushUrl,
    pollIntervalMs: Math.max(500, Number(value.pollIntervalMs) || 2000),
    leaseTtlMs: Math.max(3000, Number(value.leaseTtlMs) || 20000),
  }
}

/** 校验会话状态响应；只接受 rtmp 拉流地址 */
function parseView(data: unknown): MpGatewayView | undefined {
  const value = data as Partial<MpGatewayView> | null
  if (!value || typeof value.publishing !== 'boolean' || !Array.isArray(value.remotes)) {
    return undefined
  }
  return {
    publishing: value.publishing,
    error: typeof value.error === 'string' ? value.error : null,
    remotes: value.remotes
      .filter(item => item && parseId(item.userId) !== undefined && item.userId > 0)
      .map((item) => {
        const ready = item.ready === true && typeof item.playUrl === 'string' && item.playUrl.startsWith('rtmp://')
        const state = REMOTE_STATES.has(item.state) ? item.state : 'failed'
        return { ...item, ready, state: ready ? 'ready' : state === 'ready' ? 'starting' : state }
      }),
  }
}

/** 释放网关会话；失败由网关租约兜底 */
function deleteSession(session: MpGatewaySession) {
  return requestGateway('DELETE', `/mp-rtc/sessions/${session.sessionId}`, session.sessionToken)
    .then(() => undefined, () => undefined)
}

/** 管理微信小程序经 RTMP 网关接入的 LiveKit 房间；推拉流由原生 live-pusher / live-player 完成 */
export function useMpGatewayRoom(options: {
  initialCameraEnabled: Readonly<Ref<boolean>>
  onConnectFailed: (reason?: RtcConnectFailedReason) => Promise<void>
  onRoomDisconnected: () => Promise<void>
}) {
  const toast = useToast()
  const { call, syncParticipant } = useImRtc()
  const micEnabled = ref(true) // 麦克风状态
  const cameraEnabled = ref(false) // 摄像头状态
  const speakerEnabled = ref(true) // 扬声器状态
  const reconnecting = ref(false) // 网关同步或推流中断状态
  const screenShareEnabled = ref(false) // 小程序不支持屏幕共享，保持关闭
  const participantTracks = shallowRef<RtcParticipantTracks[]>([]) // 网关回传的参与者媒体状态
  const pushUrl = ref('') // live-pusher 推流地址
  const playUrls = shallowRef<ReadonlyMap<number, string>>(new Map()) // 远端 userId -> live-player 拉流地址
  let session: MpGatewaySession | undefined // 当前网关会话；异步结果按对象身份比对
  let creating = false // 是否正在创建网关会话
  let connected = false // 推流是否已进房
  let closed = false // 页面已收尾，不再创建会话
  let connectDeadline = 0 // 等待推流进房的截止时间
  let lastSyncedAt = 0 // 最近一次成功同步时间
  let remoteUserIds = new Set<number>() // 已同步给通话状态机的远端成员
  let remotes: MpGatewayRemote[] = [] // 最近一次网关回传的远端成员
  let unavailableUserIds = new Set<number>() // 原生播放器重启后仍失败的远端；拉流地址变化时重新尝试
  let publishLostAt = 0 // 接通后推流丢失的开始时间；为 0 表示推流正常
  let pollTimer: ReturnType<typeof setTimeout> | undefined
  let finishConnect: (() => void) | undefined

  provide(RTC_MP_STREAM_KEY, {
    pushUrl,
    playUrls,
    micEnabled,
    cameraEnabled,
    speakerEnabled,
    handlePusherError,
    handlePlayerFailed,
    handlePlayerReady,
  })

  /** 结束当前连接等待 */
  function resolveConnect() {
    finishConnect?.()
    finishConnect = undefined
  }

  /** 执行通话收尾回调；业务请求错误已由请求层提示，这里不再抛出未处理拒绝 */
  async function runFinishCallback(callback: () => Promise<void>) {
    try {
      await callback()
    } catch (error) {
      console.warn('[IM rtc] 小程序通话收尾回调失败', error)
    }
  }

  /** 停止同步并释放当前网关会话，重置媒体状态 */
  function releaseSession() {
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = undefined
    }
    const current = session
    session = undefined
    connected = false
    publishLostAt = 0
    pushUrl.value = ''
    playUrls.value = new Map()
    remoteUserIds = new Set()
    remotes = []
    unavailableUserIds = new Set()
    reconnecting.value = false
    micEnabled.value = true
    cameraEnabled.value = false
    speakerEnabled.value = true
    participantTracks.value = []
    if (current) {
      void deleteSession(current)
    }
  }

  /** 连接失败：释放网关会话并按原流程结束通话 */
  function failConnect(message: string) {
    releaseSession()
    toast.error(message)
    void runFinishCallback(options.onConnectFailed).then(resolveConnect)
  }

  /** 已接通后会话丢失：释放资源并按原流程结束通话 */
  function handleSessionLost(message?: string) {
    releaseSession()
    if (message) {
      toast.error(message)
    }
    void runFinishCallback(options.onRoomDisconnected)
  }

  /** 按远端转发状态与本地播放结果生成参与者媒体状态 */
  function renderTracks(target: MpGatewaySession) {
    participantTracks.value = [
      { userId: target.userId, isLocal: true, videoVisible: cameraEnabled.value },
      ...remotes.map((item) => {
        const mediaState: RtcMediaState = item.state === 'ready' && unavailableUserIds.has(item.userId) ? 'unavailable' : item.state
        return {
          userId: item.userId,
          isLocal: false,
          videoVisible: mediaState === 'ready' && item.hasVideo && item.videoVisible,
          mediaState,
        }
      }),
    ]
  }

  /** 按网关状态同步远端成员、拉流地址与参与者媒体状态；接通后推流丢失超过时限则结束通话 */
  function applyView(target: MpGatewaySession, view: MpGatewayView) {
    const now = Date.now()
    if (view.publishing && !connected) {
      connected = true
      resolveConnect()
    }
    if (connected) {
      if (view.publishing) {
        publishLostAt = 0
      } else if (!publishLostAt) {
        publishLostAt = now
      } else if (now - publishLostAt > RTC_MP_PUBLISH_LOST_TIMEOUT_MS) { // 网关查询正常但推流一直未恢复
        handleSessionLost('推流已中断，小程序通话已结束')
        return
      }
    }
    reconnecting.value = connected && (!view.publishing || !!view.error)
    const nextUserIds = new Set(view.remotes.map(item => item.userId))
    nextUserIds.forEach((userId) => {
      if (!remoteUserIds.has(userId)) {
        syncParticipant(userId, true)
      }
    })
    remoteUserIds.forEach((userId) => {
      if (!nextUserIds.has(userId)) {
        syncParticipant(userId, false)
      }
    })
    remoteUserIds = nextUserIds
    const previousUrls = playUrls.value
    playUrls.value = new Map(view.remotes
      .filter(item => item.ready)
      .map(item => [item.userId, item.playUrl as string]))
    unavailableUserIds.forEach((userId) => {
      if (playUrls.value.get(userId) !== previousUrls.get(userId)) { // 换了新的拉流地址，允许重新播放
        unavailableUserIds.delete(userId)
      }
    })
    remotes = view.remotes
    renderTracks(target)
  }

  /** 安排下一次同步 */
  function schedulePoll(target: MpGatewaySession) {
    pollTimer = setTimeout(() => void pollSession(target), target.pollIntervalMs)
  }

  /** 查询网关会话（同时续租）；会话已更换或释放时丢弃结果 */
  async function pollSession(target: MpGatewaySession) {
    if (session !== target) {
      return
    }
    let response: MpGatewayResponse | undefined
    try {
      response = await requestGateway('GET', `/mp-rtc/sessions/${target.sessionId}`, target.sessionToken)
    } catch {
      response = undefined
    }
    if (session !== target) {
      return
    }
    if (response?.statusCode === 404) {
      if (connected) {
        handleSessionLost()
      } else {
        failConnect('小程序通话会话已结束')
      }
      return
    }
    const view = response?.statusCode === 200 ? parseView(response.data) : undefined
    const now = Date.now()
    if (view) {
      lastSyncedAt = now
      applyView(target, view)
      if (session !== target) { // 推流丢失超时已结束通话
        return
      }
    } else if (connected) {
      reconnecting.value = true
      if (now - lastSyncedAt > target.leaseTtlMs) { // 超过租约仍未同步成功，网关已释放会话
        handleSessionLost()
        return
      }
    }
    if (!connected && now > connectDeadline) {
      failConnect('小程序推流超时，请检查网络与麦克风权限')
      return
    }
    schedulePoll(target)
  }

  /** live-pusher 状态 / 错误码：设备不可用时未接通则结束、已接通则提示；网络重连耗尽时结束本次通话 */
  function handlePusherError(code: number) {
    if (!session) {
      return
    }
    if (code === PUSHER_DISCONNECTED_CODE) {
      if (connected) {
        handleSessionLost('网络中断，小程序通话已结束')
      } else {
        failConnect('小程序推流失败，请检查网络后重试')
      }
      return
    }
    if (!PUSHER_PERMISSION_CODES.has(code)) {
      return
    }
    if (!connected) {
      failConnect('无法使用麦克风或摄像头，请检查小程序权限')
      return
    }
    toast.show('麦克风或摄像头不可用，请检查小程序权限')
  }

  /** 原生播放器重启后仍失败：标记该远端画面不可用，等待网关下发新的拉流地址 */
  function handlePlayerFailed(userId: number) {
    const target = session
    if (!target || !remotes.some(item => item.userId === userId) || unavailableUserIds.has(userId)) {
      return
    }
    unavailableUserIds.add(userId)
    renderTracks(target)
  }

  /** 原生播放器开始播放：清除不可用标记 */
  function handlePlayerReady(userId: number) {
    const target = session
    if (target && unavailableUserIds.delete(userId)) {
      renderTracks(target)
    }
  }

  /** 连接房间：创建网关会话，开始推流，等待网关确认推流已进房 */
  async function connectRoom() {
    const current = call.value
    if (closed || creating || session || !RTC_MP_GATEWAY_URL || !current?.token) {
      return
    }
    creating = true
    let response: MpGatewayResponse | undefined
    try {
      response = await requestGateway('POST', '/mp-rtc/sessions', current.token)
    } catch {
      response = undefined
    } finally {
      creating = false
    }
    const created = response?.statusCode === 201 ? parseSession(response.data) : undefined
    if (closed || call.value?.token !== current.token) { // 创建期间页面已收尾或通话已更换，释放迟到的会话
      if (created) {
        void deleteSession(created)
      }
      return
    }
    if (!created) {
      const conflictCode = response?.statusCode === 409 ? parseConflictCode(response.data) : undefined
      toast.error(response?.statusCode === 201
        ? '小程序通话服务响应异常'
        : (conflictCode && CREATE_CONFLICT_MESSAGES[conflictCode])
          || CREATE_FAILED_MESSAGES[response?.statusCode || 0]
          || '小程序通话服务不可用，请稍后再试')
      if (conflictCode === 'session_busy') { // 同账号会话占用：不能代另一端离开通话，只做本地收尾
        await runFinishCallback(() => options.onConnectFailed('busy'))
        return
      }
      await runFinishCallback(options.onConnectFailed)
      return
    }
    session = created
    connected = false
    connectDeadline = Date.now() + RTC_MP_CONNECT_TIMEOUT_MS
    lastSyncedAt = Date.now()
    cameraEnabled.value = options.initialCameraEnabled.value
    pushUrl.value = created.pushUrl
    renderTracks(created)
    const task = new Promise<void>((resolve) => {
      finishConnect = resolve
    })
    schedulePoll(created)
    return task
  }

  /** 小程序无屏幕共享入口，调用时如实提示 */
  async function toggleScreenShare() {
    toast.show('小程序暂不支持屏幕共享')
  }

  /** 切换麦克风；对端听到静音，LiveKit 侧不呈现 muted 状态 */
  async function toggleMic() {
    if (!session || !connected) {
      return
    }
    micEnabled.value = !micEnabled.value
  }

  /** 切换摄像头；打开前申请相机授权 */
  async function toggleCamera() {
    const target = session
    if (!target || !connected) {
      return
    }
    const enabled = !cameraEnabled.value
    if (enabled && !await requestRtcPermissions(true)) {
      toast.show('请在小程序设置中允许相机权限')
      return
    }
    if (session !== target) {
      return
    }
    cameraEnabled.value = enabled
    renderTracks(target)
  }

  /** 释放网关会话与推拉流；只在通话页收尾时调用，之后本实例不再连接 */
  function disposeRoom(): Promise<void> {
    closed = true
    resolveConnect()
    releaseSession()
    return Promise.resolve()
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
