<template>
  <wd-form-item :title="rule.title" :title-width="titleWidth" :prop="rule.field" layout="vertical">
    <view class="fc-sub-form">
      <view v-for="(item, itemIndex) in rows" :key="getItemRowKey(item)" class="fc-sub-form__item">
        <view class="fc-sub-form__header">
          <view class="fc-sub-form__header-main" @click="toggleItem(itemIndex)">
            <text class="fc-sub-form__title">{{ getItemTitle(itemIndex) }}</text>
            <text v-if="collapseEnabled" class="fc-sub-form__collapse">
              {{ isItemCollapsed(itemIndex) ? '展开' : '收起' }}
            </text>
          </view>
          <view class="fc-sub-form__actions">
            <wd-button v-if="sortEnabled" size="small" variant="plain" :disabled="disabled || itemIndex === 0" @click.stop="moveItem(itemIndex, itemIndex - 1)">
              上移
            </wd-button>
            <wd-button v-if="sortEnabled" size="small" variant="plain" :disabled="disabled || itemIndex === rows.length - 1" @click.stop="moveItem(itemIndex, itemIndex + 1)">
              下移
            </wd-button>
            <wd-button v-if="canRemove" size="small" type="danger" variant="plain" :disabled="disabled" @click.stop="removeItem(itemIndex)">
              删除
            </wd-button>
          </view>
        </view>

        <view v-show="!isItemCollapsed(itemIndex)" class="fc-sub-form__body">
          <template v-for="childRule in getItemRules(itemIndex)" :key="`${getItemRowKey(item)}_${childRule.__fcId}`">
            <FcSubForm
              v-if="isSubFormType(childRule)"
              :model-value="getItemValue(itemIndex, childRule.field)"
              :rule="getRenderRule(childRule, itemIndex)"
              :api="createItemApi(itemIndex)"
              :option="option"
              :root-api="rootApi || api"
              :root-rules="rootRules"
              :title-width="childTitleWidth"
              :disabled="isChildDisabled(childRule, itemIndex)"
              style=""
              @emit-event="emitChildEvent"
              @rule-emit="emitChildRuleEvent"
              @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
            />

            <FcFieldRenderer
              v-else
              :model-value="getItemValue(itemIndex, childRule.field)"
              :rule="getRenderRule(childRule, itemIndex)"
              :title-width="childTitleWidth"
              :disabled="isChildDisabled(childRule, itemIndex)"
              unsupported-suffix="子字段"
              style=""
              @rule-event="(eventName, ...args) => handleChildRuleEvent(itemIndex, getRenderRule(childRule, itemIndex), childRule, undefined, eventName, ...args)"
              @update:model-value="setItemValue(itemIndex, childRule.field, $event)"
            />
          </template>
        </view>
      </view>

      <wd-button v-if="canAdd" variant="plain" block type="primary" :disabled="disabled" @click="addItem">
        添加{{ rule.title || '子表单' }}
      </wd-button>

      <view v-else-if="rows.length === 0" class="fc-sub-form__empty">
        暂无{{ rule.title || '子表单' }}数据
      </view>
    </view>
  </wd-form-item>
</template>

<script lang="ts" setup>
import type { FormCreateApi, FormCreateFieldState, FormCreateOption, FormCreateRule, NormalizedFormCreateRule } from '../../../../types/typing'
import type { FormCreateProviderContext, FormCreateProviderState } from '../../../core/src/provider'
import { computed, onBeforeUnmount, reactive, ref, toRaw, watch } from 'vue'
import { applyControlRules, applyRuleProviders, fetchProviderData, getDefaultValue, getProviderData, isRuleDisabled, isRuleHidden, normalizeSubFormRules, resolveRuleFetchEffects, translate } from '../../../core/src'
import { deepMerge, hasOwn } from '../../../utils/src'
import {
  getRuleEmitEvents,
  getRuleEventHandler,
  INTERNAL_LAYOUT_TITLE_TYPE,
  isSubFormType,
} from '../core/utils'
import { invokeRuleEventHandlers } from '../core/event'
import { parseRules } from '../parsers'
import FcFieldRenderer from './fieldRenderer.vue'

