import type { FormSchema, FormSchemaIssue } from '@wot-ui/ui/components/wd-form/types'
import type { FormCreateFieldState, FormCreateRule, NormalizedFormCreateRule } from '../../../types/typing'
import type { FormCreateProviderContext } from './provider'
import type { ParseSubFormRules } from './subForm'
import { applyControlRules } from './control'
import { getValidateRules } from './provider'
import { isSubFormRule, normalizeSubFormRules } from './subForm'
import { isRuleDisabled, isRuleHidden } from './utils'
import { validateFormCreateRule } from './validate'

export function createFormSchema(
  rules: () => NormalizedFormCreateRule[],
  fieldStates: Record<string, FormCreateFieldState>,
  parseSubFormRules?: ParseSubFormRules,
  providerContext?: FormCreateProviderContext,
): FormSchema {
  return {
    async validate(model) {
      const issues: FormSchemaIssue[] = []
      for (const rule of rules()) {
        if (!rule.field || isRuleHidden(rule, fieldStates[rule.field]) || isRuleDisabled(false, fieldStates[rule.field], rule)) {
          continue
        }
        const value = model[rule.field]
        if (isSubFormRule(rule)) {
          await validateSubFormRule(rule, value, issues, rule.field, fieldStates[rule.field], parseSubFormRules, providerContext)
          continue
        }
        for (const validateRule of getValidateRules(rule, fieldStates[rule.field], providerContext)) {
          const message = await validateFormCreateRule(value, validateRule, rule, providerContext?.api)
          if (message) {
            issues.push(createIssue(rule.field, message))
            break
          }
        }
      }
      return issues
    },
    isRequired(path) {
      const prop = normalizePath(path)
      const rule = rules().find(item => item.field === prop)
      if (rule) {
        return getValidateRules(rule, fieldStates[rule.field], providerContext).some(item => item.required)
      }
      const childRule = findSubFormChildRule(rules(), prop, parseSubFormRules)
      return !!(childRule && getValidateRules(childRule, undefined, providerContext).some(item => item.required))
    },
  }
}

async function validateSubFormRule(
  rule: NormalizedFormCreateRule,
  value: any,
  issues: FormSchemaIssue[],
  fieldPath: string = rule.field || '',
  state?: FormCreateFieldState,
  parseSubFormRules?: ParseSubFormRules,
  providerContext?: FormCreateProviderContext,
) {
  for (const validateRule of getValidateRules(rule, state, providerContext)) {
    if (validateRule.required && (!Array.isArray(value) || value.length === 0)) {
      issues.push(createIssue(fieldPath, validateRule.message || `${rule.title || '子表单'}不能为空`))
      return
    }
  }

  if (!Array.isArray(value) || value.length === 0) {
    return
  }

  const children = normalizeSubFormRules(rule, parseSubFormRules)
  for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
    const row = value[rowIndex]
    const controlResult = applyControlRules(children, row || {})
    for (const childRule of controlResult.rules) {
      const childState = childRule.field ? controlResult.fieldStates[childRule.field] : undefined
      if (!childRule.field || isRuleHidden(childRule, childState) || isRuleDisabled(false, childState, childRule)) {
        continue
      }
      const childValue = row?.[childRule.field]
      const childPath = getSubFormPath(fieldPath, rowIndex, childRule.field)
      if (isSubFormRule(childRule)) {
        await validateSubFormRule(childRule, childValue, issues, childPath, childState, parseSubFormRules, {
          ...providerContext,
          formData: row || {},
        })
        continue
      }
      for (const validateRule of getValidateRules(childRule, childState, {
        ...providerContext,
        formData: row || {},
      })) {
        const message = await validateFormCreateRule(childValue, validateRule, childRule, providerContext?.api)
        if (message) {
          issues.push(createIssue(childPath, message))
          break
        }
      }
    }
  }
}

function findSubFormChildRule(rules: NormalizedFormCreateRule[], path: string, parseSubFormRules?: ParseSubFormRules) {
  for (const rule of rules) {
    if (!rule.field || !isSubFormRule(rule)) {
      continue
    }
    const childPath = getSubFormChildPath(path, rule.field)
    if (!childPath) {
      continue
    }
    const childRule = findSubFormChildRuleByPath(rule, childPath, parseSubFormRules)
    if (childRule) {
      return childRule
    }
  }
}

function findSubFormChildRuleByPath(rule: FormCreateRule, childPath: string, parseSubFormRules?: ParseSubFormRules): NormalizedFormCreateRule | undefined {
  for (const childRule of normalizeSubFormRules(rule, parseSubFormRules)) {
    if (!childRule.field) {
      continue
    }
    if (childPath === childRule.field) {
      return childRule
    }
    const nestedPath = getSubFormChildPath(childPath, childRule.field)
    if (nestedPath && isSubFormRule(childRule)) {
      const nestedChildRule = findSubFormChildRuleByPath(childRule, nestedPath, parseSubFormRules)
      if (nestedChildRule) {
        return nestedChildRule
      }
    }
  }
}

function getSubFormChildPath(path: string, field: string) {
  const prefix = `${field}.`
  if (!path.startsWith(prefix)) {
    return undefined
  }
  const rest = path.slice(prefix.length)
  const rowSeparatorIndex = rest.indexOf('.')
  return rowSeparatorIndex >= 0 ? rest.slice(rowSeparatorIndex + 1) : undefined
}

function getSubFormPath(field: string, rowIndex: number, childField: string) {
  return `${field}.${rowIndex}.${childField}`
}

function normalizePath(path: unknown) {
  return Array.isArray(path) ? path.join('.') : String(path)
}

function createIssue(field: string, message: string): FormSchemaIssue {
  return {
    path: field.split('.'),
    message,
  }
}

export function createFieldStates(rules: FormCreateRule[]) {
  return rules.reduce<Record<string, FormCreateFieldState>>((states, rule) => {
    if (rule.field) {
      states[rule.field] = {}
    }
    return states
  }, {})
}
