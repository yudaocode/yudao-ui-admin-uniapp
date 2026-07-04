/** 判断是否为空值 */
export function isEmptyValue(value: unknown) {
  return value === undefined
    || value === null
    || (typeof value === 'string' && value.trim() === '')
    || (Array.isArray(value) && value.length === 0)
}
