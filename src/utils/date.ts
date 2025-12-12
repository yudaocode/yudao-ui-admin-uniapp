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

/** 格式化日期时间 */
export function formatDateTime(time?: FormatDate) {
  return formatDate(time, 'YYYY-MM-DD HH:mm:ss')
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
