/** 消息增量拉取每页数量 */
export const MESSAGE_PULL_PAGE_SIZE = 100

/** 单会话本地最多保留消息数 */
export const MESSAGE_LOCAL_MAX_COUNT = 1200

/** 聊天记录每页数量 */
export const MESSAGE_CHAT_PAGE_SIZE = 30

/** 消息时间提示间隔 */
export const MESSAGE_TIME_TIP_GAP_MS = 5 * 60 * 1000

/** 图片、视频和文件大小上限 */
export const MESSAGE_MEDIA_MAX_BYTES = 16 * 1024 * 1024

/** 语音文件大小上限 */
export const MESSAGE_VOICE_MAX_BYTES = 5 * 1024 * 1024

export const DANGEROUS_FILE_EXTENSIONS = new Set([ // 禁止发送的危险文件扩展名
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
])
