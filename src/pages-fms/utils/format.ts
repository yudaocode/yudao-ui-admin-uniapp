import dayjs from 'dayjs'
import { FmsFinanceIndicatorTypeOptions } from './constants'

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

/** 格式化财务指标取数报表类型 */
export function formatFmsFinanceIndicatorType(value?: number | null): string {
  return FmsFinanceIndicatorTypeOptions.find(item => item.value === value)?.label || '-'
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
