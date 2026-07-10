import type {
  FormCreateApi,
  FormCreateApiContext,
  FormCreateFieldState,
  NormalizedFormCreateRule,
} from '../../../types/typing'
import { FORM_FIELD_PERMISSION } from '../../../types/typing'
import { deepMerge, hasOwn, toJson as stringifyJson } from '../../utils/src'
import { applyControlRules } from './control'
import { fetchProviderData, getProviderData, translate } from './provider'
import { isSubFormRule, normalizeSubFormRules } from './subForm'
import { getDefaultValue, isRuleDisabled, isRuleHidden } from './utils'

export function createApi(ctx: FormCreateApiContext): FormCreateApi {
  const normalizeFields = (fields?: string | string[]) => {
    if (fields === undefined) {
      return ctx.rules.value.map(rule => rule.field).filter(Boolean) as string[]
    }
    return Array.isArray(fields) ? fields : [fields]
  }

  const findRule = (field: string) =>
    ctx.rules.value.find(rule => rule.field === field || rule.name === field || rule.__fcId === field)

  const isIgnoredRule = (rule: NormalizedFormCreateRule, state?: FormCreateFieldState) => {
    if (rule.ignore === true) {
      return true
    }
    if ((rule.ignore === 'hidden' || ctx.option?.value.ignoreHiddenFields) && isRuleHidden(rule, state)) {
      return true
    }
    return false
  }

  function filterSubFormValue(rule: NormalizedFormCreateRule, value: any): any {
    if (!Array.isArray(value)) {
      return value
    }
    const childRules = normalizeSubFormRules(rule, ctx.parseSubFormRules)
    return value.map(row => filterSubFormRow(childRules, row || {}))
  }

  function filterSubFormRow(childRules: NormalizedFormCreateRule[], row: Record<string, any>) {
    const result: Record<string, any> = {}
    const controlResult = applyControlRules(childRules, row)
    controlResult.rules.forEach((rule) => {
      if (!rule.field || isIgnoredRule(rule, controlResult.fieldStates[rule.field]) || !hasOwn(row, rule.field)) {
        return
      }
      result[rule.field] = isSubFormRule(rule)
        ? filterSubFormValue(rule, row[rule.field])
        : row[rule.field]
    })
    return result
  }

  const getSubmitData = () => {
    const data: Record<string, any> = {}
    ctx.rules.value.forEach((rule) => {
      if (!rule.field || isIgnoredRule(rule, ctx.fieldStates[rule.field]) || !hasOwn(ctx.formData.value, rule.field)) {
        return
      }
      data[rule.field] = isSubFormRule(rule)
        ? filterSubFormValue(rule, ctx.formData.value[rule.field])
        : ctx.formData.value[rule.field]
    })
    return data
  }

  const setFieldState = (field: string | undefined, key: 'disabled' | 'hidden' | 'required', value: boolean) => {
    if (field) {
      if (!ctx.fieldStates[field]) {
        ctx.fieldStates[field] = {}
      }
      ctx.fieldStates[field][key] = value
      return
    }
    ctx.rules.value.forEach((rule) => {
      if (!rule.field) {
        return
      }
      if (!ctx.fieldStates[rule.field]) {
        ctx.fieldStates[rule.field] = {}
      }
      ctx.fieldStates[rule.field][key] = value
    })
  }

  const ensureGlobalData = () => {
    const option = ctx.option?.value
    if (!option) {
      return undefined
    }
    if (!option.globalData) {
      option.globalData = {}
    }
    return option.globalData
  }

  const emitValidateFail = (result: { valid: boolean, errors: { prop: string, message: string }[] }) => {
    if (!result.valid) {
      ctx.emitValidateFail?.(result.errors)
    }
  }

  const api: FormCreateApi = {
    async validate() {
      if (!ctx.formRef.value) {
        return { valid: true, errors: [] }
      }
      const result = await ctx.formRef.value.validate()
      emitValidateFail(result)
      return result
    },
    async validateField(field, callback) {
      const result = ctx.formRef.value
        ? await ctx.formRef.value.validate(field)
        : { valid: true, errors: [] }
      emitValidateFail(result)
      callback?.(result)
      return result
    },
    async validateFields(fields, callback) {
      const result = ctx.formRef.value
        ? await ctx.formRef.value.validate(Array.isArray(fields) ? fields : [fields])
        : { valid: true, errors: [] }
      emitValidateFail(result)
      callback?.(result)
      return result
    },
    clearValidateState(fields) {
      if (fields !== undefined && ctx.clearValidateState) {
        ctx.clearValidateState(fields)
        return
      }
      ctx.formRef.value?.reset()
    },
    onSubmit(fn) {
      if (ctx.option?.value) {
        ctx.option.value.onSubmit = fn
      }
    },
    async submit(callback) {
      const result = await api.validate()
      const data = api.formData()
      if (result.valid) {
        callback?.(data, api)
        ctx.emitSubmit?.(data)
      }
      return {
        ...result,
        data,
      }
    },
    changeStatus() {
      return !!ctx.changeStatus?.value
    },
    clearChangeStatus() {
      if (ctx.changeStatus) {
        ctx.changeStatus.value = false
      }
    },
    hideForm(status = true) {
      if (ctx.hidden) {
        ctx.hidden.value = status
      }
    },
    toJson(space) {
      return stringifyJson(ctx.rules.value, space)
    },
    resetFields(fields) {
      const nextData = { ...ctx.formData.value }
      normalizeFields(fields).forEach((field) => {
        const rule = findRule(field)
        if (!rule?.field) {
          return
        }
        nextData[rule.field] = ctx.initialFormData?.value && hasOwn(ctx.initialFormData.value, rule.field)
          ? ctx.initialFormData.value[rule.field]
          : getDefaultValue(rule)
      })
      ctx.formData.value = nextData
      ctx.formRef.value?.reset()
      ctx.emitChange()
      ctx.emitReset?.()
      ctx.refresh?.()
    },
    formData() {
      return getSubmitData()
    },
    getFormData() {
      return api.formData()
    },
    getValue(field) {
      return ctx.formData.value[field]
    },
    fields() {
      return ctx.rules.value.map(rule => rule.field).filter(Boolean) as string[]
    },
    getRule(field) {
      return findRule(field)
    },
    updateRule(field, rule) {
      const target = findRule(field)
      if (!target || !ctx.rulePatches) {
        return
      }
      ctx.rulePatches[target.__fcId] = {
        ...rule,
        __fcId: target.__fcId,
        __originType: target.__originType,
      }
      if (target.field && hasOwn(rule, 'value')) {
        ctx.formData.value[target.field] = rule.value
        ctx.emitChange()
      }
      ctx.refresh?.()
    },
    mergeRule(field, rule) {
      const target = findRule(field)
      if (!target || !ctx.rulePatches) {
        return
      }
      ctx.rulePatches[target.__fcId] = {
        ...deepMerge(ctx.rulePatches[target.__fcId], rule),
        __fcId: target.__fcId,
        __originType: target.__originType,
      } as Partial<typeof target>
      if (target.field && hasOwn(rule, 'value')) {
        ctx.formData.value[target.field] = rule.value
        ctx.emitChange()
      }
      ctx.refresh?.()
    },
    refresh() {
      ctx.refresh?.()
    },
    sync() {
      ctx.refresh?.()
    },
    fetch(option) {
      return fetchProviderData(option, {
        api,
        formData: ctx.formData.value,
        option: ctx.option?.value,
      })
    },
    getData(id, defaultValue) {
      return getProviderData(id, {
        api,
        formData: ctx.formData.value,
        option: ctx.option?.value,
      }, defaultValue)
    },
    async getGlobalData(name) {
      const source = ctx.option?.value.globalData?.[name]
      if (source?.type === 'fetch') {
        return api.fetch({ key: name })
      }
      return api.getData(`$globalData.${name}`)
    },
    setGlobalData(name, value) {
      const globalData = ensureGlobalData()
      if (!globalData) {
        return
      }
      globalData[name] = { type: 'static', data: value }
      ctx.refresh?.()
    },
    setGlobalVar(name, value) {
      const globalData = ensureGlobalData()
      if (!globalData) {
        return
      }
      const vars = globalData.$var?.data && typeof globalData.$var.data === 'object'
        ? globalData.$var.data
        : {}
      vars[name] = value
      globalData.$var = { type: 'static', data: vars }
      ctx.refresh?.()
    },
    getGlobalEvent(name) {
      const event = ctx.option?.value.globalEvent?.[name]
      if (typeof event === 'function') {
        return event
      }
      if (event && typeof event.handle === 'function') {
        return event.handle
      }
      return undefined
    },
    emitGlobalEvent(name, ...args) {
      return api.getGlobalEvent(name)?.(...args)
    },
    setValue(values, value) {
      const nextValues = typeof values === 'string' ? { [values]: value } : values
      ctx.formData.value = {
        ...ctx.formData.value,
        ...nextValues,
      }
      ctx.emitChange()
      ctx.refresh?.()
    },
    coverValue(values) {
      ctx.formData.value = { ...values }
      ctx.emitChange()
      ctx.refresh?.()
    },
    disabled(status, field) {
      setFieldState(field, 'disabled', status)
    },
    disabledStatus(field) {
      const rule = findRule(field)
      return rule ? isRuleDisabled(!!ctx.disabled?.value, rule.field ? ctx.fieldStates[rule.field] : undefined, rule) : undefined
    },
    display(status, field) {
      setFieldState(field, 'hidden', !status)
    },
    displayStatus(field) {
      const hidden = api.hiddenStatus(field)
      return hidden === undefined ? undefined : !hidden
    },
    hidden(status, field) {
      setFieldState(field, 'hidden', status)
    },
    hiddenStatus(field) {
      const rule = findRule(field)
      return rule ? isRuleHidden(rule, rule.field ? ctx.fieldStates[rule.field] : undefined) : undefined
    },
    required(status, field) {
      setFieldState(field, 'required', status)
    },
    setEffect(field, attr, value) {
      const effectKey = attr.startsWith('$') ? attr.slice(1) : attr
      api.mergeRule(field, {
        [`$${effectKey}`]: value,
        effect: {
          [effectKey]: value,
        },
      })
    },
    t(id, params) {
      return translate(id, params, {
        api,
        formData: ctx.formData.value,
        option: ctx.option?.value,
      })
    },
    setFieldPermission(field, permission) {
      if (permission === FORM_FIELD_PERMISSION.READ) {
        api.hidden(false, field)
        api.disabled(true, field)
      } else if (permission === FORM_FIELD_PERMISSION.WRITE) {
        api.hidden(false, field)
        api.disabled(false, field)
      } else if (permission === FORM_FIELD_PERMISSION.HIDDEN) {
        api.hidden(true, field)
      }
    },
  }

  return api
}
