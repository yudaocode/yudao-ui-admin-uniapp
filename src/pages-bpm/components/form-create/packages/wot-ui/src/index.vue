<template>
  <view class="fc-wot">
    <view class="fc-wot__content" :style="{ display: hidden ? 'none' : 'block' }">
      <wd-form
        ref="formRef"
        :model="formData"
        :schema="formSchema"
        :border="formOption.form?.border"
        :error-type="formOption.form?.errorType || 'toast'"
        :layout="formOption.form?.layout"
        :title-width="titleWidth"
        :value-align="formOption.form?.valueAlign"
      >
        <wd-cell-group :border="formOption.form?.border !== false">
          <template v-for="fieldRule in visibleRules" :key="fieldRule.__fcId">
            <FcSubForm
              v-if="isSubFormType(fieldRule)"
              :model-value="getValue(fieldRule)"
              :rule="fieldRule"
              :api="api"
              :option="formOption"
              :root-api="api"
              :root-rules="props.rule"
              :title-width="titleWidth"
              :disabled="isDisabled(fieldRule)"
              style=""
              @emit-event="handleSubFormEmitEvent"
              @rule-emit="handleSubFormRuleEmit"
              @update:model-value="handleUpdate(fieldRule, $event)"
            />

            <FcFieldRenderer
              v-else
              :model-value="getValue(fieldRule)"
              :rule="fieldRule"
              :title-width="titleWidth"
              :disabled="isDisabled(fieldRule)"
              style=""
              @rule-event="(eventName, ...args) => handleRuleEvent(fieldRule, eventName, ...args)"
              @update:model-value="handleUpdate(fieldRule, $event)"
            />
          </template>

          <view v-if="visibleRules.length === 0" class="fc-wot__empty">
            暂无表单字段
          </view>
        </wd-cell-group>
      </wd-form>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance, FormSchemaIssue } from '@wot-ui/ui/components/wd-form/types'
import type {
  FormCreateApi,
  FormCreateFieldState,
  FormCreateOption,
  FormCreateRule,
  NormalizedFormCreateRule,
} from '../../../types/typing'
import type { FormCreateProviderContext, FormCreateProviderState } from '../../core/src/provider'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  applyControlRules,
  applyRuleProviders,
  createApi,
  createFormSchema,
  createInitialFormData,
  getDefaultValue,
  isRuleDisabled,
  isRuleHidden,
  normalizeRules,
  normalizeSubFormRules,
  resolveRuleFetchEffects,
} from '../../core/src'
import { deepMerge, hasOwn } from '../../utils/src'
import FcFieldRenderer from './components/fieldRenderer.vue'
import FcSubForm from './components/subForm.vue'
import getConfig from './core/config'
import { invokeRuleEventHandlers } from './core/event'
import {
  getRuleEmitEvents,
  getRuleEventHandler,
  getTitleWidth,
  isSubFormType,
} from './core/utils'
import { parseRules } from './parsers'

const props = withDefaults(defineProps<{
  api?: FormCreateApi
  disabled?: boolean
  modelValue?: Record<string, any>
  option?: FormCreateOption
  preview?: boolean
  readonly?: boolean
  rule?: FormCreateRule[]
}>(), {
  disabled: false,
  modelValue: () => ({}),
  option: () => ({}),
  preview: false,
  readonly: false,
  rule: () => [],
})

const emit = defineEmits<{
  'update:api': [api: FormCreateApi]
  'update:modelValue': [data: Record<string, any>]
  'change': [data: Record<string, any>, field?: string, value?: any]
  'emit-event': [name: string, ...args: any[]]
  'mounted': [api: FormCreateApi]
  'reset': [api: FormCreateApi]
  'submit': [data: Record<string, any>, api: FormCreateApi]
  'validate-fail': [errors: { prop: string, message: string }[], api: FormCreateApi]
}>()

