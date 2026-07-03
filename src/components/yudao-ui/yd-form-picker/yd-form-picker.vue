<template>
  <!-- 表单选择字段：wd-form-item 触发 + wd-picker 弹层，对标 UserPicker / YdTreeSelect -->
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
      <wd-button v-if="modelValue != null && modelValue !== ''" size="small" variant="plain" @click.stop="handleClear">
        清空
      </wd-button>
    </view>
  </wd-form-item>
  <wd-picker
    v-model:visible="visible"
    :model-value="modelValue"
    :columns="resolvedColumns"
    :label-key="labelKey"
    :value-key="valueKey"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { getWotPickerFormValue } from '@/utils/wot'

const props = withDefaults(defineProps<{
  modelValue?: boolean | number | string // 当前选中值
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
  clearable?: boolean // 是否展示清空按钮
  beforeOpen?: () => boolean | void | Promise<boolean | void> // 打开前校验
}>(), {
  label: '',
  labelWidth: '200rpx',
  placeholder: '请选择',
  prop: '',
  disabled: false,
  dictKind: 'int',
  labelKey: 'label',
  valueKey: 'value',
  clearable: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'confirm', value: any): void
  (e: 'clear'): void
}>()

const visible = ref(false) // 选择弹层显示状态

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

/** 打开选择弹层 */
async function handleOpen() {
  if (props.disabled) {
    return
  }
  const result = await props.beforeOpen?.()
  if (result === false) {
    return
  }
  visible.value = true
}

/** 清空选择 */
function handleClear() {
  emit('update:modelValue', undefined)
  emit('clear')
}

/** 选择确认 */
function handleConfirm({ value }: { value: any }) {
  const next = Array.isArray(value) ? value[0] : value
  emit('update:modelValue', next)
  emit('confirm', next)
}
</script>
