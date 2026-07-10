import type { FormCreateApi, FormCreateRule, FormCreateValidateRule } from '../../../types/typing'
import { isEmptyValue } from './utils'

// eslint-disable-next-line regexp/no-unused-capturing-group -- 保留上游校验正则的匹配语义
const EMAIL_RE = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\])|(([a-z\-0-9]+\.)+[a-z]{2,}))$/i
// eslint-disable-next-line regexp/no-unused-capturing-group -- 保留上游校验正则的匹配语义
const IP_RE = /^(2(5[0-5]|[0-4]\d)|[01]?\d{1,2})(\.(2(5[0-5]|[0-4]\d)|[01]?\d{1,2})){3}$/
const PHONE_RE = /^(?:(?:\+|00)86)?1[3-9]\d{9}$/
// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-unused-capturing-group, regexp/no-useless-assertions -- 保留上游校验正则的匹配语义
const URL_RE = /^(?!mailto:)(?:http|https|ftp):\/\/(?:\S+@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}\.(?:\d\d?|1\d\d|2[0-4]\d|25[0-4])|(?:[a-z\u00A1-\uFFFF0-9]+-?)*[a-z\u00A1-\uFFFF0-9](?:\.(?:[a-z\u00A1-\uFFFF0-9]+-?)*[a-z\u00A1-\uFFFF0-9])*\.[a-z\u00A1-\uFFFF]{2,}|localhost)(?::\d{2,5})?(?:([/?#])\S*)?$/i

export async function validateFormCreateRule(
  value: unknown,
  validateRule: FormCreateValidateRule,
  rule: FormCreateRule,
  api?: FormCreateApi,
): Promise<string | undefined> {
  const failedKey = validateBuiltinRule(value, validateRule, rule, api)
  if (failedKey) {
    return getValidateMessage(validateRule, rule, failedKey)
  }

  if (validateRule.validator) {
    const result = await validateRule.validator(value, rule, api)
    if (result === false || typeof result === 'string') {
      return typeof result === 'string' ? result : getValidateMessage(validateRule, rule, 'validator')
    }
  }
}

function validateBuiltinRule(
  value: unknown,
  validateRule: FormCreateValidateRule,
  rule: FormCreateRule,
  api?: FormCreateApi,
) {
  const empty = isEmptyValue(value)
  if (empty) {
    return validateRule.required ? 'required' : undefined
  }

  for (const [key, config] of Object.entries(validateRule)) {
    switch (key) {
      case 'required':
      case 'message':
      case 'trigger':
      case 'validator':
        break
      case 'len':
      case 'maxLen':
      case 'minLen':
        if (!validateLength(value, key, config)) {
          return key
        }
        break
      case 'pattern':
        if (!validatePattern(value, config)) {
          return key
        }
        break
      case 'uppercase':
        if (config && (typeof value !== 'string' || !/^[A-Z]*$/.test(value))) {
          return key
        }
        break
      case 'lowercase':
        if (config && (typeof value !== 'string' || !/^[a-z]*$/.test(value))) {
          return key
        }
        break
      case 'min':
      case 'max':
      case 'positive':
      case 'negative':
      case 'integer':
      case 'number':
        if (!validateMinMaxOrNumber(value, key, config)) {
          return key
        }
        break
      case 'equal':
        if (value !== config) {
          return key
        }
        break
      case 'enum':
        if (Array.isArray(config) && !config.includes(value as never)) {
          return key
        }
        break
      case 'hasKeys':
        if (!validateHasKeys(value, config)) {
          return key
        }
        break
      case 'email':
      case 'url':
      case 'ip':
      case 'phone':
        if (config !== false && !validatePresetPattern(value, key)) {
          return key
        }
        break
      case 'type':
        if (!validateType(value, config)) {
          return key
        }
        break
      case 'computed':
        if (!validateComputed(config, value, rule, api)) {
          return key
        }
        break
      default:
        break
    }
  }
}

function validateLength(value: unknown, key: string, rule: unknown) {
  const length = Array.isArray(value)
    ? value.length
    : typeof value === 'object'
      ? undefined
      : String(value).length
  if (length === undefined) {
    return false
  }
  const expected = Number(rule)
  if (!Number.isFinite(expected)) {
    return true
  }
  if (key === 'len') {
    return length === expected
  }
  if (key === 'maxLen') {
    return length <= expected
  }
  return length >= expected
}

function validatePattern(value: unknown, pattern: unknown) {
  try {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern as RegExp
    return regex?.test(String(value)) !== false
  } catch {
    return false
  }
}

function validateMinMaxOrNumber(value: unknown, key: string, rule: unknown) {
  if ((key === 'min' || key === 'max') && (typeof value === 'string' || Array.isArray(value))) {
    return validateLength(value, key === 'min' ? 'minLen' : 'maxLen', rule)
  }
  const number = Number(value)
  if (Number.isNaN(number)) {
    return false
  }
  if (key === 'min') {
    return number >= Number(rule)
  }
  if (key === 'max') {
    return number <= Number(rule)
  }
  if (key === 'positive') {
    return number > 0
  }
  if (key === 'negative') {
    return number < 0
  }
  if (key === 'integer') {
    return Number.isInteger(number)
  }
  return true
}

function validateHasKeys(value: unknown, keys: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  return !Array.isArray(keys) || keys.every(key => key in value)
}

function validatePresetPattern(value: unknown, key: string) {
  const text = String(value)
  if (key === 'email') {
    return EMAIL_RE.test(text)
  }
  if (key === 'url') {
    return URL_RE.test(text)
  }
  if (key === 'ip') {
    return IP_RE.test(text)
  }
  return PHONE_RE.test(text)
}

function validateType(value: unknown, type: unknown) {
  switch (type) {
    case 'array':
      return Array.isArray(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'date':
      return value instanceof Date || !Number.isNaN(Date.parse(String(value)))
    case 'email':
      return EMAIL_RE.test(String(value))
    case 'float':
    case 'number':
      return !Number.isNaN(Number(value))
    case 'integer':
      return Number.isInteger(Number(value))
    case 'object':
      return !!value && typeof value === 'object' && !Array.isArray(value)
    case 'string':
      return typeof value === 'string'
    case 'url':
      return URL_RE.test(String(value))
    default:
      return true
  }
}

function validateComputed(config: unknown, value: unknown, rule: FormCreateRule, api?: FormCreateApi) {
  if (typeof config === 'boolean') {
    return config
  }
  if (typeof config === 'function') {
    return config(value, rule, api) !== false
  }
  if (config && typeof config === 'object' && typeof (config as { handler?: unknown }).handler === 'function') {
    return (config as { handler: (...args: any[]) => any }).handler(value, rule, api) !== false
  }
  return true
}

function getValidateMessage(validateRule: FormCreateValidateRule, rule: FormCreateRule, failedKey: string) {
  if (validateRule.message) {
    return validateRule.message
  }
  const title = rule.title || '该字段'
  if (failedKey === 'required') {
    return `${title}不能为空`
  }
  if (failedKey === 'pattern' || failedKey === 'email' || failedKey === 'url' || failedKey === 'ip' || failedKey === 'phone') {
    return `${title}格式不正确`
  }
  return `${title}校验失败`
}