const formRef = ref<FormInstance>()
const formData = ref<Record<string, any>>({})
const initialFormValues = ref<Record<string, any>>({})
const fieldStates = reactive<Record<string, FormCreateFieldState>>({})
const providerStates = reactive<Record<string, FormCreateProviderState>>({})
const apiRulePatches = reactive<Record<string, Partial<NormalizedFormCreateRule>>>({})
const changeStatus = ref(false)
const hidden = ref(false)
const clearingValidateFields = ref<Set<string>>()
let api: FormCreateApi
// 用于识别本组件 emit('update:modelValue') 后父组件同步回绑的值，避免把用户输入写成 resetFields 的初始基准。
let syncingModelValue = false

const formOption = computed(() => getConfig(props.option))
const globalDisabled = computed(() => props.disabled || props.readonly || props.preview)
const titleWidth = computed(() => getTitleWidth(formOption.value))
const parsedRules = computed(() => parseRules(props.rule))
const baseRules = computed(() => normalizeRules(parsedRules.value))
const patchedBaseRules = computed(() => applyApiRulePatches(baseRules.value))
const controlResult = computed(() => applyControlRules(patchedBaseRules.value, formData.value))
const providerSourceRules = computed(() => applyApiRulePatches(controlResult.value.rules))
const providerContext: FormCreateProviderContext = {
  get api() {
    return api
  },
  get formData() {
    return formData.value
  },
  get option() {
    return formOption.value
  },
  states: providerStates,
}
const rules = computed(() => applyRuleProviders(providerSourceRules.value, providerContext))
const visibleRules = computed(() => rules.value.filter(rule => !isRuleHidden(rule, fieldStates[rule.field || ''])))
const baseFormSchema = computed(() => createFormSchema(() => rules.value, fieldStates, parseRules, providerContext))
const formSchema = computed(() => ({
  ...baseFormSchema.value,
  async validate(model: Record<string, any>) {
    const fields = clearingValidateFields.value
    const issues = await Promise.resolve(baseFormSchema.value.validate(model))
    if (!fields?.size) {
      return issues
    }
    return issues.filter(issue => !isClearingValidateIssue(issue, fields))
  },
}))
const MAX_RULE_UPDATE_DEPTH = 5

interface RuleUpdateTask {
  depth: number
  linkField?: string
  origin: NormalizedFormCreateRule
  runSelf: boolean
  sourceFields: string[]
  sourceRule: NormalizedFormCreateRule
  value: any
}

interface RuleValueChange {
  field: string
  rule: NormalizedFormCreateRule
  value: any
}

function getValue(rule: NormalizedFormCreateRule) {
  return rule.field ? formData.value[rule.field] : undefined
}

function handleUpdate(rule: NormalizedFormCreateRule, value: any) {
  if (!rule.field) {
    return
  }
  formData.value[rule.field] = value
  changeStatus.value = true
  handleRuleEvent(rule, 'change', value)
  emitChange(rule.field, value)
  runRuleUpdates(rule, value)
}

function emitChange(field?: string, value?: any) {
  changeStatus.value = true
  const data = { ...formData.value }
  syncingModelValue = true
  emit('update:modelValue', data)
  emit('change', data, field, value)
  callOptionHook('onChange', data, field, value)
  emit('emit-event', 'change', data, field, value, api)
}

function callOptionHook(name: keyof FormCreateOption, ...args: any[]) {
  const handler = formOption.value[name]
  if (typeof handler !== 'function') {
    return
  }
  try {
    handler(...args, api)
  } catch (error) {
    console.warn(`[form-create] option.${String(name)} failed`, error)
  }
}

function handleRuleEvent(rule: NormalizedFormCreateRule, eventName: string, ...args: any[]) {
  const handler = getRuleEventHandler(rule, eventName)
  invokeRuleEventHandlers(handler, {
    api,
    args,
    option: formOption.value,
    rootRules: props.rule,
    rule,
  }, error => console.warn(`[form-create] rule ${eventName} event failed`, error))
  emit('emit-event', eventName, ...args, rule, api)
  getRuleEmitEvents(rule, eventName, args, api).forEach((event) => {
    ;(emit as any)(event.name, ...event.args)
    emit('emit-event', event.name, ...event.args)
  })
}

