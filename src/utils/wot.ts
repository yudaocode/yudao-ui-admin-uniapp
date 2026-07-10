import type { FormSchema, FormSchemaIssue } from '@wot-ui/ui/components/wd-form/types'
import { isEmail, isMobile } from '@/utils/validator'
import { isEmptyValue } from '@/utils/is'

// ==================== 表单校验 ====================

type WotFormRuleRequired = boolean | ((model?: Record<string, any>) => boolean)
type WotFormRuleMessage = string | ((model?: Record<string, any>) => string)
type WotFormRuleValidatorResult = boolean | string | undefined | void

export interface WotFormRule {
  required?: WotFormRuleRequired // 是否必填，支持函数处理新增/编辑等动态场景
  message?: WotFormRuleMessage // 错误提示
  type?: 'email' | 'mobile' | 'number' // 内置类型校验（'number' 可省，运行时即 number 会自动按数值范围）
  min?: number // 最小值：数字值为数值下界，字符串/数组为长度下界（对齐 Element Plus）
  max?: number // 最大值：数字值为数值上界，字符串/数组为长度上界
  pattern?: RegExp // 正则校验
  validator?: (value: unknown, model: Record<string, any>) => Promise<WotFormRuleValidatorResult> | WotFormRuleValidatorResult // 自定义校验，返回 false 或错误文案表示校验不通过
}

export type WotFormRules = Record<string, WotFormRule | readonly WotFormRule[]>
export type WotFormRulesGetter = WotFormRules | (() => WotFormRules)

/** 创建 Wot UI 2.x FormSchema，规则写法接近 Element Plus FormRules */
export function createFormSchema(rules: WotFormRulesGetter): FormSchema {
  return {
    async validate(model) {
      const issues: FormSchemaIssue[] = []
      for (const [path, fieldRules] of Object.entries(getFormRules(rules))) {
        const value = getValueByPath(model, path)
        for (const rule of normalizeFormRules(fieldRules)) {
          if (isRuleRequired(rule, model) && isEmptyValue(value)) {
            issues.push(createFormIssue(path, getRuleMessage(rule, model, '该字段不能为空')))
            break
          }
          if (isEmptyValue(value)) {
            continue
          }
          if (rule.type === 'email' && !isEmail(String(value))) {
            issues.push(createFormIssue(path, getRuleMessage(rule, model, '请输入正确的邮箱地址')))
            break
          }
          if (rule.type === 'mobile' && !isMobile(String(value))) {
            issues.push(createFormIssue(path, getRuleMessage(rule, model, '请输入正确的手机号码')))
            break
          }
          if (rule.min != null || rule.max != null) {
            const rangeError = getRangeError(rule, value)
            if (rangeError) {
              issues.push(createFormIssue(path, getRuleMessage(rule, model, rangeError)))
              break
            }
          }
          if (rule.pattern && !rule.pattern.test(String(value))) {
            issues.push(createFormIssue(path, getRuleMessage(rule, model, '格式不正确')))
            break
          }
          if (rule.validator) {
            const result = await rule.validator(value, model)
            if (result === false || typeof result === 'string') {
              issues.push(createFormIssue(path, typeof result === 'string' ? result : getRuleMessage(rule, model, '校验失败')))
              break
            }
          }
        }
      }
      return issues
    },
    isRequired(path) {
      // Wot UI 的 isRequired 不传 model，动态 required 只能依赖 props/id 等外部响应式闭包。
      return normalizeFormRules(getFormRules(rules)[path]).some(rule => isRuleRequired(rule))
    },
  }
}

/** 校验 min/max：数字值（显式 type:'number' 或运行时即为 number）走数值范围，否则按字符串/数组长度 */
function getRangeError(rule: WotFormRule, value: unknown): string | undefined {
  const { min, max } = rule
  if (rule.type === 'number' || typeof value === 'number') {
    const num = Number(value)
    if (Number.isNaN(num)) {
      return '请输入有效数字'
    }
    if (min != null && num < min) {
      return `不能小于 ${min}`
    }
    if (max != null && num > max) {
      return `不能大于 ${max}`
    }
    return undefined
  }
  const length = typeof value === 'string' || Array.isArray(value) ? value.length : String(value).length
  if (min != null && length < min) {
    return `长度不能少于 ${min}`
  }
  if (max != null && length > max) {
    return `长度不能超过 ${max}`
  }
  return undefined
}