defineOptions({
  name: 'FcSubForm',
})

const props = defineProps<{
  api?: FormCreateApi
  disabled?: boolean
  modelValue?: any
  option?: FormCreateOption
  rootApi?: FormCreateApi
  rootRules?: FormCreateRule[]
  rule: NormalizedFormCreateRule
  titleWidth?: string | number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any[]]
  'change': [value: any[]]
  'emit-event': [name: string, ...args: any[]]
  'rule-emit': [name: string, ...args: any[]]
}>()

const collapsedRows = ref<Record<number, boolean>>({})
const itemFieldStates = reactive<Record<string, Record<string, FormCreateFieldState>>>({})
const itemRulePatches = reactive<Record<string, Record<string, Partial<NormalizedFormCreateRule>>>>({})
const providerStates = reactive<Record<string, Record<string, FormCreateProviderState>>>({})
const itemRowKeys = new WeakMap<Record<string, any>, string>()
const EMPTY_PROVIDER_STATES: Record<string, FormCreateProviderState> = {}
const baseChildRules = computed(() => normalizeSubFormRules(props.rule, parseRules, {
  createColumnTitleRule,
}))
const rows = computed(() => normalizeRows(props.modelValue))
const childTitleWidth = computed(() => props.rule.props?.childTitleWidth || props.rule.props?.labelWidth || props.titleWidth || '180rpx')
const min = computed(() => normalizeCount(props.rule.props?.min))
const max = computed(() => normalizeCount(props.rule.props?.max))
const expand = computed(() => normalizeCount(props.rule.props?.expand))
const sortEnabled = computed(() => props.rule.props?.sortBtn === true || props.rule.props?.sortable === true)
const collapseEnabled = computed(() => props.rule.props?.collapse === true || props.rule.props?.collapsible === true || props.rule.props?.foldable === true)
const defaultCollapsed = computed(() => props.rule.props?.defaultCollapsed === true || props.rule.props?.collapsed === true)
const canRemove = computed(() => !props.disabled && rows.value.length > min.value)
const canAdd = computed(() => !props.disabled && (!max.value || rows.value.length < max.value))
let providerFetchVersion = 0
let providerFetchTimer: ReturnType<typeof setTimeout> | undefined
let itemRowKeySequence = 0
const MAX_RULE_UPDATE_DEPTH = 5

interface ItemRuleUpdateTask {
  depth: number
  linkField?: string
  origin: NormalizedFormCreateRule
  runSelf: boolean
  sourceFields: string[]
  sourceRule: NormalizedFormCreateRule
  value: any
}

interface ItemRuleValueChange {
  field: string
  rule: NormalizedFormCreateRule
  value: any
}

watch(
  () => [props.modelValue, baseChildRules.value, min.value, expand.value],
  () => ensureRows(),
  { deep: true, immediate: true },
)

watch(
  () => baseChildRules.value,
  () => {
    clearItemFieldStates()
    clearItemRulePatches()
    clearProviderStates()
    scheduleProviderFetchEffects()
  },
  { deep: true },
)

watch(
  () => [rows.value, props.option?.globalData],
  () => scheduleProviderFetchEffects(),
  { deep: true, immediate: true },
)

function createColumnTitleRule(column: Record<string, any>, index: number): FormCreateRule | undefined {
  const label = column.label || column.title || column.name
  if (!label) {
    return undefined
  }
  return {
    type: INTERNAL_LAYOUT_TITLE_TYPE,
    title: label,
    __fcId: `${INTERNAL_LAYOUT_TITLE_TYPE}_${props.rule.__fcId}_${index}`,
    __originType: 'tableFormColumn',
  }
}

function ensureRows() {
  const minCount = Math.max(min.value, expand.value)
  if (rows.value.length >= minCount) {
    return
  }
  const nextRows = [...rows.value]
  while (nextRows.length < minCount) {
    nextRows.push(createDefaultRow())
  }
  emitValue(nextRows)
}

function normalizeRows(value: any): Record<string, any>[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(item => (item && typeof item === 'object' && !Array.isArray(item) ? item : {}))
}