function handleSubFormEmitEvent(name: string, ...args: any[]) {
  emit('emit-event', name, ...args)
}

function handleSubFormRuleEmit(name: string, ...args: any[]) {
  ;(emit as any)(name, ...args)
  emit('emit-event', name, ...args)
}

function getRuleLinks(rule: NormalizedFormCreateRule) {
  if (!rule.link) {
    return []
  }
  return Array.isArray(rule.link) ? rule.link : [rule.link]
}

function isPartialRule(value: unknown): value is Partial<FormCreateRule> {
  return !!value
    && typeof value === 'object'
    && !Array.isArray(value)
    && typeof (value as { then?: unknown }).then !== 'function'
}

function runRuleUpdates(sourceRule: NormalizedFormCreateRule, value: any) {
  if (!sourceRule.field && !sourceRule.name) {
    return
  }
  const visited = new Set<string>()
  const queue: RuleUpdateTask[] = [{
    depth: 0,
    linkField: sourceRule.field,
    origin: sourceRule,
    runSelf: true,
    sourceFields: [sourceRule.field, sourceRule.name].filter(Boolean) as string[],
    sourceRule,
    value,
  }]

  while (queue.length > 0) {
    const task = queue.shift()!
    const changedFields = task.runSelf
      ? runRuleUpdate(task.sourceRule, task.linkField, task.value, task.origin, visited)
      : []
    const sourceFields = Array.from(new Set([
      ...task.sourceFields,
      ...changedFields.map(item => item.field),
    ]))
    if (task.depth >= MAX_RULE_UPDATE_DEPTH) {
      warnRuleUpdateDepth(task)
      continue
    }
    runLinkedRuleUpdates(task, sourceFields, visited, queue)
  }
}

function warnRuleUpdateDepth(task: RuleUpdateTask) {
  console.warn(
    `[form-create] rule.update/link reached max depth ${MAX_RULE_UPDATE_DEPTH}, linked updates stopped.`,
    {
      field: task.sourceRule.field,
      linkField: task.linkField,
      originField: task.origin.field,
    },
  )
}

function runLinkedRuleUpdates(
  task: RuleUpdateTask,
  sourceFields: string[],
  visited: Set<string>,
  queue: RuleUpdateTask[],
) {
  rules.value.forEach((rule) => {
    if (typeof rule.update !== 'function' || visited.has(rule.__fcId)) {
      return
    }
    const matchedField = getRuleLinks(rule).find(link => sourceFields.includes(link))
    if (!matchedField) {
      return
    }
    const nextValue = hasOwn(formData.value, matchedField) ? formData.value[matchedField] : task.value
    const changedFields = runRuleUpdate(rule, matchedField, nextValue, task.origin, visited)
    changedFields.forEach((change) => {
      queue.push({
        depth: task.depth + 1,
        linkField: change.field,
        origin: task.origin,
        runSelf: false,
        sourceFields: [change.field],
        sourceRule: change.rule,
        value: change.value,
      })
    })
  })
}

function runRuleUpdate(
  rule: NormalizedFormCreateRule,
  linkField: string | undefined,
  value: any,
  origin: NormalizedFormCreateRule,
  visited: Set<string>,
): RuleValueChange[] {
  if (typeof rule.update !== 'function' || visited.has(rule.__fcId)) {
    return []
  }
  visited.add(rule.__fcId)
  try {
    const result = rule.update(rule.field ? formData.value[rule.field] : value, rule, api, {
      field: rule.field,
      formData: { ...formData.value },
      linkField,
      origin,
      value,
    })
    if (typeof result === 'boolean') {
      if (rule.field) {
        api.hidden(result, rule.field)
      }
    } else if (isPartialRule(result)) {
      const previousValue = rule.field ? formData.value[rule.field] : undefined
      api.mergeRule(rule.__fcId, result)
      if (rule.field && hasOwn(result, 'value')) {
        const nextValue = formData.value[rule.field]
        if (!isSamePlainValue(previousValue, nextValue)) {
          return [{ field: rule.field, rule, value: nextValue }]
        }
      }
    }
  } catch (error) {
    console.warn('[form-create] rule.update failed', error)
  }
  return []
}

