// IM 本地数据库：表结构、存储 key 与记录类型
// 平台无关定义，H5(IndexedDB) 与 小程序/App(storage) 适配层共用

/** DB schema 版本（各端独立演进） */
export const DB_SCHEMA_VERSION = 2

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

/** IM 本地存储 key */
export const StorageKeys = {
  settings: {
    privateMessageMaxId: 'privateMessageMaxId',
    groupMessageMaxId: 'groupMessageMaxId',
    channelMessageMaxId: 'channelMessageMaxId',
    recentForwardConversationKeys: 'recentForwardConversationKeys',
    friendPullCursor: 'friendPullCursor',
    friendRequestPullCursor: 'friendRequestPullCursor',
    groupRequestPullCursor: 'groupRequestPullCursor',
    conversationReadPullCursor: 'conversationReadPullCursor',
    conversationClearBeforePrefix: 'conversationClearBefore:', // 移动端单会话清理边界
    conversationDeletedMessagesPrefix: 'conversationDeletedMessages:', // 移动端单条本地删除记录
  },
} as const

/** 兼容现有调用，后续 Store 逐文件改用 PC 的 StorageKeys.settings */
export const ImSettingKeys = StorageKeys.settings

export type {
  ChannelDO,
  ConversationDO,
  ConversationReadDO,
  FriendDO,
  FriendRequestDO,
  GroupDO,
  GroupMemberDO,
  GroupRequestDO,
  MessageDO,
  SettingDO,
} from '@/pages-im/home/types'