function normalizeCount(value: any) {
  const count = Number(value)
  return Number.isFinite(count) && count > 0 ? count : 0
}

function createDefaultRow() {
  const defaultValue = props.rule.props?.defaultValue
  const row = defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue) ? { ...defaultValue } : {}
  fillDefaultRow(row, baseChildRules.value)
  fillDefaultRow(row, applyControlRules(baseChildRules.value, row).rules)
  return row
}

function fillDefaultRow(row: Record<string, any>, rules: NormalizedFormCreateRule[]) {
  rules.forEach((childRule) => {
    if (!childRule.field || row[childRule.field] !== undefined) {
      return
    }
    row[childRule.field] = childRule.value !== undefined ? childRule.value : getDefaultValue(childRule)
  })
}

function getItemRules(itemIndex: number) {
  return getItemAllRules(itemIndex).filter(rule => !isRuleHidden(rule, getItemFieldState(itemIndex, rule)))
}

function getItemAllRules(itemIndex: number, rowOverride?: Record<string, any>) {
  const result = getItemControlResult(itemIndex, rowOverride)
  const providerContext = getItemProviderContext(itemIndex, rowOverride)
  const rules = applyRuleProviders(result?.rules || baseChildRules.value, providerContext)
  return applyItemRulePatches(itemIndex, rules)
}

function getItemProviderContext(itemIndex: number, rowOverride?: Record<string, any>): FormCreateProviderContext {
  return {
    api: props.api,
    formData: rowOverride || rows.value[itemIndex] || {},
    option: props.option,
    states: getItemProviderStates(itemIndex) || EMPTY_PROVIDER_STATES,
  }
}

function getItemProviderStates(itemIndex: number) {
  return providerStates[getProviderStateKey(itemIndex)]
}

function ensureItemProviderStates(itemIndex: number) {
  const key = getProviderStateKey(itemIndex)
  if (!providerStates[key]) {
    providerStates[key] = {}
  }
  return providerStates[key]
}

function getProviderStateKey(itemIndex: number) {
  return String(itemIndex)
}

function getItemFieldState(itemIndex: number, rule: NormalizedFormCreateRule) {
  if (!rule.field) {
    return undefined
  }
  const manualState = itemFieldStates[getProviderStateKey(itemIndex)]?.[rule.field]
  const controlState = getItemControlResult(itemIndex)?.fieldStates[rule.field]
  if (!manualState && !controlState) {
    return undefined
  }
  return {
    ...(manualState || {}),
    ...(controlState || {}),
  }
}

let controlCacheRules: NormalizedFormCreateRule[] | undefined
let rowControlCache = new WeakMap<Record<string, any>, ReturnType<typeof applyControlRules>>()

function getItemControlResult(itemIndex: number, rowOverride?: Record<string, any>) {
  const rules = getItemBaseRules(itemIndex)
  const hasPatches = hasItemRulePatches(itemIndex)
  if (controlCacheRules !== rules) {
    controlCacheRules = rules
    rowControlCache = new WeakMap<Record<string, any>, ReturnType<typeof applyControlRules>>()
  }
  const row = rowOverride || rows.value[itemIndex]
  if (!row) {
    const result = applyControlRules(rules, {})
    return hasPatches ? { ...result, rules: applyItemRulePatches(itemIndex, result.rules) } : result
  }
  const cached = !hasPatches && !rowOverride ? rowControlCache.get(row) : undefined
  if (cached) {
    return cached
  }
  const result = applyControlRules(rules, row)
  const patchedResult = hasPatches ? { ...result, rules: applyItemRulePatches(itemIndex, result.rules) } : result
  if (!hasPatches && !rowOverride) {
    rowControlCache.set(row, patchedResult)
  }
  return patchedResult
}

function getItemBaseRules(itemIndex: number) {
  return applyItemRulePatches(itemIndex, baseChildRules.value)
}

function applyItemRulePatches(itemIndex: number, rules: NormalizedFormCreateRule[]) {
  const patches = itemRulePatches[getProviderStateKey(itemIndex)]
  if (!patches || Object.keys(patches).length === 0) {
    return rules
  }
  return rules.map((rule) => {
    const patch = patches[rule.__fcId]
    return patch ? deepMerge<NormalizedFormCreateRule>(rule, patch) : rule
  })
}

