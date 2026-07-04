import type {
  FormCreateOptionItem,
  FormCreateRule,
  FormCreateValue,
  NormalizedFormCreateRule,
} from '../../../types/typing'
import { getRuleChildren, hasOwn, isEmptyValue } from '../../utils/src'
import {
  isCalendarArrayValueType,
  isCalendarTypeName,
  isCascaderTypeName,
  isDatePickerArrayValueType,
  isInputNumberTypeName,
  isMultipleValueType,
  isSliderRangeTypeName,
  isSubFormTypeName,
  isTransferTypeName,
} from './registry'

export function normalizeRules(rules: FormCreateRule[] = []): NormalizedFormCreateRule[] {
  const result: NormalizedFormCreateRule[] = []
  const walk = (rule: FormCreateRule | undefined, indexPath: string) => {
    if (!rule) {
      return
    }
    const children = getRuleChildren(rule)
    if (!rule.field && children.length > 0) {
      walkChildren(children, indexPath)
      return
    }
    result.push({
      ...rule,
      props: { ...(rule.props || {}) },
      options: normalizeOptions(rule.options || rule.props?.options),
      __fcId: rule.__fcId || `${rule.field || rule.type || 'field'}_${indexPath}`,
      __originType: rule.__originType || rule.type,
    })
  }
  const walkChildren = (children: FormCreateRule[], indexPath: string) => {
    children.forEach((child, index) => walk(child, `${indexPath}_${index}`))
  }
  rules.forEach((rule, index) => walk(rule, String(index)))
  return result
}

export function normalizeOptions(options?: FormCreateOptionItem[]) {
  if (!Array.isArray(options)) {
    return []
  }
  return options.map(item => ({
    ...item,
    label: item.label ?? item.text ?? String(item.value ?? ''),
    text: item.text ?? item.label ?? String(item.value ?? ''),
  }))
}

export function getDefaultValueByType(type: string): FormCreateValue {
  if (
    type === 'checkbox'
    || type === 'selectMultiple'
    || ['upload', 'uploadFile', 'uploadImage', 'uploadImages', 'FileUpload', 'ImagesUpload', 'UploadImgs'].includes(type)
    || isSubFormTypeName(type)
    || isTransferTypeName(type)
  ) {
    return []
  }
  if (['ImageUpload', 'UploadImg', 'UploadFile'].includes(type)) {
    return ''
  }
  if (type === 'switch') {
    return false
  }
  if (isInputNumberTypeName(type)) {
    return undefined
  }
  if (type === 'rate' || type === 'slider') {
    return 0
  }
  if (type === 'sliderRange') {
    return [0, 100]
  }
  return ''
}

export function createInitialFormData(
  rules: NormalizedFormCreateRule[],
  values: Record<string, any> = {},
) {
  const data: Record<string, any> = {}
  rules.forEach((rule) => {
    if (!rule.field) {
      return
    }
    if (hasOwn(values, rule.field)) {
      data[rule.field] = values[rule.field]
    } else if (rule.value !== undefined) {
      data[rule.field] = rule.value
    } else {
      data[rule.field] = getDefaultValue(rule)
    }
  })
  return data
}

export function getDefaultValue(rule: NormalizedFormCreateRule): FormCreateValue {
  if ((rule.type === 'select' || rule.type === 'selectMultiple' || rule.type.endsWith('Select') || rule.type === 'treeSelectMultiple') && isMultipleValueType(rule.type, rule.props)) {
    return []
  }
  if (isSliderRangeTypeName(rule.type, rule.props)) {
    return [rule.props?.min ?? 0, rule.props?.max ?? 100]
  }
  if (isCascaderTypeName(rule.type)) {
    const emitPath = rule.props?.emitPath ?? rule.props?.props?.emitPath
    if (emitPath !== false) {
      return []
    }
  }
  if (isCalendarTypeName(rule.type)) {
    if (isCalendarArrayValueType(rule.type, rule.props)) {
      return []
    }
  }
  if (isDatePickerArrayValueType(rule.type, rule.props)) {
    return []
  }
  return getDefaultValueByType(rule.type)
}

export function getAllowedFieldSet(rules: FormCreateRule[]) {
  return new Set(rules.map(rule => rule.field).filter(Boolean) as string[])
}

export function getRuleEffect(rule: FormCreateRule, name: string) {
  const effectKey = `$${name}`
  if (hasOwn(rule, effectKey)) {
    return rule[effectKey]
  }
  if (rule.effect && hasOwn(rule.effect, name)) {
    return rule.effect[name]
  }
  return undefined
}

export function isRuleHidden(rule: FormCreateRule, state?: { controlHidden?: boolean, hidden?: boolean }) {
  return state?.hidden === true
    || state?.controlHidden === true
    || rule.hidden === true
    || rule.display === false
    || getRuleEffect(rule, 'hidden') === true
    || getRuleEffect(rule, 'display') === false
    || getRuleEffect(rule, 'show') === false
}

export function isRuleDisabled(globalDisabled: boolean, state?: { controlDisabled?: boolean, disabled?: boolean }, rule?: FormCreateRule) {
  return globalDisabled
    || state?.disabled === true
    || state?.controlDisabled === true
    || (rule ? getRuleEffect(rule, 'disabled') === true : false)
}

export { isEmptyValue }
