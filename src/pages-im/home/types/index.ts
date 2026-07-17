// ==================== WebSocket 帧 / 事件 ====================

/** 后端 WebSocket 统一帧结构 */
export interface WebSocketFrame {
  type: string // 帧类型，对齐 ImWebSocketMessageType
  content: string // 帧内容（JSON 字符串）
}

/** IM WebSocket 通知 DTO */
export interface ImNotificationWebSocketDTO {
  conversationType: number // 会话类型
  contentType: number // 内容类型
  payload: Record<string, any> // 负载数据
}

/** 无会话在线通知 */
export interface ImNoConversationNotification {
  type: number // 内容类型
  [key: string]: any
}

/** 私聊消息通知 */
export interface ImPrivateMessageNotification {
  id: number // 消息编号
  clientMessageId: string // 客户端消息编号
  senderId: number // 发送人编号
  receiverId: number // 接收人编号
  type: number // 内容类型
  content: string // 消息内容
  status: number // 消息状态
  receiptStatus?: number // 回执状态
  sendTime: string // 发送时间
}

/** 群聊消息通知 */
export interface ImGroupMessageNotification {
  id: number // 消息编号
  clientMessageId: string // 客户端消息编号
  senderId: number // 发送人编号
  groupId: number // 群编号
  type: number // 内容类型
  content: string // 消息内容
  status: number // 消息状态
  sendTime: string // 发送时间
  atUserIds?: number[] // 群 @ 目标用户列表
  receiverUserIds?: number[] // 群定向接收用户列表
  readCount?: number // 群回执已读人数
  receiptStatus?: number // 群回执状态
  readId?: number // 已读位置
}

/** 消息已读同步通知 */
export interface ImMessageReadNotification {
  id: number // 已读位置
  type: number // 内容类型
  senderId?: number // 发送人编号
  receiverId?: number // 私聊接收人编号
  groupId?: number // 群编号
  channelId?: number // 频道编号
  readId?: number // 已读位置
}

/** 消息回执通知 */
export interface ImMessageReceiptNotification {
  id: number // 消息编号
  type: number // 内容类型
  senderId?: number // 已读方用户编号
  receiverId?: number // 私聊接收人编号
  groupId?: number // 群编号
  readCount?: number // 群回执已读人数
  receiptStatus?: number // 群回执状态
}

// ==================== 本地会话 / 消息结构 ====================

/** 引用消息 */
export interface QuoteMessage {
  messageId: number // 引用消息编号
  senderId: number // 引用消息发送人编号
  type: number // 引用内容类型
  content: string // 引用消息内容
}

// 会话数据结构（前端自有结构，后端无对应实体）
export interface Conversation {
  // ========== 核心标识 ==========
  targetId: number // 会话目标编号：私聊=对方 userId；群聊=groupId
  type: number // 会话类型，对齐 ImConversationType

  // ========== 展示字段 ==========
  name: string // 展示名称（私聊=好友昵称；群聊=群名）
  avatar: string // 头像
  unreadCount: number // 未读数

  // ========== 最后一条消息事实索引 ==========
  lastContent: string // 会话列表展示的最后一条消息摘要
  lastSendTime: number // 最后一条消息时间，用于排序
  lastSenderId?: number // 发送人编号
  lastMessageType?: number // 内容类型
  lastMessageId?: number // 最后一条服务端消息编号
  lastClientMessageId?: string // 最后一条客户端消息编号
  lastMessageStatus?: number // 最后一条消息状态
  lastReceiptStatus?: number // 最后一条群回执状态
  lastSelfSend?: boolean // 是否自己发的
  lastSenderDisplayName?: string // 发送人显示名快照——仅作 utils/user.getSenderDisplayName 实时算不出真名时的 fallback

