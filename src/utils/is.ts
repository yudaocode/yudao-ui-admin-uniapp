/** 判断是否为空值 */
export function isEmptyValue(value: unknown) {
  return value === undefined
    || value === null
    || (typeof value === 'string' && value.trim() === '')
    || (Array.isArray(value) && value.length === 0)
}

/** 判断两个数组的元素及顺序是否一致 */
export function isSameArray<T>(left: T[] = [], right: T[] = []) {
  return left.length === right.length && left.every((item, index) => item === right[index])
}
