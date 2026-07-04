import type { DecimalValue } from '@/utils/format'
import { calculatePercentValue, formatDecimalValue, multiplyDecimalValue, roundDecimalValue, sumNumberValue } from '@/utils/format'

/** 数量小数位 */
export const ERP_COUNT_PRECISION = 3
/** 金额小数位 */
export const ERP_PRICE_PRECISION = 2
/** 四舍五入金额 */
export function roundPrice(value: DecimalValue) {
  return roundDecimalValue(value, ERP_PRICE_PRECISION)
}

/** 四舍五入数量 */
export function roundCount(value: DecimalValue) {
  return roundDecimalValue(value, ERP_COUNT_PRECISION)
}

/** 格式化数量（保留三位小数，去尾零） */
export function formatCount(value?: DecimalValue) {
  return formatDecimalValue(value, ERP_COUNT_PRECISION, { trimTrailingZeros: true })
}

/** 数量 * 单价，计算金额 */
export function multiplyPrice(count?: DecimalValue, price?: DecimalValue) {
  return multiplyDecimalValue(count, price, ERP_PRICE_PRECISION)
}

/** 计算百分比金额 */
export function calculatePercentPrice(price?: DecimalValue, percent?: DecimalValue) {
  return calculatePercentValue(price, percent, ERP_PRICE_PRECISION)
}

/** 计算税额 */
export function calculateTaxPrice(price?: DecimalValue, taxPercent?: DecimalValue) {
  return calculatePercentPrice(price, taxPercent)
}

/** 汇总数量 */
export function sumCount<T>(list: T[], getter: (item: T) => DecimalValue) {
  return sumNumberValue(list, getter)
}

/** 汇总金额 */
export function sumPrice<T>(list: T[], getter: (item: T) => DecimalValue) {
  return sumNumberValue(list, getter)
}
