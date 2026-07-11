<template>
  <!-- 搜索筛选选择项：灰底入口 + wd-picker 弹层，对标表单侧的 yd-form-picker -->
  <view class="yd-search-form-item">
    <view class="yd-search-form-label">
      {{ label }}
    </view>
    <view class="flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx" @click="handleOpen">
      <text class="text-28rpx" :class="isPlaceholder ? 'text-[#999]' : 'text-[#333]'">
        {{ displayText }}
      </text>
      <wd-icon name="arrow-right" size="32rpx" color="#666" />
    </view>
    <wd-picker
      v-if="!useSelectPicker"
      ref="pickerRef"
      :model-value="pickerModelValue"
      :columns="resolvedColumns"
      :label-key="labelKey"
      :value-key="valueKey"
      :root-portal="rootPortal"
      @confirm="handleConfirm"
    />
    <wd-select-picker
      v-else
      ref="selectPickerRef"
      :model-value="selectPickerModelValue"
      :title="label || placeholder"
      :columns="resolvedColumns"
      :label-key="labelKey"
      :value-key="valueKey"
      :type="selectionType"
      :filterable="filterable"
      :root-portal="rootPortal"
      :scroll-into-view="!rootPortal"
      @confirm="handleSelectConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from './types'
import type { PickerInstance } from '@wot-ui/ui/components/wd-picker/types'
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { WotPickerValue } from '@/utils/wot'
import { computed, ref } from 'vue'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { hasWotPickerBooleanValue } from '@/utils/wot'

type SearchPickerColumn = WotPickerValue | Record<string, any>

interface SearchPickerCommonProps {
  label?: string // 字段标题
  dictType?: string // 字典类型；与 columns 二选一
  dictKind?: 'int' | 'str' // 字典值类型，默认 int
  columns?: SearchPickerColumn[] // 自定义单列选项；优先于 dictType
  allOption?: boolean // 是否在最前插入「全部」项（字典筛选用，仅 radio 生效）
  allLabel?: string // 「全部」文案，默认「全部」
  placeholder?: string // 未选择时占位（无 allOption 的自定义选项用，如「请选择邮箱账号」）
  labelKey?: string // 选项展示字段名，默认 label
  valueKey?: string // 选项值字段名，默认 value
  filterable?: boolean // 是否支持搜索
  beforeOpen?: () => boolean | void // 打开前校验
  rootPortal?: boolean // 是否脱离当前层级，避免嵌套弹层 fixed 失效
}

type SearchPickerProps = SearchPickerCommonProps & (
  | { type?: 'radio', modelValue?: WotPickerValue }
  | { type: 'checkbox', modelValue?: WotPickerValue[] }
)

const props = withDefaults(defineProps<SearchPickerProps>(), {
  label: '',
  dictKind: 'int',
  allOption: false,
  allLabel: '全部',
  placeholder: '请选择',
  labelKey: 'label',
  valueKey: 'value',
  filterable: false,
  rootPortal: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: WotPickerValue | WotPickerValue[] | undefined]
}>()

