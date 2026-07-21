import { ImMessageStatus, ImMessageType } from '@/pages-im/utils/constants'

/** 消息状态优先级；高优先级终态不可被普通消息覆盖 */
export enum MessageTerminalPriority {
  NORMAL = 0, // 普通消息
  CONFIRMED = 1, // 服务端已确认消息
  RECALL = 2, // 撤回终态
}

/** 会话写 lane 与全量屏障 */
interface ConversationWriteState {
  barrierTail: Promise<void> // 当前全量屏障尾部
  tails: Map<string, Promise<void>> // 各会话写入尾部
}

let writeState: ConversationWriteState = { // 当前运行时的会话写状态
  barrierTail: Promise.resolve(),
  tails: new Map(),
}
const terminatedRelations = new Set<string>() // 本次运行已终止的群关系

/** 同一会话串行执行消息与会话终态写入 */
export async function enqueueConversationWrite<T>(
  clientConversationId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return enqueueConversationWrites([clientConversationId], operation)
}

/** 一次写入原子占用全部会话 lane，避免嵌套获取与屏障互锁 */
export async function enqueueConversationWrites<T>(
  clientConversationIds: string[],
  operation: () => Promise<T>,
): Promise<T> {
  // 1. 等待全量屏障和所有目标会话的前驱写入
  const state = writeState
  const keys = Array.from(new Set(clientConversationIds)).sort()
  const predecessors = [
    state.barrierTail,
    ...keys.map(key => state.tails.get(key) || Promise.resolve()),
  ]
  const current = Promise.all(predecessors.map(task => task.catch(() => undefined)))
    .then(() => writeState === state ? operation() : undefined as T)
  const settled = current.then(() => undefined, () => undefined)
  // 2. 先发布 recovery tail；完成时仅清理仍指向本任务的 lane
  keys.forEach(key => state.tails.set(key, settled))
  return await current.finally(() => {
    keys.forEach((key) => {
      if (state.tails.get(key) === settled) {
        state.tails.delete(key)
      }
    })
  })
}

/** 独占全部会话写入；只用于全量快照重建，常规写仍按会话并行 */
export function enqueueConversationBarrier<T>(
  operation: () => Promise<T>,
): Promise<T> {
  // 1. 同步发布 gate，阻止后续会话写越过本次全量操作
  const state = writeState
  const previousBarrier = state.barrierTail
  const existingWrites = Array.from(state.tails.values())
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  state.barrierTail = previousBarrier.catch(() => undefined).then(() => gate)
  return (async () => {
    // 2. 排空封门前的屏障和会话写，再独占执行全量操作
    await previousBarrier.catch(() => undefined)
    await Promise.all(existingWrites.map(task => task.catch(() => undefined)))
    if (writeState !== state) {
      return undefined as T
    }
    return await operation()
  })().finally(release)
}

/** 终态优先；相同优先级使用后到达状态 */
export function reduceMessageState<T>(
  current: { priority: MessageTerminalPriority, value?: T } | undefined,
  incoming: { priority: MessageTerminalPriority, value?: T },
) {
  return current && current.priority > incoming.priority ? current : incoming
}

/** 获取普通消息与撤回终态的归约优先级 */
export function getMessageTerminalPriority(message: {
  id?: number
  status: number
  type: number
}) {
  if (message.type === ImMessageType.RECALL || message.status === ImMessageStatus.RECALL) {
    return MessageTerminalPriority.RECALL
  }
  return message.status === ImMessageStatus.NORMAL && !!message.id
    ? MessageTerminalPriority.CONFIRMED
    : MessageTerminalPriority.NORMAL
}

/** 合并同一消息的服务端状态；终态优先，回执与已读人数只前进不回退 */
export function mergeMessageState<T extends {
  id?: number
  status: number
  type: number
  receiptStatus?: number
  readCount?: number
}>(current: T | undefined, incoming: T): T {
  const reduced = reduceMessageState(
    current
      ? { priority: getMessageTerminalPriority(current), value: current }
      : undefined,
    { priority: getMessageTerminalPriority(incoming), value: incoming },
  )
  if (reduced.value === current) {
    return current
  }
  const next = { ...current, ...incoming }
  if (current?.receiptStatus !== undefined) {
    next.receiptStatus = incoming.receiptStatus === undefined
      ? current.receiptStatus
      : Math.max(current.receiptStatus, incoming.receiptStatus)
  }
  if (current?.readCount !== undefined) {
    next.readCount = incoming.readCount === undefined
      ? current.readCount
      : Math.max(current.readCount, incoming.readCount)
  }
  return next as T
}

/** 判断消息是否已被当前设备清理或删除 */
export function isMessageTerminated(
  message: { id?: number, clientMessageId: string },
  clearBefore: number,
  deletedKeys: ReadonlySet<string>,
): boolean {
  return (!!message.id && message.id <= clearBefore)
    || (!!message.id && deletedKeys.has(`id:${message.id}`))
    || deletedKeys.has(`client:${message.clientMessageId}`)
}

/** 在会话写 lane 内记录关系终态 */
export function markRelationTerminated(clientConversationId: string): void {
  terminatedRelations.add(clientConversationId)
}

/** 显式重新加入后清除关系终态 */
export function reopenRelation(clientConversationId: string): void {
  terminatedRelations.delete(clientConversationId)
}

/** 判断本次运行内的群关系是否已进入终态 */
export function isRelationTerminated(clientConversationId: string): boolean {
  return terminatedRelations.has(clientConversationId)
}

/** 清理当前 IM 运行时的消息写入与关系终态 */
export function clearMessageSyncState(): void {
  writeState = {
    barrierTail: Promise.resolve(),
    tails: new Map(),
  }
  terminatedRelations.clear()
}