function emitReset() {
  callOptionHook('onReset')
  emit('reset', api)
  emit('emit-event', 'reset', api)
}

function emitSubmit(data: Record<string, any>) {
  callOptionHook('onSubmit', data)
  emit('submit', data, api)
  emit('emit-event', 'submit', data, api)
}

function emitValidateFail(errors: { prop: string, message: string }[]) {
  callOptionHook('onValidateFail', errors)
  emit('validate-fail', errors, api)
  emit('emit-event', 'validate-fail', errors, api)
}

function isDisabled(rule: NormalizedFormCreateRule) {
  return isRuleDisabled(globalDisabled.value || !!rule.props?.disabled, fieldStates[rule.field || ''], rule)
}

function clearValidateState(fields: string | string[]) {
  const targets = getClearValidateTargets(fields)
  if (targets.length === 0 || !formRef.value) {
    return
  }
  // wd-form 会在 validate() 调用期间同步进入 schema.validate()。这里只在本次调用入口暴露过滤集合，
  // schema.validate() 自己先捕获集合再 await，避免并发的真实 validate 被清提示逻辑误过滤；
  // 如果后续 Wot UI 改成异步进入 schema.validate()，这里会安全降级为不清理指定字段提示。
  clearingValidateFields.value = new Set(targets)
  const promise = formRef.value.validate(targets)
  clearingValidateFields.value = undefined
  void promise
}

function getClearValidateTargets(fields: string | string[]) {
  const requested = normalizeValidateFields(fields)
  if (requested.length === 0) {
    return []
  }
  const paths = new Set([
    ...requested,
    ...collectRuleFieldPaths(rules.value, formData.value),
  ])
  const targets: string[] = []
  paths.forEach((path) => {
    if (requested.some(field => isValidatePathMatch(path, field))) {
      targets.push(path)
    }
  })
  return targets
}

function collectRuleFieldPaths(nextRules: NormalizedFormCreateRule[], data: Record<string, any>, prefix = ''): string[] {
  const paths: string[] = []
  nextRules.forEach((rule) => {
    if (!rule.field) {
      return
    }
    const path = prefix ? `${prefix}.${rule.field}` : rule.field
    paths.push(path)
    if (!isSubFormType(rule)) {
      return
    }
    const rows = data?.[rule.field]
    if (!Array.isArray(rows)) {
      return
    }
    const children = normalizeSubFormRules(rule, parseRules)
    rows.forEach((row, index) => {
      paths.push(...collectRuleFieldPaths(children, row || {}, `${path}.${index}`))
    })
  })
  return paths
}

function normalizeValidateFields(fields: string | string[]) {
  return (Array.isArray(fields) ? fields : [fields])
    .map(field => String(field).trim())
    .filter(Boolean)
}

function isClearingValidateIssue(issue: FormSchemaIssue, fields: Set<string>) {
  const path = issue.path.map(item => String(item)).join('.')
  let matched = false
  fields.forEach((field) => {
    if (isValidatePathMatch(path, field)) {
      matched = true
    }
  })
  return matched
}

function isValidatePathMatch(path: string, field: string) {
  return path === field || path.startsWith(`${field}.`) || field.startsWith(`${path}.`)
}

function applyApiRulePatches(nextRules: NormalizedFormCreateRule[]) {
  return nextRules.map((rule) => {
    const patch = apiRulePatches[rule.__fcId]
    return patch ? deepMerge<NormalizedFormCreateRule>(rule, patch) : rule
  })
}

api = createApi({
  changeStatus,
  disabled: globalDisabled,
  emitChange: () => emitChange(),
  emitReset,
  emitSubmit,
  emitValidateFail,
  fieldStates,
  formData,
  formRef,
  hidden,
  initialFormData: initialFormValues,
  option: formOption,
  parseSubFormRules: parseRules,
  clearValidateState,
  refresh: () => scheduleProviderFetchEffects(),
  rulePatches: apiRulePatches,
  rules,
})

