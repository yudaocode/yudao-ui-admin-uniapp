import dayjs from 'dayjs'

type FormatDate = Date | dayjs.Dayjs | number | string

type Format
  = | 'HH'
    | 'HH:mm'
    | 'HH:mm:ss'
    | 'YYYY'
    | 'YYYY-MM'
    | 'YYYY-MM-DD'
    | 'YYYY-MM-DD HH'
    | 'YYYY-MM-DD HH:mm'
    | 'YYYY-MM-DD HH:mm:ss'
    | (string & {})

/** 格式化日期 */
export function formatDate(time?: FormatDate, format: Format = 'YYYY-MM-DD') {
  if (!time) {
    return ''
  }
  try {
    const date = dayjs.isDayjs(time) ? time : dayjs(time)
    if (!date.isValid()) {
      throw new Error('Invalid date')
    }
    return date.format(format)
  } catch (error) {
    console.error(`Error formatting date: ${error}`)
    return String(time ?? '')
  }
}

/** 格式化可选日期 */
export function formatOptionalDate(time?: FormatDate, format: Format = 'YYYY-MM-DD') {
  return formatDate(time, format) || undefined
}

/** 格式化日期时间 */
export function formatDateTime(time?: FormatDate) {
  return formatDate(time, 'YYYY-MM-DD HH:mm:ss')
}

/** 格式化可选日期时间 */
export function formatOptionalDateTime(time?: FormatDate) {
  return formatOptionalDate(time, 'YYYY-MM-DD HH:mm:ss')
}

/** 提取日期文本 */
function getDateText(time?: FormatDate) {
  if (typeof time === 'string') {
    const matched = time.match(/^\d{4}-\d{2}-\d{2}/)
    return matched ? matched[0] : formatDate(time)
  }
  return formatDate(time)
}

/** 格式化为日期文本（yyyy-MM-dd） */
export function formatDateOnly(time?: FormatDate) {
  return getDateText(time)
}

/** 日期转当天开始时间 */
export function formatDateStartTime(time?: FormatDate) {
  const date = formatDateOnly(time)
  return date ? `${date} 00:00:00` : ''
}

/** 日期转当天结束时间 */
export function formatDateEndTime(time?: FormatDate) {
  const date = formatDateOnly(time)
  return date ? `${date} 23:59:59` : ''
}

/** 格式化趋势日期 */
export function formatTrendDate(time?: FormatDate) {
  if (!time) {
    return '-'
  }
  if (typeof time === 'string') {
    const matched = time.match(/(\d{1,2})-(\d{1,2})$/)
    if (matched) {
      return `${matched[1]}-${matched[2]}`
    }
  }
  return formatDate(time, 'MM-DD') || String(time)
}

/** HH:mm 补秒为 HH:mm:ss（对齐后端 LocalTime；time 选择器只产出 HH:mm） */
export function padTimeSeconds(time?: string) {
  return time && time.length === 5 ? `${time}:00` : time
}

/** HH:mm:ss 去秒为 HH:mm（padTimeSeconds 的逆；回显给只接受 HH:mm 的 time 选择器） */
export function trimTimeSeconds(time?: string) {
  return (time || '').slice(0, 5)
}

/**
 * 转毫秒时间戳：数字 / 纯数字串原样取值；日期串把 `-` 换 `/` 再解析，
 * 兼容 iOS/JSCore（`new Date('YYYY-MM-DD HH:mm:ss')` 在其上返回 NaN）。无法解析返回 NaN。
 */
export function toTimestamp(time?: FormatDate): number {
  if (typeof time === 'number') {
    return time
  }
  if (dayjs.isDayjs(time) || time instanceof Date) {
    return dayjs(time).valueOf()
  }
  const str = String(time ?? '')
  return /^\d+$/.test(str) ? Number(str) : Date.parse(str.replace(/-/g, '/'))
}

/** 计算开始结束时间 */
export function formatDateRange(dateRange?: [any, any]) {
  if (!dateRange || !dateRange[0] || !dateRange[1]) {
    return undefined
  }
  const startDate = new Date(dateRange[0])
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(dateRange[1])
  endDate.setHours(23, 59, 59, 999)
  return [formatDateTime(startDate), formatDateTime(endDate)]
}

/** 会话/消息列表时间：今天显示 HH:mm，今年显示 MM-DD，更早显示 YYYY-MM-DD */
export function formatChatTime(time?: FormatDate): string {
  if (!time) {
    return ''
  }
  const date = dayjs.isDayjs(time) ? time : dayjs(time)
  if (!date.isValid()) {
    return ''
  }
  const now = dayjs()
  if (date.isSame(now, 'day')) {
    return date.format('HH:mm')
  }
  if (date.isSame(now, 'year')) {
    return date.format('MM-DD')
  }
  return date.format('YYYY-MM-DD')
}

/** 格式化过去时间（如：3分钟前、2小时前、1天前） */
export function formatPast(time?: FormatDate): string {
  if (!time) {
    return ''
  }
  const now = Date.now()
  const date = dayjs.isDayjs(time) ? time : dayjs(time)
  if (!date.isValid()) {
    return ''
  }
  const diff = now - date.valueOf()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) {
    return `${years}年前`
  }
  if (months > 0) {
    return `${months}个月前`
  }
  if (days > 0) {
    return `${days}天前`
  }
  if (hours > 0) {
    return `${hours}小时前`
  }
  if (minutes > 0) {
    return `${minutes}分钟前`
  }
  return '刚刚'
}
