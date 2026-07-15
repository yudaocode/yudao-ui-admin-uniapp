export type NativeRecorderIntent = 'send' | 'discard'
type NativeRecorderPhase = 'starting' | 'recording' | 'stopping'

interface NativeRecorderManagerLike {
  start: (options: UniApp.RecorderManagerStartOptions) => void
  stop: () => void
  onStart: (callback: () => void) => void
  onStop: (callback: (result: NativeRecorderRawResult) => void) => void
  onError: (callback: (error: unknown) => void) => void
}

interface NativeRecorderRawResult {
  tempFilePath?: string
  fileSize?: number
}

interface NativeRecorderSession {
  ownerId: number // 组件实例编号
  phase: NativeRecorderPhase // 底层录音阶段
  intent: NativeRecorderIntent // 停止后发送或丢弃
  stopRequested: boolean // 是否已经请求停止
  stopRequestedAt?: number // 用户松手或取消的时间
  released: boolean // 所属组件是否已经卸载
  startedAt?: number // 底层实际开始录音的时间
  callbacks: NativeRecorderCallbacks // 当前组件的事件回调
}

export interface NativeRecorderResult extends NativeRecorderRawResult {
  durationMs: number // 本地计算的录音时长（毫秒）
  intent: NativeRecorderIntent // 本次停止意图
}

export interface NativeRecorderCallbacks {
  onStart: () => void
  onStop: (result: NativeRecorderResult) => void
  onError: (error: unknown, intent: NativeRecorderIntent) => void
}

export type NativeRecorderStartResult = 'started' | 'busy' | 'disposed' | 'failed'

export interface NativeRecorderClient {
  start: () => NativeRecorderStartResult
  stop: (intent: NativeRecorderIntent) => void
  dispose: () => void
}

/** 创建原生录音管理器适配器；全局事件仅在此注册一次 */
export function createNativeRecorderManagerAdapter(
  recorderManager: NativeRecorderManagerLike,
  now: () => number = Date.now,
) {
  let activeSession: NativeRecorderSession | undefined // 当前占用全局录音器的会话
  let ownerIdSeed = 0 // 组件实例编号种子

  /** 停止当前底层录音 */
  function stopSession(session: NativeRecorderSession) {
    if (activeSession !== session || session.phase !== 'recording') {
      return
    }
    session.phase = 'stopping'
    try {
      recorderManager.stop()
    } catch (error) {
      if (activeSession !== session) {
        return
      }
      activeSession = undefined
      if (!session.released) {
        session.callbacks.onError(error, session.intent)
      }
    }
  }

  /** 路由全局录音开始事件 */
  recorderManager.onStart(() => {
    const session = activeSession
    if (!session || session.phase !== 'starting') {
      return
    }
    session.phase = 'recording'
    session.startedAt = now()
    if (session.stopRequested || session.released) {
      stopSession(session)
      return
    }
    session.callbacks.onStart()
  })

  /** 路由全局录音停止事件，并统一生成本地时长 */
  recorderManager.onStop((result) => {
    const session = activeSession
    if (!session) {
      return
    }
    activeSession = undefined // 先释放全局锁，业务上传期间允许下一次录音
    if (session.released) {
      return
    }
    const stoppedAt = session.stopRequestedAt ?? now()
    const durationMs = session.startedAt === undefined
      ? 0
      : Math.max(0, stoppedAt - session.startedAt)
    session.callbacks.onStop({
      tempFilePath: result.tempFilePath,
      fileSize: result.fileSize,
      durationMs,
      intent: session.intent,
    })
  })

  /** 路由全局录音错误事件 */
  recorderManager.onError((error) => {
    const session = activeSession
    if (!session) {
      return
    }
    activeSession = undefined
    if (!session.released) {
      session.callbacks.onError(error, session.intent)
    }
  })

  /** 为组件实例创建独立 client */
  function createClient(callbacks: NativeRecorderCallbacks): NativeRecorderClient {
    const ownerId = ++ownerIdSeed
    let disposed = false

    return {
      /** 启动当前组件的录音会话 */
      start() {
        if (disposed) {
          return 'disposed'
        }
        if (activeSession) {
          return 'busy'
        }
        const session: NativeRecorderSession = {
          ownerId,
          phase: 'starting',
          intent: 'send',
          stopRequested: false,
          released: false,
          callbacks,
        }
        activeSession = session
        try {
          recorderManager.start({ duration: 60000, format: 'mp3' })
          return 'started'
        } catch {
          if (activeSession === session) {
            activeSession = undefined
          }
          return 'failed'
        }
      },
      /** 请求停止当前组件的录音会话 */
      stop(intent) {
        const session = activeSession
        if (!session || session.ownerId !== ownerId) {
          return
        }
        if (intent === 'discard' || session.phase === 'starting') {
          // 底层尚未真正开始时已经松手，不能发送延迟启动的空录音
          session.intent = 'discard'
        }
        // 时长截止在用户松手，而不是包含底层文件落盘等待
        session.stopRequestedAt ??= now()
        session.stopRequested = true
        stopSession(session)
      },
      /** 释放当前组件持有的录音会话 */
      dispose() {
        disposed = true
        const session = activeSession
        if (!session || session.ownerId !== ownerId) {
          return
        }
        session.intent = 'discard'
        session.stopRequestedAt ??= now()
        session.stopRequested = true
        // 保留会话锁直到旧 onStop/onError 到达，避免事件被路由给新组件
        session.released = true
        stopSession(session)
      },
    }
  }

  return { createClient }
}

let nativeRecorderManagerAdapter: ReturnType<typeof createNativeRecorderManagerAdapter> | undefined

/** 获取全局唯一的原生录音适配器 */
function getNativeRecorderManagerAdapter() {
  if (!nativeRecorderManagerAdapter) {
    nativeRecorderManagerAdapter = createNativeRecorderManagerAdapter(uni.getRecorderManager())
  }
  return nativeRecorderManagerAdapter
}

/** 创建当前组件使用的原生录音 client */
export function createNativeRecorderClient(callbacks: NativeRecorderCallbacks) {
  return getNativeRecorderManagerAdapter().createClient(callbacks)
}
