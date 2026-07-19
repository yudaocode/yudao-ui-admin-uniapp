import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Ref } from 'vue'

export const FORM_FIELD_PERMISSION = {
  HIDDEN: '3',
  READ: '1',
  WRITE: '2',
} as const

export type FormFieldPermission = typeof FORM_FIELD_PERMISSION[keyof typeof FORM_FIELD_PERMISSION]

export type FormCreateValue = string | number | boolean | null | undefined | any[] | Record<string, any>

export interface FormCreateOptionItem {
  label?: string
  text?: string
  value?: string | number | boolean
  disabled?: boolean
  children?: FormCreateOptionItem[]
  [key: string]: any
}

export interface FormCreateValidateRule {
  required?: boolean
  message?: string
  pattern?: RegExp | string
  trigger?: string | string[]
  validator?: (value: unknown, rule?: FormCreateRule, api?: FormCreateApi) => boolean | string | void | Promise<boolean | string | void>
  [key: string]: any
}

export interface FormCreateFetchOption {
  action?: string | ((rule?: FormCreateRule, api?: FormCreateApi) => any)
  data?: Record<string, any>
  headers?: Record<string, any>
  header?: Record<string, any>
  key?: string
  method?: string
  onError?: (error: unknown, rule?: FormCreateRule, api?: FormCreateApi) => void
  parse?: string | ((body: any, rule?: FormCreateRule, api?: FormCreateApi) => any)
  query?: Record<string, any>
  to?: string
  [key: string]: any
}

export interface FormCreateLoadDataEffectOption {
  attr?: string
  copy?: boolean
  default?: any
  handler?: (get: (id: string, defaultValue?: any) => any, rule?: FormCreateRule, api?: FormCreateApi) => any
  template?: string
  to?: string
  [key: string]: any
}

export type FormCreateComponentValidateEffect = boolean | string | {
  message?: string
  method?: string | ((value: unknown, rule?: FormCreateRule, api?: FormCreateApi) => any)
  trigger?: string | string[]
  validator?: (value: unknown, rule?: FormCreateRule, api?: FormCreateApi) => any
  [key: string]: any
}

export interface FormCreateControl {
  value?: any
  condition?: '==' | '!=' | '<>' | '>' | '>=' | '<' | '<=' | 'in' | 'notIn' | 'on' | 'notOn' | 'between' | 'notBetween' | 'empty' | 'notEmpty' | 'pattern' | string
  method?: 'hidden' | 'display' | 'show' | 'if' | 'disabled' | 'enabled' | 'required' | string
  rule?: Array<FormCreateRule | string>
  append?: string
  prepend?: string
  child?: boolean
  handle?: (value: any, api?: FormCreateApi) => boolean
  [key: string]: any
}

export interface FormCreateRule {
  type: string
  field?: string
  title?: string
  value?: FormCreateValue
  props?: Record<string, any>
  options?: FormCreateOptionItem[]
  children?: FormCreateRule[]
  validate?: FormCreateValidateRule[]
  $required?: boolean | string | FormCreateValidateRule
  hidden?: boolean
  display?: boolean
  emit?: Array<string | { emitPrefix?: string, inject?: boolean, name: string, prefix?: string }>
  emitPrefix?: string
  info?: string
  ignore?: boolean | 'hidden'
  inject?: boolean | Record<string, any>
  name?: string
  className?: string
  control?: FormCreateControl | FormCreateControl[]
  link?: string | string[]
  update?: (
    value: any,
    rule: NormalizedFormCreateRule,
    api: FormCreateApi,
    context: {
      field?: string
      formData: Record<string, any>
      linkField?: string
      origin?: NormalizedFormCreateRule
      value?: any
    }
  ) => boolean | Partial<FormCreateRule> | void
  effect?: {
    componentValidate?: FormCreateComponentValidateEffect
    disabled?: boolean
    display?: boolean
    fetch?: string | FormCreateFetchOption | ((rule?: FormCreateRule, api?: FormCreateApi) => FormCreateFetchOption | string | undefined)
    hidden?: boolean
    loadData?: FormCreateLoadDataEffectOption | FormCreateLoadDataEffectOption[]
    required?: boolean | string | FormCreateValidateRule
    show?: boolean
    t?: Record<string, string | {
      attr: string
      params?: Record<string, any>
      to?: string
    }>
    [key: string]: any
  }
  [key: string]: any
}