  // ========== UI 状态 ==========
  deleted?: boolean // 是否已删除（软删标记，持久化时过滤）
  top?: boolean // 是否置顶（排序时优先）
  silent?: boolean // 是否免打扰（不展示未读徽标 + 不响提示音）
  atMe?: boolean // 群聊：是否有人 @我
  atAll?: boolean // 群聊：是否有人 @全体成员
  atMessageId?: number // 移动端交互：最近一次 @我的消息编号，用于点击会话后定位
  atAllMessageId?: number // 移动端交互：最近一次 @全体成员的消息编号，用于点击会话后定位
  reportedReadMessageId?: number // 已上报到服务端的最大已读消息编号
  draft?: {
    html: string // PC 富文本草稿；移动端无富文本时固定为空字符串
    plain: string // 输入框纯文本
    reply?: QuoteMessage // 引用消息
  } // 输入框草稿
}

// 消息数据结构
export interface Message {
  // ========== 后端字段（对齐 ImPrivateMessageNotification / ImGroupMessageNotification） ==========
  id?: number // 服务端消息编号，发送中为空
  clientMessageId: string // 客户端消息编号，本地生成用于合并去重
  type: number // 内容类型，对齐 ImContentType
  content: string // 消息内容，JSON 字符串
  status: number // 消息状态，对齐 ImMessageStatus
  sendTime: number // 发送时间（前端转毫秒时间戳；后端为 LocalDateTime 字符串）
  senderId: number // 发送人编号
  atUserIds?: number[] // 群 @ 目标用户列表
  receiverUserIds?: number[] // 群定向接收用户列表
  receiptStatus?: number // 回执状态，对齐 ImMessageReceiptStatus（私聊 / 群 / 频道通用）
  readCount?: number // 群回执已读人数（仅群消息）
  materialId?: number // 关联频道素材编号（仅频道消息 type=MATERIAL）

  // ========== 前端扩展字段 ==========
  // 发送人显示名一律渲染时实时算：utils/user.getSenderDisplayName / getSenderRealNickname
  // 不在 Message 上存任何名字快照，避免备注 / 群昵称变更后历史消息显示陈旧
  targetId: number // 会话目标编号（私聊=对端 userId / 群聊=groupId），与 Conversation.targetId 一致
  selfSend: boolean // 是否自己发送（前端按 senderId 计算）
  uploadProgress?: number // 媒体消息上传进度（0-100）；status=SENDING 期间持续更新；ack 后置 undefined
  // 媒体消息内存中保留的原始 File；下划线前缀表示不进 JSON / 不持久化（IDB 恢复后必为 undefined）
  // 失败重试时按它重走上传；页面刷新后该字段丢失，恢复阶段直接 drop 整条消息
  _localFile?: File
  _ackMerging?: boolean // ack 合并中标记，不持久化
}

// ==================== 本地存储结构 ====================

/** 会话本地存储结构 */
export interface ConversationDO extends Conversation {
  clientConversationId: string // `${type}:${targetId}`
}

export interface ConversationRead {
  conversationType: number // 会话类型
  targetId: number // 会话目标编号
  messageId: number // 当前用户已读到的最大消息编号
  updateTime?: number // 更新时间
}

/** 会话读位置本地存储结构 */
export interface ConversationReadDO extends ConversationRead {
  clientConversationId: string // `${conversationType}:${targetId}`
}

/** 消息本地存储结构 */
export interface MessageDO extends Omit<Message, 'uploadProgress' | '_localFile' | '_ackMerging'> {
  messageKey: string // `${conversationType}:${id}` 或 `client:${clientMessageId}`
  conversationType: number // 会话类型，对齐 ImConversationType
  clientConversationId: string // ConversationDO.clientConversationId
}

/** 设置本地存储结构 */
export interface SettingDO<T = unknown> {
  key: string
  value: T
  updateTime?: number
}

// ==================== 群 / 群成员 ====================

// 群实体（前端内部结构）
export interface Group {
  // ========== 后端字段（对齐 ImGroupRespVO） ==========
  id: number // 群编号
  name: string // 群名称
  avatar?: string // 群头像
  notice?: string // 群公告
  ownerUserId?: number // 群主用户编号
  pinnedMessages?: Message[] // 群置顶消息列表
  mutedAll?: boolean // 是否全群禁言
  banned?: boolean // 是否被管理员封禁
  status?: number // 群状态（参见 CommonStatusEnum：0 正常 / 1 已解散）
  joinApproval?: boolean // 进群是否需群主 / 管理员审批
  joinStatus?: number // 当前登录用户在该群的成员状态（参见 CommonStatusEnum：0 在群 / 1 已退群）

