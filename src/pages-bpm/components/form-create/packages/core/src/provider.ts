import type {
  FormCreateApi,
  FormCreateFetchOption,
  FormCreateFieldState,
  FormCreateLoadDataEffectOption,
  FormCreateOption,
  FormCreateRule,
  FormCreateValidateRule,
  NormalizedFormCreateRule,
} from '../../../types/typing'
import { http } from '@/http/http'
import { getRuleEffect } from './utils'

export interface FormCreateProviderState {
  fetchLoaded?: boolean
  fetchPatch?: Record<string, any>
}

export interface FormCreateProviderContext {
  api?: FormCreateApi
  formData?: Record<string, any>
  option?: FormCreateOption
  states?: Record<string, FormCreateProviderState>
}

export interface FormCreateProviderFetchResult {
  fieldId: string
  patch?: Record<string, any>
}

export interface FormCreateProviderFetchOptions {
  rawResponse?: boolean
}

export function getRequiredRule(rule: FormCreateRule, state?: FormCreateFieldState): FormCreateValidateRule | undefined {
  if (state?.required === true || state?.controlRequired === true) {
    return {
      required: true,
      message: `${rule.title || '该字段'}不能为空`,
    }
  }
  if (rule.$required === true) {
    return {
      required: true,
      message: `${rule.title || '该字段'}不能为空`,
    }
  }
  if (typeof rule.$required === 'string') {
    return {
      required: true,
      message: rule.$required,
    }
  }
  if (rule.$required && typeof rule.$required === 'object') {
    return {
      required: true,
      ...rule.$required,
    }
  }
  const requiredEffect = getRuleEffect(rule, 'required')
  if (requiredEffect === true) {
    return {
      required: true,
      message: `${rule.title || '该字段'}不能为空`,
    }
  }
  if (typeof requiredEffect === 'string') {
    return {
      required: true,
      message: requiredEffect,
    }
  }
  if (requiredEffect && typeof requiredEffect === 'object') {
    return {
      required: true,
      ...requiredEffect,
    }
  }
  const validate = rule.validate?.find(item => item.required)
  return validate ? { ...validate, required: true } : undefined
}

export function getValidateRules(rule: FormCreateRule, state?: FormCreateFieldState, context?: FormCreateProviderContext): FormCreateValidateRule[] {
  const rules = [...(rule.validate || [])]
  const requiredRule = getRequiredRule(rule, state)
  if (requiredRule && !rules.some(item => item.required)) {
    rules.unshift(requiredRule)
  }
  const componentValidateRule = getComponentValidateRule(rule, context)
  if (componentValidateRule) {
    rules.push(componentValidateRule)
  }
  return rules
}

export function applyRuleProviders(rules: NormalizedFormCreateRule[], context: FormCreateProviderContext = {}) {
  return rules.map(rule => applyRuleProvider(rule, context))
}

export async function resolveRuleFetchEffects(rules: NormalizedFormCreateRule[], context: FormCreateProviderContext = {}) {
  const results: FormCreateProviderFetchResult[] = []
  for (const rule of rules) {
    const result = await resolveRuleFetchEffect(rule, context)
    if (result) {
      results.push(result)
    }
  }
  return results
}

export function getProviderData(id: string, context: FormCreateProviderContext = {}, defaultValue?: any) {
  if (!id) {
    return defaultValue
  }
  if (id.startsWith('$form.')) {
    return getByPath(context.formData, id.slice('$form.'.length), defaultValue)
  }
  if (id.startsWith('$globalData.')) {
    return getGlobalData(id.slice('$globalData.'.length), context, defaultValue)
  }
  if (id.startsWith('$var.')) {
    return getGlobalVar(id.slice('$var.'.length), context, defaultValue)
  }
  if (id.startsWith('$t.')) {
    return translate(id.slice('$t.'.length), undefined, context) || defaultValue
  }
  const formValue = getByPath(context.formData, id)
  if (formValue !== undefined) {
    return formValue
  }
  return getGlobalData(id, context, defaultValue)
}

export async function fetchProviderData(
  option: string | FormCreateFetchOption,
  context: FormCreateProviderContext = {},
  rule?: FormCreateRule,
  fetchOptions: FormCreateProviderFetchOptions = {},
) {
  const normalized = normalizeFetchOption(option, context, rule)
  if (!normalized) {
    return undefined
  }
  if (normalized.key) {
    const globalData = getGlobalDataSource(normalized.key, context)
    if (globalData?.type === 'fetch') {
      return fetchProviderData({
        ...globalData,
        parse: normalized.parse ?? globalData.parse,
      }, context, rule, fetchOptions)
    }
    const data = getProviderData(`$globalData.${normalized.key}`, context)
    return data === undefined ? undefined : data
  }
  if (typeof normalized.action === 'function') {
    const body = await normalized.action(rule, context.api)
    return parseFetchBody(body, normalized, rule, context, !fetchOptions.rawResponse)
  }
  if (!normalized.action) {
    return undefined
  }
  const method = String(normalized.method || 'GET').toUpperCase()
  const action = interpolateData(normalized.action, context)
  const query = interpolateData(normalized.query ?? (method === 'GET' ? normalized.data : undefined), context)
  const data = interpolateData(method === 'GET' ? undefined : normalized.data, context)
  const body = await (context.option?.fetch
    ? context.option.fetch({ ...normalized, action, data, method, query }, { api: context.api, rule })
    : http<any>({
        data,
        header: normalized.header || normalized.headers,
        hideErrorToast: true,
        method: method as UniApp.RequestOptions['method'],
        query,
        returnRawResponse: fetchOptions.rawResponse,
        url: normalizeFetchAction(action),
      }))
  return parseFetchBody(body, normalized, rule, context, !fetchOptions.rawResponse)
}

