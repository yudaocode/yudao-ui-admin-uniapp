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
      :type="type"
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
import { getWotPickerFormValue, hasWotPickerBooleanValue } from '@/utils/wot'

const props = withDefaults(defineProps<{
  modelValue?: string | number | boolean | Array<string | number | boolean> // String 放在 Boolean 前，避免空字符串转为 true
  label?: string // 字段标题
  dictType?: string // 字典类型；与 columns 二选一
  dictKind?: 'int' | 'str' // 字典值类型，默认 int
  columns?: any[] // 自定义选项；优先于 dictType
  allOption?: boolean // 是否在最前插入「全部」项（字典筛选用）
  allValue?: number | string // 「全部」对应值，默认 -1
  allLabel?: string // 「全部」文案，默认「全部」
  placeholder?: string // 未选择时占位（无 allOption 的自定义选项用，如「请选择邮箱账号」）
  labelKey?: string // 选项展示字段名，默认 label
  valueKey?: string // 选项值字段名，默认 value
  type?: 'radio' | 'checkbox' // 选择类型；checkbox 使用多选弹层
  filterable?: boolean // 是否支持搜索
  beforeOpen?: () => boolean | void // 打开前校验
  rootPortal?: boolean // 是否脱离当前层级，避免嵌套弹层 fixed 失效
}>(), {
  modelValue: undefined,
  label: '',
  dictKind: 'int',
  allOption: false,
  allValue: -1,
  allLabel: '全部',
  placeholder: '请选择',
  labelKey: 'label',
  valueKey: 'value',
  type: 'radio',
  filterable: false,
  rootPortal: true,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: any): void }>()

const pickerRef = ref<PickerInstance>() // 普通单选选择器
const selectPickerRef = ref<SelectPickerInstance>() // 可搜索/多选选择器
const pickerModelValue = computed(() => // Wot picker 使用数组值，业务层保持标量
  props.modelValue == null || props.modelValue === '' || Array.isArray(props.modelValue) ? [] : [props.modelValue],
)
const selectPickerModelValue = computed(() => { // Wot select-picker 按单/多选传值
  if (props.type === 'checkbox') {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }
  const value = Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue
  return value == null || value === '' ? (props.allOption ? props.allValue : '') : value
})
const resolvedColumns = computed(() => { // 选项：优先 columns，其次按字典生成；allOption 时前插「全部」
  const base = props.columns
    ?? (props.dictType ? (props.dictKind === 'str' ? getStrDictOptions(props.dictType) : getIntDictOptions(props.dictType)) : [])
  return props.allOption ? [{ [props.labelKey]: props.allLabel, [props.valueKey]: props.allValue }, ...base] : base
})
const useSelectPicker = computed(() => // 多选、可搜索或 boolean 单选使用 select-picker
  props.type === 'checkbox' || props.filterable || hasWotPickerBooleanValue(resolvedColumns.value, props.valueKey),
)

const isPlaceholder = computed(() => // 未选择或选中「全部」(allValue) 时走占位灰字
  props.modelValue == null
  || props.modelValue === ''
  || (Array.isArray(props.modelValue) && props.modelValue.length === 0)
  || isAllOptionValue(props.modelValue),
)

const displayText = computed(() => // 当前选中项展示文案；未选择时 allOption 显示「全部」，否则 placeholder
  isPlaceholder.value
    ? (props.allOption ? props.allLabel : props.placeholder)
    : getWotPickerFormValue(resolvedColumns.value, props.modelValue as any, {
        labelKey: props.labelKey,
        placeholder: props.placeholder,
        valueKey: props.valueKey,
      }),
)

/** 判断是否为全部选项 */
function isAllOptionValue(value?: null | WotPickerValue | WotPickerValue[]) {
  return props.allOption
    && !Array.isArray(value)
    && value != null
    && String(value) === String(props.allValue)
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
function handleConfirm({ value }: { value: any }) {
  const next = Array.isArray(value) ? value[0] : value
  emit('update:modelValue', next === '' ? (props.allOption ? props.allValue : undefined) : next)
}

/** 多选确认 */
function handleSelectConfirm({ value }: { value: any }) {
  const next = props.type === 'checkbox'
    ? (Array.isArray(value) ? value : [])
    : (Array.isArray(value) ? value[0] : value)
  emit('update:modelValue', props.type === 'radio' && next === ''
    ? (props.allOption ? props.allValue : undefined)
    : next)
}

/** 格式化选中值 */
function format(value?: null | WotPickerValue | WotPickerValue[]) {
  const currentValue = arguments.length > 0 ? value : props.modelValue
  if (
    currentValue == null
    || currentValue === ''
    || (Array.isArray(currentValue) && currentValue.length === 0)
    || isAllOptionValue(currentValue)
  ) {
    return ''
  }
  return getWotPickerFormValue(resolvedColumns.value, currentValue, {
    labelKey: props.labelKey,
    placeholder: '',
    valueKey: props.valueKey,
  })
}

defineExpose<YdSearchPickerExpose>({ format })
</script>
