/** 私聊离线消息每页数量 */
export const MESSAGE_PRIVATE_PULL_SIZE = 100

/** 群聊与频道离线消息每页数量 */
export const MESSAGE_GROUP_PULL_SIZE = 100

/** 好友申请每页数量 */
export const FRIEND_REQUEST_PAGE_SIZE = 100

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

/** 最近转发会话数量上限 */
export const CONVERSATION_RECENT_FORWARD_MAX = 12

/** RTC 未应答检查间隔 */
export const RTC_NO_ANSWER_CALL_CHECK_INTERVAL_MS = 60 * 1000

/** App 通话试验开关：renderjs 视图层运行 LiveKit，未经真机验收，需显式配置 VITE_IM_RTC_APP_ENABLED=true 开启 */
export const RTC_APP_ENABLED = import.meta.env.VITE_IM_RTC_APP_ENABLED === 'true'

/** App 通话视图层释放房间的最长等待，视图层已销毁时不阻塞页面收尾 */
export const RTC_APP_DISPOSE_TIMEOUT_MS = 3000

/**
 * 解析小程序通话网关地址；开关未开启或地址不合法时为空，小程序不显示通话入口
 *
 * 仅允许 https，开发构建额外允许本机回环 http 便于开发者工具联调
 */
function resolveRtcMpGatewayUrl() {
  if (import.meta.env.VITE_IM_RTC_MP_ENABLED !== 'true') {
    return ''
  }
  const url = (import.meta.env.VITE_IM_RTC_MP_GATEWAY_URL || '').replace(/\/+$/, '')
  if (/^https:\/\/[^/?#@\s]+(?:\/[^?#@\s]*)?$/.test(url)) {
    return url
  }
  if (import.meta.env.DEV && /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/[^?#@\s]*)?$/.test(url)) {
    return url
  }
  return ''
}

/** 小程序通话试验网关：经独立 RTMP 网关接入 LiveKit，秒级延迟，需同时配置 VITE_IM_RTC_MP_ENABLED=true 与网关地址 */
export const RTC_MP_GATEWAY_URL = resolveRtcMpGatewayUrl()

/** 小程序通话等待推流进房的最长时间 */
export const RTC_MP_CONNECT_TIMEOUT_MS = 30 * 1000

/** 小程序通话网关单次请求超时 */
export const RTC_MP_REQUEST_TIMEOUT_MS = 8000

/** 小程序通话接通后推流丢失的最长容忍时间，超过即结束本次通话 */
export const RTC_MP_PUBLISH_LOST_TIMEOUT_MS = 20 * 1000

/** WebSocket 首次重连等待 */
export const WS_RECONNECT_BASE_MS = 1000

/** WebSocket 重连等待上限 */
export const WS_RECONNECT_MAX_MS = 30 * 1000

/** WebSocket 重连随机抖动上限 */
export const WS_RECONNECT_JITTER_MS = 1000

/** 图片、视频和文件大小上限 */
const MESSAGE_FILE_MAX_MB = 16
export const MESSAGE_MEDIA_MAX_BYTES = MESSAGE_FILE_MAX_MB * 1024 * 1024

/** 语音文件大小上限 */
const MESSAGE_VOICE_MAX_MB = 5
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
