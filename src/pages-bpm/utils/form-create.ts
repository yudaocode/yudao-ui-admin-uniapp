import { isRef } from 'vue'
import { parseJson } from '@/pages-bpm/components/form-create/packages/utils/src'
import { FORM_FIELD_PERMISSION } from '@/pages-bpm/components/form-create/types/typing'

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

const TABLE_FORM_TYPE = 'tableForm' // 表格表单
const GROUP_FORM_TYPE = 'group' // 子表单

/** 是否为子表单子字段的权限标识：子表单字段.子字段，区分不同子表单中的同名字段 */
export function isSubFieldPermissionField(field: string) {
  return field.includes('.')
}

/** 表单规则中，是否包含子表单（表格表单、子表单） */
export function hasSubForm(rules: FormCreateRule[]): boolean {
  return rules.some(rule => isSubForm(rule) || (Array.isArray(rule?.children) && hasSubForm(rule.children)))
}

/**
 * 将子表单的子字段权限写入表单规则，需要在 form-create 渲染前调用，新增的行沿用同一份规则。
 *
 * 1. 子字段未单独设置时继承子表单，子表单的权限是上限
 * 2. 只读：禁用，并去掉校验，避免阻断提交
 * 3. 隐藏：组件隐藏，但仍保留在每一行中，避免提交、删行时丢失已有的值
 * 4. 子字段都隐藏时，隐藏整个子表单
 *
 * @param rules 表单规则
 * @param fieldsPermission 表单字段权限
 */
export function applySubFormsPermission(rules: FormCreateRule[], fieldsPermission?: Record<string, string>) {
  if (!fieldsPermission) {
    return
  }
  rules.forEach((rule) => {
    if (isSubForm(rule) && rule.field) {
      applySubFormPermission(rule, rule.field, fieldsPermission)
    }
    if (Array.isArray(rule?.children)) {
      applySubFormsPermission(rule.children, fieldsPermission)
    }
  })
}

function isSubForm(rule?: FormCreateRule) {
  return rule?.type === TABLE_FORM_TYPE || rule?.type === GROUP_FORM_TYPE
}

function applySubFormPermission(rule: FormCreateRule, subFormField: string, fieldsPermission: Record<string, string>) {
  const subFormPermission = fieldsPermission[subFormField]
  const subFieldRules = rule.type === TABLE_FORM_TYPE
    ? (rule.props?.columns || []).flatMap((column: Record<string, any>) => collectFieldRules(column.rule))
    : collectFieldRules(rule.props?.rule)
  // 子表单隐藏时，由表单字段权限隐藏整个子表单；没有子字段时（如表格表单未配置列），无需处理
  if (subFormPermission === FORM_FIELD_PERMISSION.HIDDEN || subFieldRules.length === 0) {
    return
  }
  let hiddenCount = 0
  subFieldRules.forEach((item) => {
    const permission = getSubFieldPermission(subFormPermission, fieldsPermission[`${subFormField}.${item.field}`])
    if (permission === FORM_FIELD_PERMISSION.READ) {
      item.props = { ...item.props, disabled: true }
    } else if (permission === FORM_FIELD_PERMISSION.HIDDEN) {
      item.hidden = true
      hiddenCount++
    }
    if (permission === FORM_FIELD_PERMISSION.READ || permission === FORM_FIELD_PERMISSION.HIDDEN) {
      item.$required = false
      item.validate = []
    }
  })
  if (hiddenCount > 0 && hiddenCount === subFieldRules.length) {
    rule.hidden = true
    return
  }
  if (rule.type === TABLE_FORM_TYPE) {
    removeHiddenTableFormColumns(rule)
  }
}

/** 获得子字段的实际权限：未单独设置时继承子表单，子表单只读时子字段最多只读 */
function getSubFieldPermission(subFormPermission?: string, permission?: string) {
  if (subFormPermission === FORM_FIELD_PERMISSION.READ && permission === FORM_FIELD_PERMISSION.WRITE) {
    return FORM_FIELD_PERMISSION.READ
  }
  return permission ?? subFormPermission
}

/** 表格表单：字段都隐藏的列不再展示列名，字段放到首列中隐藏保留 */
function removeHiddenTableFormColumns(rule: FormCreateRule) {
  const hiddenRules: FormCreateRule[] = []
  const columns = rule.props!.columns.filter((column: Record<string, any>) => {
    const items = collectFieldRules(column.rule)
    if (items.length === 0 || !items.every(item => item.hidden)) {
      return true
    }
    hiddenRules.push(...items)
    return false
  })
  if (hiddenRules.length > 0 && columns.length > 0) {
    columns[0].rule = [...(columns[0].rule || []), ...hiddenRules]
    rule.props!.columns = columns
  }
}

/** 收集组件规则中的字段：递归布局组件，不进入字段组件内部 */
function collectFieldRules(rules?: FormCreateRule[], fieldRules: FormCreateRule[] = []) {
  rules?.forEach((rule) => {
    if (!rule || typeof rule !== 'object') {
      return
    }
    if (rule.field) {
      fieldRules.push(rule)
    } else {
      collectFieldRules(rule.children, fieldRules)
    }
  })
  return fieldRules
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