export function translate(id: string, params?: Record<string, any>, context: FormCreateProviderContext = {}) {
  if (!id) {
    return undefined
  }
  const fromOption = context.option?.t?.(id, params)
  const template = fromOption ?? context.option?.messages?.[id] ?? getByPath(context.option?.language, id)
  if (template === undefined || template === null) {
    return undefined
  }
  return replaceParams(String(template), params)
}

function applyRuleProvider(rule: NormalizedFormCreateRule, context: FormCreateProviderContext) {
  const nextRule: NormalizedFormCreateRule = {
    ...rule,
    options: rule.options ? [...rule.options] : rule.options,
    props: { ...(rule.props || {}) },
    validate: rule.validate ? [...rule.validate] : rule.validate,
  }
  applyLoadDataEffect(nextRule, context)
  applyTranslateEffect(nextRule, context)
  applyFetchState(nextRule, context.states?.[rule.__fcId])
  return nextRule
}

function applyLoadDataEffect(rule: NormalizedFormCreateRule, context: FormCreateProviderContext) {
  const loadDataEffect = getRuleEffect(rule, 'loadData')
  const effects = Array.isArray(loadDataEffect) ? loadDataEffect : loadDataEffect ? [loadDataEffect] : []
  effects.forEach((effect) => {
    if (!effect) {
      return
    }
    const option = typeof effect === 'string' ? { attr: effect } : effect as FormCreateLoadDataEffectOption
    let value: any
    const get = (id: string, defaultValue?: any) => getProviderData(id, context, defaultValue)
    if (typeof option.handler === 'function') {
      value = option.handler(get, rule, context.api)
    } else if (option.template) {
      value = interpolateTemplate(option.template, context)
    } else if (option.attr) {
      value = get(option.attr)
    }
    if ((value === undefined || value === null || value === '') && option.default !== undefined) {
      value = option.default
    }
    if (value === undefined) {
      return
    }
    setProviderPath(rule, option.to || 'options', option.copy === false ? value : cloneData(value))
  })
}

function applyTranslateEffect(rule: NormalizedFormCreateRule, context: FormCreateProviderContext) {
  const translateEffect = getRuleEffect(rule, 't')
  if (!translateEffect || typeof translateEffect !== 'object') {
    return
  }
  Object.entries(translateEffect as Record<string, any>).forEach(([path, config]) => {
    if (!config) {
      return
    }
    const translateId = typeof config === 'string' ? config : config.attr
    const value = translate(translateId, typeof config === 'object' ? config.params : undefined, context)
    if (value === undefined) {
      return
    }
    setProviderPath(rule, typeof config === 'object' && config.to ? config.to : path, value)
  })
}

function applyFetchState(rule: NormalizedFormCreateRule, state?: FormCreateProviderState) {
  if (!state?.fetchPatch) {
    return
  }
  Object.entries(state.fetchPatch).forEach(([path, value]) => {
    setProviderPath(rule, path, value)
  })
}

async function resolveRuleFetchEffect(rule: NormalizedFormCreateRule, context: FormCreateProviderContext): Promise<FormCreateProviderFetchResult | undefined> {
  const fetchEffect = getRuleEffect(rule, 'fetch')
  if (!fetchEffect) {
    return undefined
  }
  try {
    const option = typeof fetchEffect === 'function' ? fetchEffect(rule, context.api) : fetchEffect
    const normalized = normalizeFetchOption(option, context, rule)
    if (!normalized) {
      return undefined
    }
    if (normalized.watch === false && context.states?.[rule.__fcId]?.fetchLoaded) {
      return undefined
    }
    const value = await fetchProviderData(normalized, context, rule)
    return {
      fieldId: rule.__fcId,
      patch: value === undefined
        ? undefined
        : { [normalized.to || 'options']: value },
    }
  } catch (error) {
    const option = normalizeFetchOption(fetchEffect as string | FormCreateFetchOption, context, rule)
    option?.onError?.(error, rule, context.api)
    console.error('[form-create] effect.fetch failed:', error)
    return {
      fieldId: rule.__fcId,
      patch: undefined,
    }
  }
}

