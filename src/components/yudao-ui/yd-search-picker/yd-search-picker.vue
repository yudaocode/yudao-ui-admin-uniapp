<template>
  <!-- 搜索筛选选择项：灰底入口 + wd-picker 弹层，对标表单侧的 yd-form-picker -->
  <view class="yd-search-form-item">
    <view class="yd-search-form-label">
      {{ label }}
    </view>
    <view class="flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx" @click="visible = true">
      <text class="text-28rpx" :class="isPlaceholder ? 'text-[#999]' : 'text-[#333]'">
        {{ displayText }}
      </text>
      <wd-icon name="arrow-right" size="32rpx" color="#666" />
    </view>
    <wd-picker
      v-model:visible="visible"
      :model-value="pickerModelValue"
      :columns="resolvedColumns"
      :label-key="labelKey"
      :value-key="valueKey"
      :root-portal="rootPortal"
      @confirm="handleConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { getWotPickerDisplay } from '@/utils/wot'

const props = withDefaults(defineProps<{
  modelValue?: boolean | number | string // 当前选中值
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
  rootPortal?: boolean // 是否脱离当前层级，避免嵌套弹层 fixed 失效
}>(), {
  label: '',
  dictKind: 'int',
  allOption: false,
  allValue: -1,
  allLabel: '全部',
  placeholder: '请选择',
  labelKey: 'label',
  valueKey: 'value',
  rootPortal: true,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: any): void }>()

const visible = ref(false) // 选择弹层显示状态
const pickerModelValue = computed(() => // Wot picker 使用数组值，业务层保持标量
  props.modelValue == null || props.modelValue === '' ? [] : [props.modelValue],
)

const resolvedColumns = computed(() => { // 选项：优先 columns，其次按字典生成；allOption 时前插「全部」
  const base = props.columns
    ?? (props.dictType ? (props.dictKind === 'str' ? getStrDictOptions(props.dictType) : getIntDictOptions(props.dictType)) : [])
  return props.allOption ? [{ [props.labelKey]: props.allLabel, [props.valueKey]: props.allValue }, ...base] : base
})

const isPlaceholder = computed(() => // 未选择或选中「全部」(allValue) 时走占位灰字
  props.modelValue == null || props.modelValue === '' || props.modelValue === props.allValue,
)

const displayText = computed(() => // 当前选中项展示文案；未选择时 allOption 显示「全部」，否则 placeholder
  getWotPickerDisplay(resolvedColumns.value, props.modelValue as any, { labelKey: props.labelKey, valueKey: props.valueKey, placeholder: props.allOption ? props.allLabel : props.placeholder }),
)

/** 选择确认 */
function handleConfirm({ value }: { value: any }) {
  emit('update:modelValue', Array.isArray(value) ? value[0] : value)
}
</script>
