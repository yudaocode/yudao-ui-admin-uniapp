export type DecimalValue = number | string | null | undefined
export type InputNumberValue = number | string | undefined

/** 数量小数位 */
export const QUANTITY_PRECISION = 2
/** 金额小数位 */
export const PRICE_PRECISION = 2
/** 重量小数位 */
export const WEIGHT_PRECISION = 3
/** 长宽高小数位 */
export const DIMENSION_PRECISION = 1

function isNullOrUnDef(value: unknown) {
  return value === null || value === undefined
}

function toFiniteDecimal(value: DecimalValue) {
  if (isNullOrUnDef(value)) {
    return undefined
  }
  if (typeof value === 'string' && value.trim() === '') {
    return undefined
  }
  const decimalValue = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(decimalValue)) {
    return undefined
  }
  return decimalValue
}

/** 转换为接口可选数字 */
export function toOptionalNumber(value?: DecimalValue) {
  return toFiniteDecimal(value)
}

function sumDecimal<T>(list: T[], getter: (item: T) => DecimalValue) {
  return list.reduce((sum, item) => {
    const decimalValue = toFiniteDecimal(getter(item))
    return decimalValue === undefined ? sum : sum + decimalValue
  }, 0)
}

/** 格式化数量 */
export function formatQuantity(value?: number | string | null) {
  const decimalValue = toFiniteDecimal(value)
  return decimalValue === undefined ? '' : decimalValue.toFixed(QUANTITY_PRECISION)
}

/** 格式化金额 */
export function formatPrice(value?: number | string | null) {
  const decimalValue = toFiniteDecimal(value)
  return decimalValue === undefined ? '' : decimalValue.toFixed(PRICE_PRECISION)
}

/** 金额四舍五入 */
export function roundPrice(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(PRICE_PRECISION)) : undefined
}

/** 亏损数字样式 */
export function getLossClass(value?: number | string | null) {
  const decimalValue = toFiniteDecimal(value)
  return decimalValue !== undefined && decimalValue < 0 ? 'text-red-500' : ''
}

/** 数量 * 单价，计算金额 */
export function multiplyPrice(quantity?: DecimalValue, price?: DecimalValue) {
  const quantityValue = toFiniteDecimal(quantity)
  const priceValue = toFiniteDecimal(price)
  if (quantityValue === undefined || priceValue === undefined) {
    return undefined
  }
  return roundPrice(quantityValue * priceValue)
}

/** 金额 / 数量，反算单价 */
export function dividePrice(totalPrice?: DecimalValue, quantity?: DecimalValue) {
  const totalPriceValue = toFiniteDecimal(totalPrice)
  const quantityValue = toFiniteDecimal(quantity)
  if (totalPriceValue === undefined || !quantityValue) {
    return undefined
  }
  return roundPrice(totalPriceValue / quantityValue)
}

/** 汇总数量 */
export function sumQuantity<T>(list: T[], getter: (item: T) => DecimalValue) {
  return sumDecimal(list, getter)
}

/** 汇总金额 */
export function sumPrice<T>(list: T[], getter: (item: T) => DecimalValue) {
  return sumDecimal(list, getter)
}

/** 格式化汇总数量 */
export function formatSumQuantity<T>(list: T[], getter: (item: T) => DecimalValue) {
  return formatQuantity(sumQuantity(list, getter))
}

/** 格式化汇总金额 */
export function formatSumPrice<T>(list: T[], getter: (item: T) => DecimalValue) {
  return formatPrice(sumPrice(list, getter))
}

/** 格式化重量 */
export function formatWeight(value?: number | string | null) {
  const decimalValue = toFiniteDecimal(value)
  return decimalValue === undefined ? '' : decimalValue.toFixed(WEIGHT_PRECISION)
}

/** 格式化长宽高 */
export function formatDimension(value?: number | string | null) {
  const decimalValue = toFiniteDecimal(value)
  return decimalValue === undefined ? '' : decimalValue.toFixed(DIMENSION_PRECISION)
}

/** 格式化长宽高组合 */
export function formatDimensionText(
  length?: number | string | null,
  width?: number | string | null,
  height?: number | string | null,
) {
  if (!isNullOrUnDef(length) && !isNullOrUnDef(width) && !isNullOrUnDef(height)) {
    return [formatDimension(length), formatDimension(width), formatDimension(height)].join(' * ')
  }
  return [
    !isNullOrUnDef(length) ? `长：${formatDimension(length)}` : undefined,
    !isNullOrUnDef(width) ? `宽：${formatDimension(width)}` : undefined,
    !isNullOrUnDef(height) ? `高：${formatDimension(height)}` : undefined,
  ].filter(Boolean).join(' ')
}