function hasItemRulePatches(itemIndex: number) {
  const patches = itemRulePatches[getProviderStateKey(itemIndex)]
  return !!patches && Object.keys(patches).length > 0
}

function getRenderRule(rule: NormalizedFormCreateRule, itemIndex: number): NormalizedFormCreateRule {
  return {
    ...rule,
    field: getChildProp(itemIndex, rule.field),
  }
}

function getChildProp(itemIndex: number, field?: string) {
  return field && props.rule.field ? `${props.rule.field}.${itemIndex}.${field}` : field
}

function getItemValue(itemIndex: number, field?: string) {
  if (!field) {
    return undefined
  }
  return rows.value[itemIndex]?.[field]
}

function getItemRowKey(row: Record<string, any>) {
  const rawRow = toRaw(row)
  let key = itemRowKeys.get(rawRow)
  if (!key) {
    itemRowKeySequence += 1
    key = `form-create-sub-form-row-${itemRowKeySequence}`
    itemRowKeys.set(rawRow, key)
  }
  return key
}

function setItemRowValues(
  targetRows: Record<string, any>[],
  itemIndex: number,
  values: Record<string, any>,
  cover = false,
) {
  const currentRow = targetRows[itemIndex] || {}
  const nextRow = cover ? { ...values } : { ...currentRow, ...values }
  itemRowKeys.set(toRaw(nextRow), getItemRowKey(currentRow))
  targetRows[itemIndex] = nextRow
}

function setItemValue(itemIndex: number, field: string | undefined, value: any) {
  if (!field) {
    return
  }
  const nextRows = [...rows.value]
  setItemRowValues(nextRows, itemIndex, { [field]: value })
  const rule = getItemAllRules(itemIndex, nextRows[itemIndex]).find(item => item.field === field)
  if (rule) {
    runItemRuleUpdates(itemIndex, rule, value, nextRows)
  }
  emitValue(nextRows)
  if (rule) {
    handleChildRuleEvent(itemIndex, getRenderRule(rule, itemIndex), rule, nextRows, 'change', value)
  }
}

function handleChildRuleEvent(
  itemIndex: number,
  rule: NormalizedFormCreateRule,
  selfRule: NormalizedFormCreateRule,
  eventRows: Record<string, any>[] | undefined,
  eventName: string,
  ...args: any[]
) {
  const itemApi = createItemApi(itemIndex, eventRows)
  const legacyApi = props.rootApi || props.api
  const handler = getRuleEventHandler(rule, eventName)
  invokeRuleEventHandlers(handler, {
    api: itemApi,
    args,
    legacyApi,
    option: props.option,
    rootRules: props.rootRules,
    rule,
    selfRule,
  }, error => console.warn(`[form-create] child rule ${eventName} event failed`, error))
  emit('emit-event', eventName, ...args, rule, legacyApi)
  getRuleEmitEvents(rule, eventName, args, legacyApi).forEach((event) => {
    emit('rule-emit', event.name, ...event.args)
  })
}