function getComponentValidateRule(rule: FormCreateRule, context?: FormCreateProviderContext): FormCreateValidateRule | undefined {
  const componentValidate = getRuleEffect(rule, 'componentValidate')
  if (!componentValidate) {
    return undefined
  }
  if (componentValidate === false) {
    return undefined
  }
  const option = typeof componentValidate === 'object'
    ? componentValidate
    : { method: componentValidate === true ? 'formCreateValidate' : componentValidate }
  if (option.method === false) {
    return undefined
  }
  return {
    ...option,
    validator(value) {
      const method = option.validator || option.method
      if (typeof method === 'function') {
        return method(value, rule, context?.api)
      }
      const fn = method && (rule.props?.[method] || rule[method])
      if (typeof fn === 'function') {
        return fn(value, rule, context?.api)
      }
      return true
    },
  }
}

function normalizeFetchOption(
  option: string | FormCreateFetchOption | ((rule?: FormCreateRule, api?: FormCreateApi) => FormCreateFetchOption | string | undefined) | undefined,
  context: FormCreateProviderContext,
  rule?: FormCreateRule,
): FormCreateFetchOption | undefined {
  if (!option) {
    return undefined
  }
  if (typeof option === 'string') {
    return {
      action: option,
      to: 'options',
    }
  }
  if (typeof option === 'function') {
    return normalizeFetchOption(option(rule, context.api), context, rule)
  }
  return {
    ...option,
    to: option.to || 'options',
  }
}

function parseFetchBody(
  body: any,
  option: FormCreateFetchOption,
  rule?: FormCreateRule,
  context?: FormCreateProviderContext,
  unwrapData = true,
) {
  if (typeof option.parse === 'function') {
    return option.parse(body, rule, context?.api)
  }
  if (typeof option.parse === 'string' && option.parse) {
    return getByPath(body, option.parse)
  }
  if (unwrapData && body && typeof body === 'object' && 'data' in body && !Array.isArray(body)) {
    return body.data
  }
  return body
}

/** 兼容设计器里携带网关前缀的相对接口地址 */
export function normalizeFetchAction(action: string, proxyPrefix = import.meta.env.VITE_APP_PROXY_PREFIX) {
  if (!proxyPrefix || /^https?:\/\//i.test(action)) {
    return action
  }
  const prefix = String(proxyPrefix).replace(/\/+$/, '')
  if (action === prefix) {
    return '/'
  }
  return action.startsWith(`${prefix}/`) ? action.slice(prefix.length) : action
}

function getGlobalData(id: string, context: FormCreateProviderContext, defaultValue?: any) {
  const source = getGlobalDataSource(id, context)
  if (source === undefined || source === null) {
    return defaultValue
  }
  if (typeof source !== 'object') {
    return source
  }
  const [, ...paths] = id.split('.')
  if (source.type === 'static') {
    return getByPath(source.data ?? source.result, paths.join('.'), defaultValue)
  }
  if ('data' in source || 'result' in source) {
    return getByPath(source.data ?? source.result, paths.join('.'), defaultValue)
  }
  return getByPath(source, paths.join('.'), defaultValue)
}

function getGlobalVar(id: string, context: FormCreateProviderContext, defaultValue?: any) {
  const source = context.option?.globalData?.$var
  if (source === undefined || source === null) {
    return defaultValue
  }
  if (source.type === 'static') {
    return getByPath(source.data ?? source.result, id, defaultValue)
  }
  if (typeof source === 'object' && ('data' in source || 'result' in source)) {
    return getByPath(source.data ?? source.result, id, defaultValue)
  }
  return getByPath(source, id, defaultValue)
}

function getGlobalDataSource(id: string, context: FormCreateProviderContext) {
  const [key] = id.split('.')
  return context.option?.globalData?.[key]
}

function getByPath(source: any, path: string | undefined, defaultValue?: any) {
  if (!path) {
    return source === undefined ? defaultValue : source
  }
  const value = path.split('.').filter(Boolean).reduce((data, key) => data?.[key], source)
  return value === undefined ? defaultValue : value
}

function setProviderPath(target: Record<string, any>, path: string, value: any) {
  const keys = path.split('.').filter(Boolean)
  if (keys.length === 0) {
    return
  }
  let data = target
  keys.slice(0, -1).forEach((key) => {
    if (!data[key] || typeof data[key] !== 'object') {
      data[key] = {}
    }
    data = data[key]
  })
  data[keys[keys.length - 1]] = value
}

function interpolateData<T>(value: T, context: FormCreateProviderContext): T {
  if (typeof value === 'string') {
    return interpolateTemplate(value, context) as T
  }
  if (Array.isArray(value)) {
    return value.map(item => interpolateData(item, context)) as T
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce<Record<string, any>>((result, [key, item]) => {
      result[key] = interpolateData(item, context)
      return result
    }, {}) as T
  }
  return value
}

function interpolateTemplate(template: string, context: FormCreateProviderContext) {
  return template
    .replace(/\{\{([^}]+)\}\}/g, (_, key) => String(getProviderData(key.trim(), context, '') ?? ''))
    .replace(/\$\{([^}]+)\}/g, (_, key) => String(getProviderData(key.trim(), context, '') ?? ''))
}

function replaceParams(template: string, params?: Record<string, any>) {
  if (!params) {
    return template
  }
  return Object.entries(params).reduce((result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value ?? '')), template)
}

function cloneData<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}
