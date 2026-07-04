import { isEmptyValue } from './is'

/** 转换为数字（空值 / 非数字回退 0） */
export function toNumber(value: unknown) {
  if (isEmptyValue(value)) {
    return 0
  }
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? 0 : numberValue
}

/** 转换为有限数字（空值 / 非有限数字回退 undefined） */
export function toFiniteNumber(value: unknown) {
  if (isEmptyValue(value)) {
    return undefined
  }
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

/** 转换为可选数字（空值 / 非有限数字回退 undefined） */
export function toOptionalNumber(value: unknown) {
  return toFiniteNumber(value)
}

/** 转换为可选字符串（空值回退 undefined） */
export function toOptionalString(value: unknown) {
  return isEmptyValue(value) ? undefined : String(value)
}

/** 按指定精度四舍五入 */
export function roundDecimal(value: number, precision: number) {
  return Number(value.toFixed(precision))
}

/** 格式化数字展示：空值显示 0，非数字显示「-」 */
export function formatNumber(value: unknown): string {
  if (isEmptyValue(value)) {
    return '0'
  }
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? '-' : numberValue.toLocaleString()
}

/** 格式化 JSON 展示；字符串若不是合法 JSON 则原样返回 */
export function formatJson(value: unknown, fallback = '', space = 2): string {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  try {
    const jsonValue = typeof value === 'string' ? JSON.parse(value) : value
    return JSON.stringify(jsonValue, null, space)
  } catch {
    return typeof value === 'string' ? value : fallback
  }
}

/** 格式化金额：空值（null/undefined/''）显示「-」，否则保留两位小数，非数字也回退「-」 */
export function formatMoney(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  const amount = Number(value)
  return Number.isNaN(amount) ? '-' : amount.toFixed(2)
}

/** 分转元（数值；空值/非数字回退 0） */
export function fenToYuan(value: any) {
  if (value === undefined || value === null || value === '') {
    return 0
  }
  const amount = Number(value)
  return Number.isNaN(amount) ? 0 : amount / 100
}

/** 元转分（整数；空值/非数字回退 0） */
export function yuanToFen(value: any) {
  if (value === undefined || value === null || value === '') {
    return 0
  }
  const amount = Number(value)
  return Number.isNaN(amount) ? 0 : Math.round(amount * 100)
}

/** 格式化金额展示（分 → ￥x.xx）；空值显示「-」，非数字回退原值 */
export function formatDisplayMoney(value: any) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  const amount = Number(value)
  if (Number.isNaN(amount)) {
    return String(value)
  }
  return `￥${(amount / 100).toFixed(2)}`
}