  // ========== 前端扩展字段（user-per-group 维度） ==========
  silent?: boolean // 是否免打扰。从当前用户的 GroupMember 回填
  groupRemark?: string // 群备注。从当前用户的 GroupMember 回填（当前用户对该群的自定义名）
  members?: GroupMember[] // 群成员缓存（按需懒加载）
  infoLoaded?: boolean // 群详情是否已加载，本轮会话内存标记，不持久化
  activeCallLoaded?: boolean // 群活跃通话是否已探测，本轮会话内存标记，不持久化
  activeCallExpired?: boolean // 群活跃通话探测是否已过期
  membersLoaded?: boolean // members 是否完整加载
  membersExpired?: boolean // 群成员缓存是否已过期
  memberCount?: number // 成员总数
}

/** 群本地存储结构 */
export type GroupDO = Omit<
  Group,
  | 'activeCallExpired'
  | 'activeCallLoaded'
  | 'infoLoaded'
  | 'members'
  | 'membersLoaded'
  | 'membersExpired'
>

// 群成员实体（前端内部结构）
export interface GroupMember {
  // ========== 后端字段（对齐 ImGroupMemberRespVO） ==========
  id?: number // 群成员关系编号
  groupId: number // 群编号
  userId: number // 用户编号
  avatar?: string // 头像
  nickname: string // 用户昵称
  displayUserName?: string // 该成员在群内自定义昵称
  status?: number // 在群 / 退群状态，对齐 CommonStatusEnum
  role?: number // 成员角色，参见 ImGroupMemberRole 枚举
  muteEndTime?: string // 禁言到期时间（ISO 字符串）

  // ========== 前端扩展字段 ==========
  isOwner?: boolean // 是否群主
}

/** 群成员本地存储结构 */
export type GroupMemberDO = GroupMember

// ==================== 好友 ====================

/** 好友实体 */
export interface Friend {
  id?: number // 好友关系编号
  friendUserId: number // 好友用户编号
  nickname: string // 好友真实昵称
  nicknamePinyin?: string // 昵称拼音
  avatar?: string // 好友头像
  silent?: boolean // 是否免打扰
  displayName?: string // 好友备注
  displayNamePinyin?: string // 备注拼音
  status?: number // 好友状态
  addSource?: number // 添加来源
  pinned?: boolean // 是否置顶联系人
  blocked?: boolean // 是否拉黑
  addTime?: number // 添加好友时间
  deleteTime?: number // 删除好友时间
}

/** 好友本地存储结构 */
export type FriendDO = Friend

/** 好友申请 */
export interface FriendRequest {
  id: number // 申请编号
  fromUserId: number // 发起方用户编号
  toUserId: number // 接收方用户编号
  handleResult: number // 处理结果
  applyContent?: string // 申请理由
  handleContent?: string // 处理理由
  addSource?: number // 添加来源
  handleTime?: number // 处理时间
  createTime: number // 创建时间
  fromNickname?: string // 发起方昵称
  fromAvatar?: string // 发起方头像
  toNickname?: string // 接收方昵称
  toAvatar?: string // 接收方头像
}

/** 好友申请本地存储结构 */
export type FriendRequestDO = FriendRequest

/** 加群申请本地存储结构 */
export type GroupRequestDO = import('@/api/im/group/request').ImGroupRequestRespVO

/** 频道本地存储结构 */
export type ChannelDO = import('@/api/im/manager/channel').ImManagerChannelVO

/** 用户精简信息 */
export interface User {
  id: number
  nickname?: string
  avatar?: string
  sex?: number
  deptId?: number
  deptName?: string
}

/** 好友列表行 */
export interface FriendLite {
  id: number
  nickname: string
  nicknamePinyin?: string
  avatar?: string
  displayName?: string
  displayNamePinyin?: string
}

/** 群列表行 */
export interface GroupLite {
  id: number
  name?: string
  showGroupName?: string
  showImage?: string
  showImageThumb?: string
  memberCount?: number
  ownerId?: number
  joinApproval?: boolean
}
