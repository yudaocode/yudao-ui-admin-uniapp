import type { FormCreateApi, FormCreateOption, NormalizedFormCreateRule } from '../../../../types/typing'
import {
  isAlertTypeName,
  isAreaSelectTypeName,
  isButtonTypeName,
  isCalendarTypeName,
  isCascaderTypeName,
  isColorPickerTypeName,
  isDatePickerArrayValueType,
  isDatePickerTypeName,
  isDividerTypeName,
  isHiddenTypeName,
  isHtmlTypeName,
  isIframeTypeName,
  isImageTypeName,
  isInputNumberTypeName,
  isInputTypeName,
  isRichTextTypeName,
  isSelectTypeName,
  isSignatureTypeName,
  isSliderRangeTypeName,
  isSliderTypeName,
  isSubFormTypeName,
  isTagTypeName,
  isTextareaTypeName,
  isTimePickerTypeName,
  isTitleTypeName,
  isTransferTypeName,
  isTreeSelectTypeName,
  isUploadTypeName,
} from '../../../core/src/registry'
import { toArray } from '../../../utils/src'
import alias from './alias'

export const INTERNAL_LAYOUT_TITLE_TYPE = '__fcLayoutTitle'
export const INTERNAL_LAYOUT_GAP_TYPE = '__fcLayoutGap'

export function getWotType(rule: NormalizedFormCreateRule) {
  return alias[rule.type as keyof typeof alias] || rule.type
}

export function isInputType(rule: NormalizedFormCreateRule) {
  return isInputTypeName(rule.type)
}

export function isHiddenFieldType(rule: NormalizedFormCreateRule) {
  return isHiddenTypeName(rule.type)
}

export function isTextareaType(rule: NormalizedFormCreateRule) {
  return isTextareaTypeName(rule.type, rule.props)
}

export function isInputNumberType(rule: NormalizedFormCreateRule) {
  return isInputNumberTypeName(rule.type)
}

export function isDatePickerType(rule: NormalizedFormCreateRule) {
  return isDatePickerTypeName(rule.type) && !isDatePickerArrayValueType(rule.type, rule.props)
}

export function isTimePickerType(rule: NormalizedFormCreateRule) {
  return isTimePickerTypeName(rule.type)
}

export function isCascaderType(rule: NormalizedFormCreateRule) {
  return isCascaderTypeName(rule.type)
}

export function isCalendarType(rule: NormalizedFormCreateRule) {
  return isCalendarTypeName(rule.type) || isDatePickerArrayValueType(rule.type, rule.props)
}

export function isButtonType(rule: NormalizedFormCreateRule) {
  return isButtonTypeName(rule.type)
}

export function isUploadType(rule: NormalizedFormCreateRule) {
  return isUploadTypeName(rule.type)
}

export function isSubFormType(rule: NormalizedFormCreateRule) {
  return isSubFormTypeName(rule.type)
}

export function isTransferType(rule: NormalizedFormCreateRule) {
  return isTransferTypeName(rule.type)
}

export function isAlertType(rule: NormalizedFormCreateRule) {
  return isAlertTypeName(rule.type)
}

export function isTitleType(rule: NormalizedFormCreateRule) {
  return isTitleTypeName(rule.type)
}

export function isHtmlType(rule: NormalizedFormCreateRule) {
  return isHtmlTypeName(rule.type)
}

export function isDividerType(rule: NormalizedFormCreateRule) {
  return isDividerTypeName(rule.type)
}

export function isTagType(rule: NormalizedFormCreateRule) {
  return isTagTypeName(rule.type)
}

export function isImageType(rule: NormalizedFormCreateRule) {
  return isImageTypeName(rule.type)
}

export function isIframeType(rule: NormalizedFormCreateRule) {
  return isIframeTypeName(rule.type)
}

export function isRichTextType(rule: NormalizedFormCreateRule) {
  return isRichTextTypeName(rule.type)
}

export function isSignatureType(rule: NormalizedFormCreateRule) {
  return isSignatureTypeName(rule.type)
}

export function isLayoutTitleType(rule: NormalizedFormCreateRule) {
  return rule.type === INTERNAL_LAYOUT_TITLE_TYPE
}

export function isLayoutGapType(rule: NormalizedFormCreateRule) {
  return rule.type === INTERNAL_LAYOUT_GAP_TYPE
}

export function isSelectType(rule: NormalizedFormCreateRule) {
  return isSelectTypeName(rule.type)
}

export function isSliderType(rule: NormalizedFormCreateRule) {
  return isSliderTypeName(rule.type)
}

