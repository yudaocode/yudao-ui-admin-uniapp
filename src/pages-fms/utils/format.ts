import type { VoucherWord } from '@/api/fms/config/voucher-word'
import dayjs from 'dayjs'

/** 构建凭证字选择项 */
export function buildFmsVoucherWordOptions(words: VoucherWord[]) {
  return words.map(item => ({ label: item.name, value: item.id! }))
}

/** 构建科目选择项，可按编码排序 */
export function buildFmsSubjectOptions<T extends { id?: number, code: string, name: string }>(subjects: T[], sortByCode = false) {
  const source = sortByCode
    ? [...subjects].sort((a, b) => a.code.localeCompare(b.code))
    : subjects
  return source.map(item => ({ label: `${item.code} ${item.name}`, value: item.id! }))
}

/** 格式化非空金额（空值返回空串） */
export function formatFmsMoney(value?: number | null): string {
  if (!value) {
    return ''
  }
  return Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** 格式化金额（空值按 0 展示） */
export function formatFmsAmount(value?: number | null): string {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** 格式化数量（未启用数量核算时展示 -） */
export function formatFmsQuantity(value?: number | null, enabled = true): string {
  return enabled
    ? Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 4 })
    : '-'
}

/** 格式化汇率 */
export function formatFmsExchangeRate(value?: number | null): string {
  return Number(value || 0).toLocaleString('zh-CN', {
    useGrouping: false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

/** 格式化科目余额（带方向） */
export function formatFmsSubjectBalance(value?: number | null, direction?: string): string {
  return `${direction ? `${direction} ` : ''}${Number(value || 0).toFixed(2)}`
}

/** 格式化科目展示名称（编码 + 名称 + 辅助核算） */
export function formatFmsSubjectDisplay(
  code?: string,
  name?: string,
  auxiliaryNames: (string | undefined)[] = [],
): string {
  if (!code && !name) {
    return ''
  }
  const names = auxiliaryNames.filter(Boolean)
  return `${code || ''} ${name || ''}${names.length ? ` / ${names.join('、')}` : ''}`
}

/** 格式化会计期间文案，例如 2025年第01期 至 2025年第03期 */
export function formatFmsPeriodLabel(startMonth: string, endMonth: string): string {
  const startLabel = dayjs(`${startMonth}-01`).format('YYYY年第MM期')
  const endLabel = dayjs(`${endMonth}-01`).format('YYYY年第MM期')
  return startLabel === endLabel ? startLabel : `${startLabel} 至 ${endLabel}`
}

/** 格式化会计期间为 picker 值（YYYY-MM → 时间戳） */
export function parseFmsMonth(month?: string): number | '' {
  if (!month) {
    return ''
  }
  const date = dayjs(`${month}-01`)
  return date.isValid() ? date.valueOf() : ''
}

/** 格式化 picker 时间戳为会计期间（YYYY-MM） */
export function formatFmsMonth(value?: number | string): string {
  if (!value) {
    return ''
  }
  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM') : ''
}

/** 格式化账套启用期间（yyyyMM 数字或日期时间 → YYYY-MM） */
export function formatFmsStartTime(value?: number | string | null): string {
  if (!value) {
    return ''
  }
  const text = String(value)
  if (/^\d{6}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4)}`
  }
  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM') : ''
}

const UPPERCASE_DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'] // 大写数字
const INTEGER_UNITS = ['', '拾', '佰', '仟'] // 四位内单位
const GROUP_UNITS = ['', '万', '亿', '兆'] // 分组单位

/** 格式化四位整数分组的中文大写 */
function formatIntegerGroup(value: number): string {
  let result = ''
  let zeroPending = false
  for (let position = 3; position >= 0; position--) {
    const unitValue = 10 ** position
    const digit = Math.floor(value / unitValue) % 10
    if (digit === 0) {
      if (result && value % unitValue > 0) {
        zeroPending = true
      }
      continue
    }
    if (zeroPending) {
      result += UPPERCASE_DIGITS[0]
    }
    result += `${UPPERCASE_DIGITS[digit]}${INTEGER_UNITS[position]}`
    zeroPending = false
  }
  return result
}

/** 格式化整数金额的中文大写 */
function formatIntegerAmount(value: number): string {
  const groups: number[] = []
  let remainingValue = value
  while (remainingValue > 0) {
    groups.unshift(remainingValue % 10000)
    remainingValue = Math.floor(remainingValue / 10000)
  }

  let result = ''
  let zeroPending = false
  groups.forEach((group, index) => {
    if (group === 0) {
      if (result) {
        zeroPending = true
      }
      return
    }
    if (result && (zeroPending || group < 1000)) {
      result += UPPERCASE_DIGITS[0]
    }
    result += `${formatIntegerGroup(group)}${GROUP_UNITS[groups.length - index - 1]}`
    zeroPending = false
  })
  return result
}

/** 格式化金额的中文大写（对齐 PC formatUppercaseMoney） */
export function formatFmsUppercaseMoney(value: number): string {
  if (!Number.isFinite(value)) {
    return ''
  }
  const amountInCents = Math.round(Math.abs(value) * 100)
  if (amountInCents === 0) {
    return '零元整'
  }

  const integerAmount = Math.floor(amountInCents / 100)
  const jiao = Math.floor((amountInCents % 100) / 10)
  const fen = amountInCents % 10
  let result = integerAmount ? `${formatIntegerAmount(integerAmount)}元` : ''
  if (jiao === 0 && fen === 0) {
    result += '整'
  } else {
    if (jiao > 0) {
      result += `${UPPERCASE_DIGITS[jiao]}角`
    } else if (integerAmount > 0 && fen > 0) {
      result += UPPERCASE_DIGITS[0]
    }
    if (fen > 0) {
      result += `${UPPERCASE_DIGITS[fen]}分`
    }
  }
  return value < 0 ? `负${result}` : result
}