const ALL_OPTION_SENTINEL_PREFIX = '__YD_SEARCH_PICKER_ALL_OPTION__' // 控件内部「全部」值前缀
const pickerRef = ref<PickerInstance>() // 普通单选选择器
const selectPickerRef = ref<SelectPickerInstance>() // 可搜索/多选选择器
const selectionType = computed(() => { // 默认单选，并拒绝非法运行时值
  const type = props.type ?? 'radio'
  if (type !== 'radio' && type !== 'checkbox') {
    throw new TypeError('yd-search-picker 的 type 必须是 radio 或 checkbox')
  }
  return type
})
const hasAllOption = computed(() => { // 「全部」仅支持单选
  if (props.allOption && selectionType.value !== 'radio') {
    throw new TypeError('yd-search-picker 的 allOption 仅支持 radio')
  }
  return props.allOption
})
const rawColumns = computed<SearchPickerColumn[]>(() => // 选项：优先 columns，其次按字典生成
  props.columns
  ?? (props.dictType ? (props.dictKind === 'str' ? getStrDictOptions(props.dictType) : getIntDictOptions(props.dictType)) : []),
)
const baseColumns = computed(() => rawColumns.value.map(normalizeColumn)) // 按 Wot 单列规则归一为对象选项
const radioModelValue = computed(() => { // radio 业务值必须是标量
  const value: unknown = props.modelValue
  if (value !== undefined && !isWotPickerValue(value)) {
    throw new TypeError('yd-search-picker 的 radio modelValue 必须是标量')
  }
  return value as WotPickerValue | undefined
})
const checkboxModelValue = computed(() => { // checkbox 业务值必须是数组
  const value: unknown = props.modelValue
  if (value === undefined) {
    return [] as WotPickerValue[]
  }
  if (!Array.isArray(value) || !value.every(isWotPickerValue)) {
    throw new TypeError('yd-search-picker 的 checkbox modelValue 必须是标量数组')
  }
  return value as WotPickerValue[]
})
const allOptionSentinel = computed(() => { // 控件内部「全部」值，避开真实选项和当前业务值
  const values = new Set(baseColumns.value.map(item => String(item[props.valueKey])))
  if (radioModelValue.value !== undefined) {
    values.add(String(radioModelValue.value))
  }
  let sentinel = ALL_OPTION_SENTINEL_PREFIX
  let suffix = 0
  while (values.has(sentinel)) {
    sentinel = `${ALL_OPTION_SENTINEL_PREFIX}_${++suffix}`
  }
  return sentinel
})
const resolvedColumns = computed(() => { // allOption 时前插控件内部「全部」项
  return hasAllOption.value
    ? [{ [props.labelKey]: props.allLabel, [props.valueKey]: allOptionSentinel.value }, ...baseColumns.value]
    : baseColumns.value
})
const useSelectPicker = computed(() => { // 多选、可搜索或 boolean 单选使用 select-picker
  if (selectionType.value === 'checkbox') {
    return true
  }
  return props.filterable
    || typeof radioModelValue.value === 'boolean'
    || hasWotPickerBooleanValue(resolvedColumns.value, props.valueKey)
})
const pickerModelValue = computed(() => { // Wot picker 使用数组值，业务层保持标量
  const value = radioModelValue.value
  if (isAllOptionValue(value)) {
    return [allOptionSentinel.value]
  }
  return value == null ? [] : [value]
})
const selectPickerModelValue = computed(() => { // Wot select-picker 按单/多选传值
  if (selectionType.value === 'checkbox') {
    return checkboxModelValue.value
  }
  const value = radioModelValue.value
  if (isAllOptionValue(value)) {
    return allOptionSentinel.value
  }
  return value == null ? '' : value
})
const currentModelValue = computed(() => // 按选择类型读取业务值
  selectionType.value === 'checkbox' ? checkboxModelValue.value : radioModelValue.value,
)
const isPlaceholder = computed(() => { // 未选择或选中「全部」时走占位灰字
  const value = currentModelValue.value
  return value == null || (Array.isArray(value) && value.length === 0)
})

const displayText = computed(() => // 当前选中项展示文案；未选择时 allOption 显示「全部」，否则 placeholder
  selectionType.value === 'radio' && isAllOptionValue(radioModelValue.value)
    ? props.allLabel
    : getPickerText(currentModelValue.value, props.placeholder),
)

/** 判断是否为 Wot picker 支持的标量值 */
function isWotPickerValue(value: unknown): value is WotPickerValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

