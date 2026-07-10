<template>
  <!-- 表单选择字段：wd-form-item 触发 + wd-picker 弹层 -->
  <wd-form-item
    v-if="!clearable"
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :is-link="!disabled"
    :value="displayValue"
    :placeholder="placeholder"
    @click="handleOpen"
  />
  <wd-form-item
    v-else
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    center
  >
    <view class="min-w-0 flex flex-1 items-center justify-end gap-12rpx">
      <view class="min-w-0 flex-1 truncate text-right text-28rpx" :class="displayValue ? 'text-[#333]' : 'text-[#999]'" @click="handleOpen">
        {{ displayValue || placeholder }}
      </view>
      <wd-button v-if="!isEmptyValue(modelValue)" size="small" variant="plain" @click.stop="handleClear">
        清空
      </wd-button>
    </view>
  </wd-form-item>

  <!-- 选择弹层：普通单选使用 wd-picker，可搜索或多选使用 wd-select-picker -->
  <wd-picker
    v-if="!useSelectPicker"
    :visible="visible"
    :model-value="pickerModelValue"
    :columns="resolvedColumns"
    :label-key="labelKey"
    :value-key="valueKey"
    :root-portal="rootPortal"
    @update:visible="handleVisibleChange"
    @confirm="handleConfirm"
  />
  <wd-select-picker
    v-else
    ref="selectPickerRef"
    :visible="visible"
    :model-value="selectPickerModelValue"
    :title="label || placeholder"
    :columns="resolvedColumns"
    :label-key="labelKey"
    :value-key="valueKey"
    :type="type"
    :filterable="filterable"
    :root-portal="rootPortal"
    :scroll-into-view="!rootPortal"
    @update:visible="handleVisibleChange"
    @confirm="handleSelectConfirm"
  />
</template>

<script lang="ts" setup>
import type { YdFormPickerExpose } from './types'
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { WotPickerValue } from '@/utils/wot'
import { computed, ref } from 'vue'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { isEmptyValue } from '@/utils/is'
import { getWotPickerFormValue } from '@/utils/wot'

const props = withDefaults(defineProps<{
  modelValue?: boolean | number | string | Array<boolean | number | string> // 当前选中值
  label?: string // 字段标题
  labelWidth?: string // 标题宽度
  placeholder?: string // 未选择时占位
  prop?: string // wd-form 校验字段名
  disabled?: boolean // 是否禁用
  dictType?: string // 字典类型；与 columns 二选一
  dictKind?: 'int' | 'str' // 字典值类型，默认 int
  columns?: any[] // 自定义选项；优先于 dictType
  labelKey?: string // 选项展示字段名
  valueKey?: string // 选项值字段名
  type?: 'radio' | 'checkbox' // 选择类型；checkbox 使用多选弹层
  filterable?: boolean // 是否支持搜索
  clearable?: boolean // 是否展示清空按钮
  beforeOpen?: () => boolean | void // 打开前校验
  rootPortal?: boolean // 是否脱离当前层级，避免弹层 fixed 失效
}>(), {
  label: '',
  labelWidth: '200rpx',
  placeholder: '请选择',
  prop: '',
  disabled: false,
  dictKind: 'int',
  labelKey: 'label',
  valueKey: 'value',
  type: 'radio',
  filterable: false,
  clearable: false,
  rootPortal: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'confirm', value: any): void
  (e: 'clear'): void
}>()

const visible = ref(false) // 选择弹层显示状态
const selectPickerRef = ref<SelectPickerInstance>() // 可搜索/多选选择器
const pickerModelValue = computed(() => // Wot picker 使用数组值，业务层保持标量
  props.modelValue == null || props.modelValue === '' || Array.isArray(props.modelValue) ? [] : [props.modelValue],
)
const selectPickerModelValue = computed(() => // Wot select-picker 多选使用数组值
  Array.isArray(props.modelValue) ? props.modelValue : [],
)
const resolvedColumns = computed(() => { // 选项：优先 columns，其次按字典类型生成
  if (props.columns) {
    return props.columns
  }
  if (props.dictType) {
    return props.dictKind === 'str' ? getStrDictOptions(props.dictType) : getIntDictOptions(props.dictType)
  }
  return []
})

const displayValue = computed(() => // 选中项展示文案；未选中返回空串以触发 placeholder 样式
  getWotPickerFormValue(resolvedColumns.value, props.modelValue as any, {
    labelKey: props.labelKey,
    placeholder: props.placeholder,
    valueKey: props.valueKey,
  }),
)

/** 同步弹层显示状态 */
function handleVisibleChange(nextVisible: boolean) {
  visible.value = nextVisible
}

/** 打开选择弹层 */
function handleOpen() {
  if (props.disabled || props.beforeOpen?.() === false) {
    return
  }
  if (useSelectPicker.value) {
    selectPickerRef.value?.open()
    return
  }
  visible.value = true
}

/** 清空选择 */
function handleClear() {
  emit('update:modelValue', props.type === 'checkbox' ? [] : undefined)
  emit('clear')
}

/** 选择确认 */
function handleConfirm({ value }: { value: any }) {
  const next = normalizeValue(Array.isArray(value) ? value[0] : value)
  emit('update:modelValue', next)
  emit('confirm', next)
}

/** 多选确认 */
function handleSelectConfirm({ value }: { value: any }) {
  const next = props.type === 'checkbox'
    ? (Array.isArray(value) ? value.map(normalizeValue) : [])
    : normalizeValue(Array.isArray(value) ? value[0] : value)
  emit('update:modelValue', next)
  emit('confirm', next)
}

/** 还原选项原始值类型 */
function normalizeValue(value: any) {
  return value == null || value === ''
    ? value
    : getWotPickerOptionValue(resolvedColumns.value, value, { valueKey: props.valueKey })
}

/** 格式化选中值 */
function format(value?: null | WotPickerValue | WotPickerValue[]) {
  const currentValue = arguments.length > 0 ? value : props.modelValue
  return getWotPickerFormValue(resolvedColumns.value, currentValue, {
    labelKey: props.labelKey,
    placeholder: '',
    valueKey: props.valueKey,
  })
}

defineExpose<YdFormPickerExpose>({ format })
</script>
