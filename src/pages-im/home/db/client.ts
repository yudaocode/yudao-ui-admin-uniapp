// IM 本地数据库：统一客户端接口 + 主键工具
// H5(IndexedDB) 与 小程序/App(storage) 适配层都实现 ImDbClient，业务 store 只依赖该接口

import type { DbStoreName, MessageDO } from './types'

/** 跨端本地 DB 客户端接口（去掉 IndexedDB 专有的事务参数，按平台各自实现原子性） */
export interface ImDbClient {
  /** 打开/切换到某用户的库 */
  open: (userId: number) => Promise<void>
  /** 关闭连接 */
  close: () => void
  /** 按主键取单条 */
  get: <T>(store: DbStoreName, key: string | number) => Promise<T | undefined>
  /** 取整表 */
  getAll: <T>(store: DbStoreName) => Promise<T[]>
  /** 写入单条 */
  put: <T>(store: DbStoreName, value: T) => Promise<void>
  /** 批量写入 */
  bulkPut: <T>(store: DbStoreName, values: T[]) => Promise<void>
  /** 按主键删除 */
  delete: (store: DbStoreName, key: string | number) => Promise<void>
  /** 清空整表 */
  clearStore: (store: DbStoreName) => Promise<void>
  /** 条件过滤（两端都用 JS 过滤，避免索引语义跨端不一致） */
  filter: <T>(store: DbStoreName, predicate: (record: T) => boolean) => Promise<T[]>
  /** 条件删除 */
  removeWhere: <T>(store: DbStoreName, predicate: (record: T) => boolean) => Promise<void>
  /** 按会话分页取消息（按 sendTime 由新到旧取一页，返回时升序） */
  getMessageListByConversation: (
    clientConversationId: string,
    options?: { beforeSendTime?: number, limit?: number }
  ) => Promise<MessageDO[]>
  /** 读取设置 */
  getSetting: <T>(key: string) => Promise<T | undefined>
  /** 写入设置 */
  setSetting: <T>(key: string, value: T) => Promise<void>
}

/** 会话主键：`${type}:${targetId}` */
export function getClientConversationId(type: number, targetId: number): string {
  return `${type}:${targetId}`
}

// TODO @AI：这个没有被使用，需要保留么？
/** 解析会话主键 */
export function parseClientConversationId(
  clientConversationId: string,
): { type: number, targetId: number } | null {
  const [typeText, targetIdText] = clientConversationId.split(':')
  const type = Number(typeText)
  const targetId = Number(targetIdText)
  if (!Number.isFinite(type) || !Number.isFinite(targetId) || targetId <= 0) {
    return null
  }
  return { type, targetId }
}

/** 服务端消息主键 */
export function getServerMessageKey(conversationType: number, id: number): string {
  return `${conversationType}:${id}`
}

/** 客户端临时消息主键 */
export function getClientMessageKey(clientMessageId: string): string {
  return `client:${clientMessageId}`
}

/** 解析消息主键 */
// TODO @AI：这个没有被使用，需要保留么？
export function parseMessageKey(
  messageKey: string,
):
  | { kind: 'client', clientMessageId: string }
  | { kind: 'server', conversationType: number, id: number }
  | null {
  if (!messageKey) {
    return null
  }
  if (messageKey.startsWith('client:')) {
    const clientMessageId = messageKey.slice('client:'.length)
    return clientMessageId ? { kind: 'client', clientMessageId } : null
  }
  const [conversationTypeText, idText] = messageKey.split(':')
  const conversationType = Number(conversationTypeText)
  const id = Number(idText)
  if (!Number.isFinite(conversationType) || !Number.isFinite(id) || id <= 0) {
    return null
  }
  return { kind: 'server', conversationType, id }
}