export function isSliderRangeType(rule: NormalizedFormCreateRule) {
  return isSliderRangeTypeName(rule.type, rule.props)
}

export function isColorPickerType(rule: NormalizedFormCreateRule) {
  return isColorPickerTypeName(rule.type)
}

export function isTreeSelectType(rule: NormalizedFormCreateRule) {
  return isTreeSelectTypeName(rule.type)
}

export function isApiSelectType(rule: NormalizedFormCreateRule) {
  return rule.type === 'ApiSelect'
}

export function isAreaSelectType(rule: NormalizedFormCreateRule) {
  return isAreaSelectTypeName(rule.type)
}

export function isDictSelectType(rule: NormalizedFormCreateRule) {
  return rule.type === 'DictSelect'
}

export function isUserSelectType(rule: NormalizedFormCreateRule) {
  return rule.type === 'UserSelect'
}

export function isDeptSelectType(rule: NormalizedFormCreateRule) {
  return rule.type === 'DeptSelect'
}

export function getInputType(rule: NormalizedFormCreateRule) {
  const typeMap: Record<string, string> = {
    email: 'email',
    password: 'password',
    search: 'search',
    text: 'text',
    url: 'url',
  }
  return rule.props?.type || typeMap[rule.type] || 'text'
}

export function getPlaceholder(rule: NormalizedFormCreateRule, prefix: '请输入' | '请选择' = '请输入') {
  return rule.props?.placeholder || `${prefix}${rule.title || ''}`
}

export function getTitleWidth(option: FormCreateOption) {
  return option.form?.titleWidth || option.form?.labelWidth || '200rpx'
}

export function getRuleProps(rule: NormalizedFormCreateRule) {
  const props = { ...(rule.props || {}) }
  Object.keys(props).forEach((key) => {
    if (/^on[A-Z]/.test(key) || key.startsWith('onUpdate:')) {
      delete props[key]
    }
  })
  delete props.disabled
  delete props.modelValue
  delete props.on
  delete props.onChange
  delete props.onClick
  delete props.options
  return props
}

export function toRuleEventHandlerName(eventName: string) {
  return `on${eventName
    .split(/[-_:]/)
    .filter(Boolean)
    .map(item => item.charAt(0).toUpperCase() + item.slice(1))
    .join('')}`
}

export function getRuleEventHandler(rule: NormalizedFormCreateRule, eventName: string) {
  const normalizedEventName = normalizeRuleEventName(eventName)
  const handlerName = toRuleEventHandlerName(normalizedEventName)
  return rule.on?.[normalizedEventName]
    || rule.on?.[eventName]
    || rule.props?.on?.[normalizedEventName]
    || rule.props?.on?.[eventName]
    || rule.props?.[handlerName]
    || rule.props?.[toRuleEventHandlerName(eventName)]
}

export interface NormalizedRuleEmitEvent {
  args: any[]
  inject: boolean
  name: string
}

export function getRuleEmitEvents(
  rule: NormalizedFormCreateRule,
  eventName: string,
  args: any[] = [],
  api?: FormCreateApi,
): NormalizedRuleEmitEvent[] {
  const normalizedEventName = normalizeRuleEventName(eventName)
  return toArray(rule.emit)
    .map(item => normalizeRuleEmitEvent(rule, normalizedEventName, item, args, api))
    .filter(Boolean) as NormalizedRuleEmitEvent[]
}

export function normalizeRuleEventName(eventName: string) {
  if (eventName === 'update:modelValue' || eventName === 'updateModelValue' || eventName === 'input') {
    return 'change'
  }
  return eventName
}

function normalizeRuleEmitEvent(
  rule: NormalizedFormCreateRule,
  eventName: string,
  emitConfig: any,
  args: any[],
  api?: FormCreateApi,
): NormalizedRuleEmitEvent | undefined {
  if (!emitConfig) {
    return undefined
  }
  const name = typeof emitConfig === 'string' ? emitConfig : emitConfig.name
  if (normalizeRuleEventName(name) !== eventName) {
    return undefined
  }
  const prefix = typeof emitConfig === 'object'
    ? emitConfig.prefix || emitConfig.emitPrefix || rule.emitPrefix || rule.field || rule.name
    : rule.emitPrefix || rule.field || rule.name
  if (!prefix) {
    return undefined
  }
  const inject = typeof emitConfig === 'object' ? emitConfig.inject !== false : true
  return {
    args: inject ? [...args, rule, api] : args,
    inject,
    name: toKebabCase(`${prefix}-${eventName}`),
  }
}

function toKebabCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_:.]+/g, '-')
    .toLowerCase()
}