/** 创建 Wot FormSchema 的错误项 */
export function createFormIssue(path: string, message: string): FormSchemaIssue {
  return { path: path.split('.'), message }
}

function getValueByPath(model: Record<string, any>, path: string) {
  return path.split('.').reduce((value, key) => value?.[key], model)
}

function normalizeFormRules(rules?: WotFormRule | readonly WotFormRule[]): readonly WotFormRule[] {
  if (!rules) {
    return []
  }
  return isFormRuleArray(rules) ? rules : [rules]
}

function getFormRules(rules: WotFormRulesGetter) {
  return typeof rules === 'function' ? rules() : rules
}

function isRuleRequired(rule: WotFormRule, model?: Record<string, any>) {
  if (typeof rule.required === 'function') {
    return rule.required(model)
  }
  return !!rule.required
}

function getRuleMessage(rule: WotFormRule, model: Record<string, any>, fallback: string) {
  if (typeof rule.message === 'function') {
    return rule.message(model)
  }
  return rule.message || fallback
}

function isFormRuleArray(rules: WotFormRule | readonly WotFormRule[]): rules is readonly WotFormRule[] {
  return Array.isArray(rules)
}

// ==================== Picker 选择器 ====================

export type WotPickerValue = boolean | number | string

export interface WotPickerDisplayOptions {
  labelKey?: string // 展示文本字段名，默认读取 label
  placeholder?: string // 未选择时的占位文案
  valueKey?: string // 选项值字段名，默认读取 value
}

/** 获取 picker 在 wd-form-item 上展示的 value；未选择时返回空字符串以触发 placeholder 样式 */
export function getWotPickerFormValue(
  columns: unknown[],
  value?: null | WotPickerValue | WotPickerValue[],
  options: WotPickerDisplayOptions = {},
) {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map(item => getWotPickerDisplay(columns, item, options)).filter(Boolean).join('、')
      : ''
  }
  return getWotPickerDisplay(columns, value, options)
}

/**
 * 根据当前值从 picker 选项中反查展示文案。
 *
 * Wot picker 负责弹层选择，外部触发入口需要自己展示选中项文案。
 * 这里统一处理普通一维选项、Wot columns 数组选项，以及自定义 label/value 字段名。
 *
 * @param columns picker 选项，支持 [{ label, value }] 或 [[{ label, value }]] 两种结构
 * @param value 当前业务值
 * @param options 展示字段、值字段和占位文案配置
 * @returns 已选项 label；未选择时返回 placeholder；选项未加载时回显原始 value
 */
export function getWotPickerDisplay(
  columns: unknown[],
  value?: null | WotPickerValue,
  options: WotPickerDisplayOptions = {},
) {
  const {
    labelKey = 'label',
    placeholder = '请选择',
    valueKey = 'value',
  } = options

  if (value === undefined || value === null || value === '') {
    return placeholder
  }

  // 支持 Wot picker 的二维 columns，以及项目里常用的一维选项数组。
  const firstColumn = columns[0]
  const list = Array.isArray(firstColumn) ? firstColumn : columns
  const selected = list.find((item) => {
    // 选项可以是对象，也可以是直接的字符串/数字值。
    const itemValue = isWotPickerObject(item) ? item[valueKey] : item
    return itemValue === value || String(itemValue) === String(value)
  })

  // 选项异步加载时可能暂时找不到 label，先回显原始值，避免编辑页显示为空。
  if (selected === undefined) {
    return String(value)
  }
  if (!isWotPickerObject(selected)) {
    return String(selected)
  }
  return String(selected[labelKey] ?? selected[valueKey] ?? placeholder)
}

/** 判断一维对象选项是否包含 boolean 值 */
export function hasWotPickerBooleanValue(columns: Record<string, any>[], valueKey = 'value') {
  return columns.some(item => typeof item[valueKey] === 'boolean')
}

function isWotPickerObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