/** 按 Wot 单列规则归一选项 */
function normalizeColumn(item: unknown) {
  if (isWotPickerValue(item)) {
    return { [props.labelKey]: String(item), [props.valueKey]: item }
  }
  if (Array.isArray(item)) {
    throw new TypeError('yd-search-picker 仅支持一维 columns')
  }
  if (typeof item !== 'object' || item === null) {
    throw new TypeError('yd-search-picker 选项必须是标量或对象')
  }
  const option = item as Record<string, unknown>
  const hasLabel = Object.prototype.hasOwnProperty.call(option, props.labelKey)
  const hasValue = Object.prototype.hasOwnProperty.call(option, props.valueKey)
  if (!hasLabel && !hasValue) {
    throw new TypeError(`yd-search-picker 选项缺少 ${props.labelKey}/${props.valueKey}`)
  }
  const value = hasValue ? option[props.valueKey] : option[props.labelKey]
  if (!isWotPickerValue(value)) {
    throw new TypeError(`yd-search-picker 选项 ${props.valueKey} 必须是标量`)
  }
  const label = hasLabel ? option[props.labelKey] : value
  return {
    ...option,
    [props.labelKey]: label == null ? String(value) : String(label),
    [props.valueKey]: value,
  }
}

/** 判断是否为全部选项 */
function isAllOptionValue(value?: WotPickerValue) {
  return hasAllOption.value && value === undefined
}

/** 将控件值转换为业务值 */
function resolveBusinessValue(value?: WotPickerValue) {
  if (hasAllOption.value && value === allOptionSentinel.value) {
    return undefined
  }
  return value
}

/** 获取当前业务值的展示文案 */
function getPickerText(value: WotPickerValue | WotPickerValue[] | null | undefined, placeholder: string) {
  if (value == null) {
    return placeholder
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return placeholder
    }
    return value.map(item => getPickerOptionText(item, '')).filter(Boolean).join('、') || placeholder
  }
  return getPickerOptionText(value, placeholder)
}

/** 获取单个选项的展示文案 */
function getPickerOptionText(value: WotPickerValue, fallback: string) {
  const selected = resolvedColumns.value.find((item) => {
    const optionValue = item[props.valueKey]
    return useSelectPicker.value
      ? optionValue === value
      : String(optionValue) === String(value)
  })
  if (!selected) {
    return value === '' ? fallback : String(value)
  }
  return String(selected[props.labelKey] ?? selected[props.valueKey] ?? fallback)
}

/** 打开选择弹层 */
function handleOpen() {
  if (props.beforeOpen?.() === false) {
    return
  }
  if (useSelectPicker.value) {
    selectPickerRef.value?.open()
    return
  }
  pickerRef.value?.open()
}

/** 选择确认 */
function handleConfirm({ value }: { value: WotPickerValue | WotPickerValue[] }) {
  const next = Array.isArray(value) ? value[0] : value
  emit('update:modelValue', resolveBusinessValue(next))
}

/** 多选确认 */
function handleSelectConfirm({ value }: { value: WotPickerValue | WotPickerValue[] }) {
  if (selectionType.value === 'checkbox') {
    if (!Array.isArray(value)) {
      throw new TypeError('wd-select-picker 的 checkbox 确认值必须是数组')
    }
    emit('update:modelValue', value)
    return
  }
  if (Array.isArray(value)) {
    throw new TypeError('wd-select-picker 的 radio 确认值必须是标量')
  }
  emit('update:modelValue', resolveBusinessValue(value))
}

/** 格式化选中值 */
function format(value?: null | WotPickerValue | WotPickerValue[]) {
  const currentValue = arguments.length > 0 ? value : props.modelValue
  if (selectionType.value === 'checkbox') {
    if (currentValue == null) {
      return ''
    }
    if (!Array.isArray(currentValue)) {
      throw new TypeError('yd-search-picker 的 checkbox format 值必须是数组')
    }
    return currentValue.length > 0 ? getPickerText(currentValue, '') : ''
  }
  if (Array.isArray(currentValue)) {
    throw new TypeError('yd-search-picker 的 radio format 值必须是标量')
  }
  if (currentValue == null || isAllOptionValue(currentValue)) {
    return ''
  }
  return getPickerText(currentValue, '')
}

defineExpose<YdSearchPickerExpose>({ format })
</script>
