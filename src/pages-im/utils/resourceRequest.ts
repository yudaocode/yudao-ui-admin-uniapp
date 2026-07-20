/** 可合并请求的固定资源 */
export enum ResourceRequestKey {
  FACE_PACKS = 'facePacks', // 系统表情包
  FACE_USER_ITEMS = 'faceUserItems', // 用户表情
  FRIEND_LIST = 'friendList', // 好友列表
  GROUP_LIST = 'groupList', // 群列表
  CHANNEL_LIST = 'channelList', // 频道列表
}

/** 需要串行落库的固定资源 */
export enum ResourceWriteKey {
  FRIEND_REQUEST_LIST = 'friendRequestList', // 好友申请
  GROUP_REQUEST_LIST = 'groupRequestList', // 加群申请
}

/** 固定资源请求的 task 生命周期模式 */
export enum ResourceRequestMode {
  CACHE_SUCCESS = 'cache-success', // 成功后持续复用，清理运行时状态时失效
  SINGLE_FLIGHT = 'single-flight', // 仅合并当前在途请求
}

/** 固定资源请求策略 */
export type ResourceRequestPolicy
  = | {
    mode: ResourceRequestMode.CACHE_SUCCESS
  }
  | {
    mode: ResourceRequestMode.SINGLE_FLIGHT
    refreshAfterPending?: boolean
  }

/** 单个固定资源当前发布的请求状态 */
interface ResourceRequestEntry {
  mode: ResourceRequestMode // task 生命周期模式
  task: Promise<unknown> // 当前请求 task
  trailingExecute?: () => Promise<unknown> // 合并后的尾随刷新
}

const resourceRequests = new Map<ResourceRequestKey, ResourceRequestEntry>() // 每个 key 仅发布一个当前 entry
const resourceWriteTails = new Map<ResourceWriteKey, Promise<void>>() // 每个资源仅发布一个落库尾部

/** 运行固定资源请求 */
export function runResourceRequest<T>(
  key: ResourceRequestKey,
  execute: () => Promise<T>,
  policy: ResourceRequestPolicy,
): Promise<T> {
  const existing = resourceRequests.get(key)
  // 1. 复用 task；force 只覆盖为一个最新尾随执行器
  if (existing) {
    if (existing.mode !== policy.mode) {
      return Promise.reject(new Error(`IM resource policy mismatch: ${key}`))
    }
    if (existing.mode === ResourceRequestMode.SINGLE_FLIGHT
      && policy.mode === ResourceRequestMode.SINGLE_FLIGHT
      && policy.refreshAfterPending) {
      existing.trailingExecute = execute
    }
    return existing.task as Promise<T>
  }
  const task = Promise.resolve().then(execute)
  const entry: ResourceRequestEntry = { mode: policy.mode, task }
  resourceRequests.set(key, entry)
  void task.then(
    () => finishResourceRequest(key, entry, true),
    () => finishResourceRequest(key, entry, false),
  )
  return task
}

/** 完成请求并按策略释放或补刷 */
function finishResourceRequest(
  key: ResourceRequestKey,
  entry: ResourceRequestEntry,
  succeeded: boolean,
): void {
  // 1. 旧 finalizer 不能修改已经替换的新 entry
  if (resourceRequests.get(key) !== entry) {
    return
  }
  // 2. once 成功保留；其余情况先释放当前 entry
  if (entry.mode === ResourceRequestMode.CACHE_SUCCESS && succeeded) {
    return
  }
  resourceRequests.delete(key)
  // 3. single-flight 的多次 force 合并为一次后台尾随刷新
  if (entry.trailingExecute) {
    void runResourceRequest(
      key,
      entry.trailingExecute,
      { mode: ResourceRequestMode.SINGLE_FLIGHT },
    ).catch(error => console.warn(`[IM] 尾随刷新 ${key} 失败`, error))
  }
}

/** 清理固定资源请求状态 */
export function clearResourceRequests(): void {
  resourceRequests.clear()
  resourceWriteTails.clear()
}

/** 判断固定资源当前是否有请求在途 */
export function isResourceRequestPending(
  key: ResourceRequestKey,
): boolean {
  const entry = resourceRequests.get(key)
  return entry?.mode === ResourceRequestMode.SINGLE_FLIGHT
}

/** 串行执行同一固定资源的落库操作 */
export async function enqueueResourceWrite<T>(
  key: ResourceWriteKey,
  execute: () => Promise<T>,
): Promise<T> {
  const previous = resourceWriteTails.get(key) || Promise.resolve()
  const task = previous.catch(() => undefined).then(execute)
  const settled = task.then(() => undefined, () => undefined)
  resourceWriteTails.set(key, settled)
  return await task.finally(() => {
    if (resourceWriteTails.get(key) === settled) {
      resourceWriteTails.delete(key)
    }
  })
}