export interface FormCreateOption {
  fetch?: (option: FormCreateFetchOption, context?: { api?: FormCreateApi, rule?: FormCreateRule }) => Promise<any>
  form?: Record<string, any>
  ignoreHiddenFields?: boolean
  injectEvent?: boolean | Record<string, any>
  row?: Record<string, any>
  submitBtn?: boolean | Record<string, any>
  resetBtn?: boolean | Record<string, any>
  formData?: Record<string, any>
  globalEvent?: Record<string, ((...args: any[]) => any) | { handle?: (...args: any[]) => any }>
  globalData?: Record<string, any>
  messages?: Record<string, string>
  onChange?: (data: Record<string, any>, field?: string, value?: any, api?: FormCreateApi) => void
  onMounted?: (api: FormCreateApi) => void
  onReset?: (api: FormCreateApi) => void
  onSubmit?: (data: Record<string, any>, api?: FormCreateApi) => void
  onValidateFail?: (errors: { prop: string, message: string }[], api?: FormCreateApi) => void
  t?: (id: string, params?: Record<string, any>) => string | undefined
  [key: string]: any
}

export interface FormCreateFieldState {
  disabled?: boolean
  hidden?: boolean
  required?: boolean
  controlDisabled?: boolean
  controlHidden?: boolean
  controlRequired?: boolean
}

export interface NormalizedFormCreateRule extends FormCreateRule {
  __fcId: string
  __originType: string
}

export interface FormCreateManager {
  formData: Ref<Record<string, any>>
  fieldStates: Record<string, FormCreateFieldState>
  rules: Ref<NormalizedFormCreateRule[]>
  visibleRules: Ref<NormalizedFormCreateRule[]>
}

export interface FormCreateApi {
  validate: () => Promise<{ valid: boolean, errors: { prop: string, message: string }[] }>
  validateField: (field: string, callback?: (result: { valid: boolean, errors: { prop: string, message: string }[] }) => void) => Promise<{ valid: boolean, errors: { prop: string, message: string }[] }>
  validateFields: (fields: string | string[], callback?: (result: { valid: boolean, errors: { prop: string, message: string }[] }) => void) => Promise<{ valid: boolean, errors: { prop: string, message: string }[] }>
  clearValidateState: (fields?: string | string[]) => void
  onSubmit: (fn: FormCreateOption['onSubmit']) => void
  submit: (callback?: FormCreateOption['onSubmit']) => Promise<{ valid: boolean, errors: { prop: string, message: string }[], data: Record<string, any> }>
  changeStatus: () => boolean
  clearChangeStatus: () => void
  hideForm: (status?: boolean) => void
  /** 导出当前运行期规则快照；函数会序列化为 form-create marker 字符串，可由 parseJson 还原。 */
  toJson: (space?: number) => string | undefined
  resetFields: (fields?: string | string[]) => void
  formData: () => Record<string, any>
  getFormData: () => Record<string, any>
  getValue: (field: string) => any
  fields: () => string[]
  getRule: (field: string) => NormalizedFormCreateRule | undefined
  updateRule: (field: string, rule: Partial<FormCreateRule>) => void
  mergeRule: (field: string, rule: Partial<FormCreateRule>) => void
  refresh: () => void
  sync: (field?: string | string[]) => void
  /** 发起设计器请求并返回完整后端响应；登录态由项目请求拦截器自动携带。 */
  fetch: (option: FormCreateFetchOption) => Promise<any>
  getData: (id: string, defaultValue?: any) => any
  getGlobalData: (name: string) => Promise<any>
  setGlobalData: (name: string, value: any) => void
  setGlobalVar: (name: string, value: any) => void
  getGlobalEvent: (name: string) => ((...args: any[]) => any) | undefined
  emitGlobalEvent: (name: string, ...args: any[]) => any
  setValue: (values: Record<string, any> | string, value?: any) => void
  coverValue: (values: Record<string, any>) => void
  disabled: (status: boolean, field?: string) => void
  disabledStatus: (field: string) => boolean | undefined
  display: (status: boolean, field?: string) => void
  displayStatus: (field: string) => boolean | undefined
  hidden: (status: boolean, field?: string) => void
  hiddenStatus: (field: string) => boolean | undefined
  required: (status: boolean, field?: string) => void
  setEffect: (field: string, attr: string, value: any) => void
  t: (id: string, params?: Record<string, any>) => string | undefined
  setFieldPermission: (field: string, permission: FormFieldPermission | string) => void
}

export interface FormCreateApiContext {
  formRef: Ref<FormInstance | undefined>
  formData: Ref<Record<string, any>>
  changeStatus?: Ref<boolean>
  disabled?: Readonly<Ref<boolean>>
  hidden?: Ref<boolean>
  initialFormData?: Readonly<Ref<Record<string, any>>>
  option?: Readonly<Ref<FormCreateOption>>
  rules: Readonly<Ref<NormalizedFormCreateRule[]>>
  rulePatches?: Record<string, Partial<NormalizedFormCreateRule>>
  parseSubFormRules?: (rules: FormCreateRule[]) => FormCreateRule[]
  fieldStates: Record<string, FormCreateFieldState>
  emitChange: () => void
  emitReset?: () => void
  emitSubmit?: (data: Record<string, any>) => void
  emitValidateFail?: (errors: { prop: string, message: string }[]) => void
  clearValidateState?: (fields: string | string[]) => void
  refresh?: () => void
}
