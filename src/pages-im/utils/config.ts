/** 私聊离线消息每页数量 */
export const MESSAGE_PRIVATE_PULL_SIZE = 100

/** 群聊与频道离线消息每页数量 */
export const MESSAGE_GROUP_PULL_SIZE = 100

/** 好友申请每页数量 */
export const FRIEND_REQUEST_PAGE_SIZE = 100

/** 加群申请每页数量 */
export const GROUP_REQUEST_PAGE_SIZE = 100

/** 后端允许撤回的时间限制 */
export const MESSAGE_RECALL_TIMEOUT_MINUTES = 5

/** 私聊离线消息最大拉取天数 */
export const MESSAGE_PRIVATE_PULL_MAX_DAYS = 30

/** 群聊离线消息最大拉取天数 */
export const MESSAGE_GROUP_PULL_MAX_DAYS = 30

/** 单会话本地最多保留消息数 */
export const MESSAGE_LOCAL_MAX_COUNT = 1200

/** 聊天记录每页数量 */
export const MESSAGE_CHAT_PAGE_SIZE = 30

/** 消息时间提示间隔 */
export const MESSAGE_TIME_TIP_GAP_MS = 10 * 60 * 1000

/** 消息允许撤回的时间窗口 */
export const MESSAGE_RECALL_WINDOW_MS = 2 * 60 * 1000

/** 是否启用私聊已读 */
export const MESSAGE_PRIVATE_READ_ENABLED = true

/** 是否启用群聊已读与回执 */
export const MESSAGE_GROUP_READ_ENABLED = true

/** 合并转发消息预览行数 */
export const MESSAGE_MERGE_PREVIEW_LINES = 3

/** 群成员数量上限 */
export const GROUP_MAX_MEMBER = 500

/** 群管理员数量上限 */
export const GROUP_ADMIN_MAX_COUNT = 3

/** 群置顶消息数量上限 */
export const GROUP_PIN_MAX_COUNT = 5

/** 最近转发会话数量上限 */
export const CONVERSATION_RECENT_FORWARD_MAX = 12

/** RTC 未应答检查间隔 */
export const RTC_NO_ANSWER_CALL_CHECK_INTERVAL_MS = 60 * 1000

/** WebSocket 首次重连等待 */
export const WS_RECONNECT_BASE_MS = 1000

/** WebSocket 重连等待上限 */
export const WS_RECONNECT_MAX_MS = 30 * 1000

/** WebSocket 重连随机抖动上限 */
export const WS_RECONNECT_JITTER_MS = 1000

/** 图片、视频和文件大小上限 */
export const MESSAGE_IMAGE_MAX_MB = 16
export const MESSAGE_VIDEO_MAX_MB = 16
export const MESSAGE_FILE_MAX_MB = 16
export const MESSAGE_MEDIA_MAX_BYTES = MESSAGE_FILE_MAX_MB * 1024 * 1024

/** 语音文件大小上限 */
export const MESSAGE_VOICE_MAX_MB = 5
export const MESSAGE_VOICE_MAX_BYTES = MESSAGE_VOICE_MAX_MB * 1024 * 1024

export const DANGEROUS_FILE_EXTENSIONS = [ // 禁止发送的危险文件扩展名
  'exe',
  'bat',
  'cmd',
  'com',
  'msi',
  'scr',
  'pif',
  'vbs',
  'vbe',
  'wsf',
  'ws',
  'js',
  'jse',
  'jar',
  'sh',
  'app',
  'ps1',
  'reg',
  'html',
  'htm',
]