function createItemApi(itemIndex: number, initialRows?: Record<string, any>[]): FormCreateApi | undefined {
  const rootApi = props.api
  if (!rootApi) {
    return undefined
  }
  let localRows = initialRows
  const initialRow = (initialRows || rows.value)[itemIndex]
  if (!initialRow) {
    return undefined
  }
  const rowKey = getItemRowKey(initialRow)
  const releaseRows = (value: Record<string, any>[]) => {
    void Promise.resolve().then(() => {
      if (localRows === value) {
        localRows = undefined
      }
    })
  }
  if (initialRows) {
    releaseRows(initialRows)
  }
  const currentRows = () => localRows || rows.value
  const currentItemIndex = () => currentRows().findIndex(row => getItemRowKey(row) === rowKey)
  const currentRow = () => {
    const currentIndex = currentItemIndex()
    return currentIndex >= 0 ? currentRows()[currentIndex] : {}
  }
  const currentRules = () => {
    const currentIndex = currentItemIndex()
    return currentIndex >= 0 ? getItemAllRules(currentIndex, currentRow()) : []
  }
  const findRule = (field: string) => currentRules().find(rule =>
    rule.field === field
    || rule.name === field
    || rule.__fcId === field
    || getChildProp(currentItemIndex(), rule.field) === field,
  )
  const normalizeFields = (fields?: string | string[]) => {
    if (fields === undefined) {
      return currentRules().map(rule => rule.field).filter(Boolean) as string[]
    }
    return Array.isArray(fields) ? fields : [fields]
  }
  const emitRows = (value: Record<string, any>[]) => {
    localRows = value
    emitValue(value)
    releaseRows(value)
  }
  const updateRow = (values: Record<string, any>, cover = false) => {
    const currentIndex = currentItemIndex()
    if (currentIndex < 0) {
      return
    }
    const nextRows = [...currentRows()]
    setItemRowValues(nextRows, currentIndex, values, cover)
    emitRows(nextRows)
  }
  const providerContext = (api: FormCreateApi): FormCreateProviderContext => {
    const currentIndex = currentItemIndex()
    return {
      api,
      formData: currentRow(),
      option: props.option,
      states: currentIndex >= 0 ? getItemProviderStates(currentIndex) || EMPTY_PROVIDER_STATES : EMPTY_PROVIDER_STATES,
    }
  }
  let itemApi: FormCreateApi
  const overrides: Partial<FormCreateApi> = {
    formData() {
      return { ...currentRow() }
    },
    getFormData() {
      return itemApi.formData()
    },
    getValue(field) {
      return currentRow()[findRule(field)?.field || field]
    },
    fields() {
      return normalizeFields()
    },
    getRule(field) {
      return findRule(field)
    },
    fetch(option) {
      return fetchProviderData(option, providerContext(itemApi), undefined, { rawResponse: true })
    },
    getData(id, defaultValue) {
      return getProviderData(id, providerContext(itemApi), defaultValue)
    },
    async getGlobalData(name) {
      const source = props.option?.globalData?.[name]
      if (source?.type === 'fetch') {
        return fetchProviderData({ key: name }, providerContext(itemApi))
      }
      return itemApi.getData(`$globalData.${name}`)
    },
    setValue(values, value) {
      updateRow(typeof values === 'string' ? { [values]: value } : values)
    },
    coverValue(values) {
      updateRow(values, true)
    },
    t(id, params) {
      return translate(id, params, providerContext(itemApi))
    },
  }
  itemApi = new Proxy(rootApi, {
    get(target, key, receiver) {
      return Object.prototype.hasOwnProperty.call(overrides, key)
        ? Reflect.get(overrides, key, overrides)
        : Reflect.get(target, key, receiver)
    },
  })
  return itemApi
}

function emitChildEvent(name: string, ...args: any[]) {
  emit('emit-event', name, ...args)
}

