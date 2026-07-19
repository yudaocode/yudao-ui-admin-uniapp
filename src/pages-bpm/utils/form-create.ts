import { isRef } from 'vue'
import { parseJson } from '@/pages-bpm/components/form-create/packages/utils/src'

export interface FormCreateRule {
  type: string
  field?: string
  title?: string
  value?: any
  props?: Record<string, any>
  options?: Array<Record<string, any>>
  children?: FormCreateRule[]
  $required?: boolean | string | Record<string, any>
  [key: string]: any
}

export interface FormCreatePreview {
  option: Record<string, any>
  rule: FormCreateRule[]
  value: Record<string, any>
}

/** 解码表单配置 */
export function decodeConf(conf?: string | Record<string, any>): Record<string, any> {
  if (!conf) {
    return {}
  }
  if (typeof conf !== 'string') {
    return conf
  }
  return parseJson<Record<string, any>>(conf, {})
}

/** 解码表单字段 */
export function decodeFields(fields?: Array<FormCreateRule | string>): FormCreateRule[] {
  if (!Array.isArray(fields)) {
    return []
  }
  return fields
    .map((item) => {
      if (typeof item !== 'string') {
        return item
      }
      return parseJson<FormCreateRule | undefined>(item, undefined)
    })
    .filter(Boolean) as FormCreateRule[]
}

/** 设置表单的 Conf 和 Fields，适用移动端 form-create 渲染场景 */
export function setConfAndFields2(
  detailPreview: any,
  conf?: string | Record<string, any>,
  fields?: Array<FormCreateRule | string>,
  value?: Record<string, any>,
) {
  const target: FormCreatePreview = isRef(detailPreview) ? detailPreview.value : detailPreview
  target.option = decodeConf(conf)
  target.rule = decodeFields(fields)
  target.value = value || {}
}

/**
 * 解析表单组件的 field、title 等字段。
 *
 * @param rule 组件生成规则
 * @param fields 解析后的表单组件字段
 * @param parentTitle 子表单标题
 */
export function parseFormFields(
  rule: FormCreateRule,
  fields: FormCreateRule[] = [],
  parentTitle = '',
) {
  const { type, field, $required, title: tempTitle, children } = rule
  if (field && tempTitle) {
    fields.push({
      field,
      title: parentTitle ? `${parentTitle}.${tempTitle}` : tempTitle,
      type,
      required: !!$required,
    })
  }
  if (Array.isArray(children)) {
    children.forEach(child => parseFormFields(child, fields))
  }
  return fields
}

/** 过滤不属于 form-create 表单字段的流程变量。用于重新发起流程时清理审批人等非表单变量。 */
export function filterFormVariablesByFields(
  fields?: Array<FormCreateRule | string>,
  variables?: Record<string, any>,
) {
  if (!variables) {
    return {}
  }
  const allowedFields = collectFormFieldSet(decodeFields(fields))
  return Object.keys(variables).reduce<Record<string, any>>((result, key) => {
    if (allowedFields.has(key)) {
      result[key] = variables[key]
    }
    return result
  }, {})
}

function collectFormFieldSet(rules: FormCreateRule[]) {
  const fields = new Set<string>()
  const walk = (rule: FormCreateRule | undefined) => {
    if (!rule || typeof rule !== 'object') {
      return
    }
    if (rule.field) {
      fields.add(rule.field)
    }
    getFormRuleChildren(rule).forEach(walk)
  }
  rules.forEach(walk)
  return fields
}

function getFormRuleChildren(rule: FormCreateRule): FormCreateRule[] {
  return normalizeFormRuleChildren(
    rule.children
    || rule.props?.children
    || rule.props?.rule
    || rule.props?.rows
    || rule.props?.columns,
  )
}

function normalizeFormRuleChildren(children: unknown): FormCreateRule[] {
  if (!children) {
    return []
  }
  if (Array.isArray(children)) {
    return children.flatMap(item => normalizeFormRuleChildren(item))
  }
  if (typeof children !== 'object') {
    return []
  }
  const child = children as FormCreateRule
  if (child.type || child.field) {
    return [child]
  }
  return normalizeFormRuleChildren(child.children || child.props?.children || child.props?.rule || child.props?.rows || child.props?.columns)
}
