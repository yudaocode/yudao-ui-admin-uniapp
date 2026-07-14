/** IM 消息类型枚举 */
export const ImMessageType = {
  TEXT: 101,
  IMAGE: 102,
  VOICE: 103,
  VIDEO: 104,
  FILE: 105,
  MERGE: 107,
  CARD: 108,
  FACE: 115,
  MATERIAL: 125,
  RECALL: 2101,
  RECEIPT: 2200,
  READ: 2201,
  RTC_CALL: 1601,
  RTC_PARTICIPANT_CONNECTED: 1602,
  RTC_PARTICIPANT_DISCONNECTED: 1603,
  RTC_CALL_START: 1610,
  RTC_CALL_END: 1611,
  FRIEND_REQUEST_APPROVED: 1201,
  FRIEND_REQUEST_REJECTED: 1202,
  FRIEND_REQUEST_RECEIVED: 1203,
  FRIEND_ADD: 1204,
  FRIEND_DELETE: 1205,
  FRIEND_BLOCK: 1207,
  FRIEND_UNBLOCK: 1208,
  FRIEND_INFO_UPDATED: 1209,
  FRIEND_UPDATE: 1210,
  GROUP_CREATE: 1501,
  GROUP_INFO_UPDATE: 1502,
  GROUP_REQUEST_RECEIVED: 1503,
  GROUP_MEMBER_QUIT: 1504,
  GROUP_REQUEST_APPROVED: 1505,
  GROUP_REQUEST_REJECTED: 1506,
  GROUP_OWNER_TRANSFER: 1507,
  GROUP_MEMBER_KICK: 1508,
  GROUP_MEMBER_INVITE: 1509,
  GROUP_MEMBER_ENTER: 1510,
  GROUP_DISSOLVE: 1511,
  GROUP_MEMBER_MUTED: 1512,
  GROUP_MEMBER_CANCEL_MUTED: 1513,
  GROUP_MUTED: 1514,
  GROUP_CANCEL_MUTED: 1515,
  GROUP_MEMBER_NICKNAME_UPDATE: 1516,
  GROUP_ADMIN_ADD: 1517,
  GROUP_ADMIN_REMOVE: 1518,
  GROUP_NOTICE_UPDATE: 1519,
  GROUP_NAME_UPDATE: 1520,
  GROUP_MEMBER_SETTING_UPDATE: 1530,
  GROUP_MESSAGE_PIN: 1531,
  GROUP_MESSAGE_UNPIN: 1532,
  GROUP_BANNED: 1533,
} as const

/** IM 消息状态枚举 */
export const ImMessageStatus = {
  FAILED: -2,
  SENDING: -1,
  NORMAL: 0,
  RECALL: 2,
} as const

/** IM 消息回执状态 */
export const ImMessageReceiptStatus = {
  NO_RECEIPT: 0,
  PENDING: 1,
  DONE: 2,
} as const

/** IM 频道素材类型 */
export const ImChannelMaterialType = {
  CONTENT: 1,
  LINK: 2,
} as const

/** IM 频道消息接收范围 */
export const ImChannelMessageReceiverType = {
  ALL: 'all',
  USERS: 'users',
} as const

export type ImChannelMessageReceiverTypeValue
  = (typeof ImChannelMessageReceiverType)[keyof typeof ImChannelMessageReceiverType]

/** IM 会话类型枚举 */
export const ImConversationType = {
  NONE: 0,
  PRIVATE: 1,
  GROUP: 2,
  CHANNEL: 3,
} as const

/** IM 通话媒体类型 */
export const ImRtcCallMediaType = {
  VOICE: 1,
  VIDEO: 2,
} as const

/** IM 通话结束原因 */
export const ImRtcCallEndReason = {
  HANGUP: 1,
  REJECT: 2,
  CANCEL: 3,
  NO_ANSWER: 4,
  BUSY: 5,
  ERROR: 9,
} as const

/** IM 通话状态 */
export const ImRtcCallStatus = {
  CREATED: 10,
  RUNNING: 20,
  ENDED: 30,
} as const

/** IM 通话参与者状态 */
export const ImRtcParticipantStatus = {
  INVITING: 10,
  JOINED: 20,
  REJECTED: 30,
  NO_ANSWER: 40,
  LEFT: 50,
} as const

/** IM 通话页面阶段 */
export const ImRtcCallStage = {
  IDLE: 'idle',
  INVITING: 'inviting',
  INCOMING: 'incoming',
  RUNNING: 'running',
} as const

export type ImRtcCallStageValue = (typeof ImRtcCallStage)[keyof typeof ImRtcCallStage]

/** IM 群成员角色 */
export const ImGroupMemberRole = {
  OWNER: 1,
  ADMIN: 2,
  NORMAL: 3,
} as const

/** 好友申请处理结果 */
export const ImFriendRequestHandleResult = {
  UNHANDLED: 0,
  AGREED: 1,
  REFUSED: 2,
} as const

/** 加群申请处理结果 */
export const ImGroupRequestHandleResult = {
  UNHANDLED: 0,
  AGREED: 1,
  REFUSED: 2,
} as const

/** 好友添加来源 */
export const ImFriendAddSource = {
  SEARCH: 1,
  GROUP: 2,
  QR_CODE: 3,
  CARD: 4,
} as const

/** 加群来源 */
export const ImGroupAddSource = {
  SEARCH: 1,
  INVITE: 2,
  QR_CODE: 3,
  SHARE_LINK: 4,
} as const

/** @全体成员的特殊用户编号 */
export const IM_AT_ALL_USER_ID = -1

/** @全体成员的展示名 */
export const IM_AT_ALL_NICKNAME = '所有人'

/** 判断是否群广播事件 */
export function isGroupNotification(type: number): boolean {
  return type >= ImMessageType.GROUP_CREATE
    && type <= ImMessageType.GROUP_BANNED
    && type !== ImMessageType.GROUP_MEMBER_SETTING_UPDATE
}

/** 判断是否好友会话提示 */
export function isFriendChatTip(type: number): boolean {
  return type === ImMessageType.FRIEND_ADD || type === ImMessageType.FRIEND_DELETE
}

/** 判断是否通话提示 */
export function isRtcCallTip(type: number): boolean {
  return type === ImMessageType.RTC_CALL_START || type === ImMessageType.RTC_CALL_END
}

const IM_NORMAL_MESSAGE_TYPES: number[] = [ // 用户主动发送、需要计入未读的普通消息类型
  ImMessageType.TEXT,
  ImMessageType.IMAGE,
  ImMessageType.VOICE,
  ImMessageType.VIDEO,
  ImMessageType.FILE,
  ImMessageType.MERGE,
  ImMessageType.CARD,
  ImMessageType.FACE,
  ImMessageType.MATERIAL,
]

/** 判断是否普通消息 */
export function isNormalMessage(type: number): boolean {
  return IM_NORMAL_MESSAGE_TYPES.includes(type)
}
