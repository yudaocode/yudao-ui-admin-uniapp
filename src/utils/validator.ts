/** 手机号正则表达式（中国） */
const MOBILE_REGEX = /^1[3-9]\d{9}$/

/** 邮箱正则表达式 */
const EMAIL_REGEX = /^[\w-]+(?:\.[\w-]+)*@[\w-]+(?:\.[\w-]+)+$/

/** IP 地址正则表达式（IPv4） */
// eslint-disable-next-line regexp/no-unused-capturing-group
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/

/**
 * 判断字符串是否为空白（null、undefined、空字符串或仅包含空白字符）
 *
 * @param value 值
 * @returns 是否为空白
 */
export function isBlank(value?: null | string): boolean {
  return !value || value.trim().length === 0
}

/**
 * 验证是否为手机号码（中国）
 *
 * @param value 值
 * @returns 是否为手机号码（中国）
 */
export function isMobile(value?: null | string): boolean {
  if (!value) {
    return false
  }
  return MOBILE_REGEX.test(value)
}

/**
 * 验证是否为邮箱
 *
 * @param value 值
 * @returns 是否为邮箱
 */
export function isEmail(value?: null | string): boolean {
  if (!value) {
    return false
  }
  return EMAIL_REGEX.test(value)
}

/**
 * 验证是否为 IP 地址（IPv4）
 *
 * @param value 值
 * @returns 是否为 IP 地址
 */
export function isIp(value?: null | string): boolean {
  if (!value) {
    return false
  }
  return IP_REGEX.test(value)
}