function emitChildRuleEvent(name: string, ...args: any[]) {
  emit('rule-emit', name, ...args)
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

function runItemRuleUpdates(
  itemIndex: number,
  sourceRule: NormalizedFormCreateRule,
  value: any,
  nextRows: Record<string, any>[],
) {
  if (!sourceRule.field && !sourceRule.name) {
    return
  }
  const visited = new Set<string>()
  const queue: ItemRuleUpdateTask[] = [{
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
      ? runItemRuleUpdate(itemIndex, task.sourceRule, task.linkField, task.value, task.origin, visited, nextRows)
      : []
    const sourceFields = Array.from(new Set([
      ...task.sourceFields,
      ...changedFields.map(item => item.field),
    ]))
    if (task.depth >= MAX_RULE_UPDATE_DEPTH) {
      warnItemRuleUpdateDepth(itemIndex, task)
      continue
    }
    runLinkedItemRuleUpdates(itemIndex, task, sourceFields, visited, queue, nextRows)
  }
}

function warnItemRuleUpdateDepth(itemIndex: number, task: ItemRuleUpdateTask) {
  console.warn(
    `[form-create] child rule.update/link reached max depth ${MAX_RULE_UPDATE_DEPTH}, linked updates stopped.`,
    {
      field: task.sourceRule.field,
      itemIndex,
      linkField: task.linkField,
      originField: task.origin.field,
    },
  )
}

function runLinkedItemRuleUpdates(
  itemIndex: number,
  task: ItemRuleUpdateTask,
  sourceFields: string[],
  visited: Set<string>,
  queue: ItemRuleUpdateTask[],
  nextRows: Record<string, any>[],
) {
  getItemAllRules(itemIndex, nextRows[itemIndex]).forEach((rule) => {
    if (typeof rule.update !== 'function' || visited.has(rule.__fcId)) {
      return
    }
    const matchedField = getRuleLinks(rule).find(link => sourceFields.includes(link))
    if (!matchedField) {
      return
    }
    const row = nextRows[itemIndex] || {}
    const nextValue = hasOwn(row, matchedField) ? row[matchedField] : task.value
    const changedFields = runItemRuleUpdate(itemIndex, rule, matchedField, nextValue, task.origin, visited, nextRows)
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

function runItemRuleUpdate(
  itemIndex: number,
  rule: NormalizedFormCreateRule,
  linkField: string | undefined,
  value: any,
  origin: NormalizedFormCreateRule,
  visited: Set<string>,
  nextRows: Record<string, any>[],
): ItemRuleValueChange[] {
  if (typeof rule.update !== 'function' || visited.has(rule.__fcId)) {
    return []
  }
  visited.add(rule.__fcId)
  const row = nextRows[itemIndex] || {}
  try {
    const result = rule.update(rule.field ? row[rule.field] : value, rule, props.api!, {
      field: rule.field,
      formData: { ...row },
      linkField,
      origin,
      value,
    })
    if (typeof result === 'boolean') {
      setItemRuleHidden(itemIndex, rule, result)
    } else if (isPartialRule(result)) {
      const previousValue = rule.field ? row[rule.field] : undefined
      mergeItemRule(itemIndex, rule, result, nextRows)
      if (rule.field && hasOwn(result, 'value')) {
        const nextValue = nextRows[itemIndex]?.[rule.field]
        if (!isSamePlainValue(previousValue, nextValue)) {
          return [{ field: rule.field, rule, value: nextValue }]
        }
      }
    }
  } catch (error) {
    console.warn('[form-create] child rule.update failed', error)
  }
  return []
}

function setItemRuleHidden(itemIndex: number, rule: NormalizedFormCreateRule, hidden: boolean) {
  if (!rule.field) {
    return
  }
  const states = ensureItemFieldStates(itemIndex)
  states[rule.field] = {
    ...(states[rule.field] || {}),
    hidden,
  }
}

function mergeItemRule(
  itemIndex: number,
  rule: NormalizedFormCreateRule,
  patch: Partial<FormCreateRule>,
  nextRows: Record<string, any>[],
) {
  const patches = ensureItemRulePatches(itemIndex)
  patches[rule.__fcId] = {
    ...deepMerge(patches[rule.__fcId], patch),
    __fcId: rule.__fcId,
    __originType: rule.__originType,
  } as Partial<NormalizedFormCreateRule>
  if (rule.field && hasOwn(patch, 'value')) {
    setItemRowValues(nextRows, itemIndex, { [rule.field]: patch.value })
  }
  scheduleProviderFetchEffects()
}

function ensureItemFieldStates(itemIndex: number) {
  const key = getProviderStateKey(itemIndex)
  if (!itemFieldStates[key]) {
    itemFieldStates[key] = {}
  }
  return itemFieldStates[key]
}

function ensureItemRulePatches(itemIndex: number) {
  const key = getProviderStateKey(itemIndex)
  if (!itemRulePatches[key]) {
    itemRulePatches[key] = {}
  }
  return itemRulePatches[key]
}

function isSamePlainValue(left: unknown, right: unknown) {
  try {
    return JSON.stringify(left) === JSON.stringify(right)
  } catch {
    return false
  }
}

function addItem() {
  if (!canAdd.value) {
    return
  }
  emitValue([...rows.value, createDefaultRow()])
}

function removeItem(itemIndex: number) {
  if (!canRemove.value) {
    return
  }
  const nextRows = [...rows.value]
  nextRows.splice(itemIndex, 1)
  removeCollapsedRow(itemIndex)
  removeItemFieldStateRow(itemIndex)
  removeItemRulePatchRow(itemIndex)
  removeProviderRow(itemIndex)
  emitValue(nextRows)
}

function moveItem(fromIndex: number, toIndex: number) {
  if (props.disabled || toIndex < 0 || toIndex >= rows.value.length || fromIndex === toIndex) {
    return
  }
  const nextRows = [...rows.value]
  const [item] = nextRows.splice(fromIndex, 1)
  nextRows.splice(toIndex, 0, item)
  moveCollapsedRow(fromIndex, toIndex)
  moveItemFieldStateRow(fromIndex, toIndex)
  moveItemRulePatchRow(fromIndex, toIndex)
  moveProviderRow(fromIndex, toIndex)
  emitValue(nextRows)
}

function removeCollapsedRow(removeIndex: number) {
  const nextCollapsed: Record<number, boolean> = {}
  Object.entries(collapsedRows.value).forEach(([key, value]) => {
    const index = Number(key)
    if (!Number.isInteger(index) || index === removeIndex) {
      return
    }
    nextCollapsed[index > removeIndex ? index - 1 : index] = value
  })
  collapsedRows.value = nextCollapsed
}

function moveCollapsedRow(fromIndex: number, toIndex: number) {
  const nextCollapsed: Record<number, boolean> = {}
  Object.entries(collapsedRows.value).forEach(([key, value]) => {
    const index = Number(key)
    if (!Number.isInteger(index)) {
      return
    }
    if (index === fromIndex) {
      nextCollapsed[toIndex] = value
    } else if (index === toIndex) {
      nextCollapsed[fromIndex] = value
    } else {
      nextCollapsed[index] = value
    }
  })
  collapsedRows.value = nextCollapsed
}

function clearItemFieldStates() {
  Object.keys(itemFieldStates).forEach((key) => {
    delete itemFieldStates[key]
  })
}

function clearItemRulePatches() {
  Object.keys(itemRulePatches).forEach((key) => {
    delete itemRulePatches[key]
  })
}

function clearProviderStates() {
  Object.keys(providerStates).forEach((key) => {
    delete providerStates[key]
  })
}

function removeItemFieldStateRow(removeIndex: number) {
  reindexRowRecord(itemFieldStates, removeIndex)
}

function removeItemRulePatchRow(removeIndex: number) {
  reindexRowRecord(itemRulePatches, removeIndex)
}

function removeProviderRow(removeIndex: number) {
  reindexRowRecord(providerStates, removeIndex)
}

function moveItemFieldStateRow(fromIndex: number, toIndex: number) {
  moveRowRecord(itemFieldStates, fromIndex, toIndex)
}

function moveItemRulePatchRow(fromIndex: number, toIndex: number) {
  moveRowRecord(itemRulePatches, fromIndex, toIndex)
}

function moveProviderRow(fromIndex: number, toIndex: number) {
  moveRowRecord(providerStates, fromIndex, toIndex)
}

function reindexRowRecord<T>(record: Record<string, T>, removeIndex: number) {
  const nextRecord: Record<string, T> = {}
  Object.entries(record).forEach(([key, value]) => {
    const index = Number(key)
    if (!Number.isInteger(index) || index === removeIndex) {
      return
    }
    nextRecord[String(index > removeIndex ? index - 1 : index)] = value
  })
  Object.keys(record).forEach((key) => {
    delete record[key]
  })
  Object.assign(record, nextRecord)
}

function moveRowRecord<T>(record: Record<string, T>, fromIndex: number, toIndex: number) {
  const nextRecord: Record<string, T> = {}
  Object.entries(record).forEach(([key, value]) => {
    const index = Number(key)
    if (!Number.isInteger(index)) {
      return
    }
    if (index === fromIndex) {
      nextRecord[String(toIndex)] = value
    } else if (index === toIndex) {
      nextRecord[String(fromIndex)] = value
    } else {
      nextRecord[key] = value
    }
  })
  Object.keys(record).forEach((key) => {
    delete record[key]
  })
  Object.assign(record, nextRecord)
}

function emitValue(value: Record<string, any>[]) {
  emit('update:modelValue', value)
  emit('change', value)
}

function isChildDisabled(rule: NormalizedFormCreateRule, itemIndex: number) {
  return isRuleDisabled(!!props.disabled || !!rule.props?.disabled, getItemFieldState(itemIndex, rule), rule)
}

function toggleItem(itemIndex: number) {
  if (!collapseEnabled.value) {
    return
  }
  collapsedRows.value = {
    ...collapsedRows.value,
    [itemIndex]: !isItemCollapsed(itemIndex),
  }
}

function isItemCollapsed(itemIndex: number) {
  if (!collapseEnabled.value) {
    return false
  }
  return collapsedRows.value[itemIndex] ?? defaultCollapsed.value
}

function getItemTitle(itemIndex: number) {
  const title = props.rule.props?.title
  if (typeof title === 'string' && title.trim()) {
    return title.replace('{index}', String(itemIndex + 1))
  }
  return `${props.rule.title || '子表单'} ${itemIndex + 1}`
}

function scheduleProviderFetchEffects() {
  providerFetchVersion += 1
  const version = providerFetchVersion
  if (providerFetchTimer) {
    clearTimeout(providerFetchTimer)
  }
  providerFetchTimer = setTimeout(() => {
    providerFetchTimer = undefined
    void refreshProviderFetchEffects(version)
  }, 300)
}

async function refreshProviderFetchEffects(version: number) {
  const results: Array<{
    results: Awaited<ReturnType<typeof resolveRuleFetchEffects>>
    states: Record<string, FormCreateProviderState>
  }> = []
  for (let itemIndex = 0; itemIndex < rows.value.length; itemIndex += 1) {
    const states = ensureItemProviderStates(itemIndex)
    const context = getItemProviderContext(itemIndex)
    const controlResult = getItemControlResult(itemIndex)
    const itemResults = await resolveRuleFetchEffects(controlResult.rules, context)
    results.push({ results: itemResults, states })
  }
  if (version !== providerFetchVersion) {
    return
  }
  results.forEach(({ results: itemResults, states }) => {
    itemResults.forEach((result) => {
      if (!states[result.fieldId]) {
        states[result.fieldId] = {}
      }
      states[result.fieldId].fetchLoaded = true
      states[result.fieldId].fetchPatch = result.patch
    })
  })
}

onBeforeUnmount(() => {
  providerFetchVersion += 1
  if (providerFetchTimer) {
    clearTimeout(providerFetchTimer)
    providerFetchTimer = undefined
  }
})
</script>

<style lang="scss" scoped>
.fc-sub-form {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 100%;
}

.fc-sub-form__item {
  overflow: hidden;
  background: #f8f9fb;
  border: 1rpx solid #eceff3;
  border-radius: 12rpx;
}

.fc-sub-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 80rpx;
  padding: 0 20rpx;
  background: #fff;
  border-bottom: 1rpx solid #eceff3;
}

.fc-sub-form__header-main {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 12rpx;
  min-width: 0;
}

.fc-sub-form__title {
  overflow: hidden;
  color: #1f2329;
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fc-sub-form__collapse {
  color: #3b7cff;
  flex-shrink: 0;
  font-size: 24rpx;
}

.fc-sub-form__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8rpx;
}

.fc-sub-form__body {
  overflow: hidden;
}

.fc-sub-form__layout-title {
  color: #1f2329;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
  padding: 24rpx 24rpx 8rpx;
}

.fc-sub-form__layout-gap {
  background: transparent;
}

.fc-sub-form__text {
  color: #333;
  font-size: 28rpx;
  line-height: 1.6;
  word-break: break-all;
}

.fc-sub-form__unsupported,
.fc-sub-form__empty {
  color: #999;
  font-size: 26rpx;
  padding: 24rpx;
  text-align: center;
}
</style>
