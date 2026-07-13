/** 时间值转毫秒 */
export function toTimestamp(time?: number | string) {
  if (!time) {
    return 0
  }
  const timestamp = typeof time === 'number' ? time : new Date(time).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

/** 会话时间展示：今天 HH:mm / 昨天 / 今年 MM-DD / 跨年 YYYY-MM-DD */
export function formatConversationTime(timestamp?: number) {
  if (!timestamp) {
    return ''
  }
  const date = new Date(timestamp)
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  if (date.toDateString() === now.toDateString()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  if (date.getFullYear() === now.getFullYear()) {
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
