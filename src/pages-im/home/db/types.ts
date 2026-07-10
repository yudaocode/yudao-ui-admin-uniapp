// IM 本地数据库：表结构、存储 key、记录类型
// 平台无关定义，H5(IndexedDB) 与 小程序/App(storage) 适配层共用

/** DB schema 版本（uniapp 端独立维护，与 PC 端无关） */
export const DB_SCHEMA_VERSION = 1

/** 数据表名 */
export type DbStoreName
  = | 'conversations'
    | 'conversationReads'
    | 'messages'
    | 'friends'
    | 'friendRequests'
    | 'groups'
    | 'groupMembers'
    | 'groupRequests'
    | 'channels'
    | 'settings'

/** 表索引定义（仅 IndexedDB 使用；storage 适配层用 filter 兜底） */
export interface StoreIndex {
  name: string
  keyPath: string | string[]
  unique?: boolean
}

/** 单表结构定义 */
export interface StoreSchema {
  /** 主键字段（所有表均为单字段主键） */
  keyPath: string
  /** 索引列表 */
  indexes: StoreIndex[]
}

/** 全部表结构；新增表只改这里，两套适配层自动覆盖 */
export const STORE_SCHEMA: Record<DbStoreName, StoreSchema> = {
  conversations: {
    keyPath: 'clientConversationId',
    indexes: [{ name: 'lastSendTime', keyPath: 'lastSendTime' }],
  },
  conversationReads: {
    keyPath: 'clientConversationId',
    indexes: [{ name: 'conversationType+targetId', keyPath: ['conversationType', 'targetId'], unique: true }],
  },
  messages: {
    keyPath: 'messageKey',
    indexes: [
      { name: 'clientConversationId', keyPath: 'clientConversationId' },
      { name: 'clientConversationId+sendTime', keyPath: ['clientConversationId', 'sendTime'] },
      { name: 'clientMessageId', keyPath: 'clientMessageId', unique: true },
    ],
  },
  friends: {
    keyPath: 'id',
    indexes: [
      { name: 'friendUserId', keyPath: 'friendUserId', unique: true },
      { name: 'status', keyPath: 'status' },
    ],
  },
  friendRequests: {
    keyPath: 'id',
    indexes: [{ name: 'status', keyPath: 'status' }, { name: 'createTime', keyPath: 'createTime' }],
  },
  groups: {
    keyPath: 'id',
    indexes: [{ name: 'name', keyPath: 'name' }, { name: 'status', keyPath: 'status' }],
  },
  groupMembers: {
    keyPath: 'id',
    indexes: [
      { name: 'groupId', keyPath: 'groupId' },
      { name: 'groupId+userId', keyPath: ['groupId', 'userId'], unique: true },
    ],
  },
  groupRequests: {
    keyPath: 'id',
    indexes: [{ name: 'status', keyPath: 'status' }, { name: 'createTime', keyPath: 'createTime' }],
  },
  channels: {
    keyPath: 'id',
    indexes: [{ name: 'status', keyPath: 'status' }, { name: 'sort', keyPath: 'sort' }],
  },
  settings: {
    keyPath: 'key',
    indexes: [],
  },
}

/** settings 表内的 key（拉取游标等） */
export const ImSettingKeys = {
  /** 私聊消息拉取游标 */
  privateMessageMaxId: 'privateMessageMaxId',
  /** 群聊消息拉取游标 */
  groupMessageMaxId: 'groupMessageMaxId',
  /** 频道消息拉取游标 */
  channelMessageMaxId: 'channelMessageMaxId',
  /** 会话读位置增量拉取游标 */
  conversationReadPullCursor: 'conversationReadPullCursor',
  /** 好友关系增量拉取游标 */
  friendPullCursor: 'friendPullCursor',
} as const

/** 设置记录 */
export interface SettingDO<T = unknown> {
  key: string
  value: T
  updateTime: number
}

/** 会话读位置记录 */
export interface ConversationReadDO {
  clientConversationId: string
  conversationType: number
  targetId: number
  messageId: number
  updateTime: number
}

/** 会话记录 */
export interface ConversationDO {
  /** 主键：`${type}:${targetId}` */
  clientConversationId: string
  type: number
  targetId: number
  name: string
  avatar: string
  unreadCount: number
  lastContent: string
  lastSendTime: number
  lastSenderId?: number
  lastMessageType?: number
  lastMessageId?: number
  lastClientMessageId?: string
  lastMessageStatus?: number
  lastReceiptStatus?: number
  lastSelfSend?: boolean
  lastSenderDisplayName?: string
  deleted?: boolean
  top?: boolean
  silent?: boolean
  atMe?: boolean
  atAll?: boolean
  draft?: { html?: string, plain?: string, reply?: any }
}

/** 消息记录 */
export interface MessageDO {
  /** 主键：服务端 `${conversationType}:${id}`，本地态 `client:${clientMessageId}` */
  messageKey: string
  clientConversationId: string
  conversationType: number
  id?: number
  clientMessageId: string
  type: number
  content: string
  status: number
  sendTime: number
  senderId: number
  targetId: number
  selfSend: boolean
  atUserIds?: number[]
  receiverUserIds?: number[]
  receiptStatus?: number
  readCount?: number
  materialId?: number
}