let providerFetchVersion = 0
let providerFetchTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => [props.modelValue, props.option?.formData, props.rule],
  () => {
    if (syncingModelValue && isSamePlainValue(props.modelValue || {}, formData.value)) {
      syncingModelValue = false
      return
    }
    syncingModelValue = false
    const initialValues = deepMerge<Record<string, any>>(formOption.value.formData || {}, props.modelValue || {})
    initialFormValues.value = initialValues
    formData.value = createInitialFormData(baseRules.value, initialValues)
  },
  { deep: true, immediate: true },
)

function isSamePlainValue(left: unknown, right: unknown) {
  try {
    return JSON.stringify(left) === JSON.stringify(right)
  } catch {
    return false
  }
}

watch(
  rules,
  (nextRules) => {
    pruneRuleStateMaps(nextRules)
    nextRules.forEach((rule) => {
      if (rule.field && !fieldStates[rule.field]) {
        fieldStates[rule.field] = {}
      }
      if (rule.field && !hasOwn(formData.value, rule.field)) {
        formData.value[rule.field] = hasOwn(initialFormValues.value, rule.field)
          ? initialFormValues.value[rule.field]
          : rule.value !== undefined ? rule.value : getDefaultValue(rule)
      }
    })
  },
  { immediate: true },
)

watch(
  () => controlResult.value.fieldStates,
  (nextStates) => {
    const fields = new Set([
      ...rules.value.map(rule => rule.field).filter(Boolean) as string[],
      ...Object.keys(nextStates),
    ])
    fields.forEach((field) => {
      if (!fieldStates[field]) {
        fieldStates[field] = {}
      }
      fieldStates[field].controlHidden = nextStates[field]?.controlHidden
      fieldStates[field].controlDisabled = nextStates[field]?.controlDisabled
      fieldStates[field].controlRequired = nextStates[field]?.controlRequired
    })
  },
  { deep: true, immediate: true },
)

watch(
  () => [controlResult.value.rules, formData.value, formOption.value.globalData],
  () => {
    scheduleProviderFetchEffects()
  },
  { deep: true, immediate: true },
)

function scheduleProviderFetchEffects() {
  if (providerFetchTimer) {
    clearTimeout(providerFetchTimer)
  }
  providerFetchTimer = setTimeout(() => {
    providerFetchTimer = undefined
    void refreshProviderFetchEffects()
  }, 300)
}

async function refreshProviderFetchEffects() {
  const version = ++providerFetchVersion
  const results = await resolveRuleFetchEffects(providerSourceRules.value, providerContext)
  if (version !== providerFetchVersion) {
    return
  }
  results.forEach((result) => {
    if (!providerStates[result.fieldId]) {
      providerStates[result.fieldId] = {}
    }
    providerStates[result.fieldId].fetchLoaded = true
    providerStates[result.fieldId].fetchPatch = result.patch
  })
}

onBeforeUnmount(() => {
  if (providerFetchTimer) {
    clearTimeout(providerFetchTimer)
    providerFetchTimer = undefined
  }
})

function pruneRuleStateMaps(nextRules: NormalizedFormCreateRule[]) {
  const fieldIds = new Set(nextRules.map(rule => rule.field).filter(Boolean) as string[])
  const ruleIds = new Set(nextRules.map(rule => rule.__fcId))
  Object.keys(fieldStates).forEach((field) => {
    if (!fieldIds.has(field)) {
      delete fieldStates[field]
    }
  })
  Object.keys(providerStates).forEach((fieldId) => {
    if (!ruleIds.has(fieldId)) {
      delete providerStates[fieldId]
    }
  })
}

onMounted(() => {
  emit('update:api', api)
  emit('mounted', api)
  callOptionHook('onMounted')
  emit('emit-event', 'mounted', api)
})

defineExpose({
  ...api,
  api,
})
</script>

<style lang="scss" scoped>
@import './style/index.scss';
</style>
