<template>
  <view class="fc-api-select">
    <wd-form-item
      :title="rule.title"
      :title-width="titleWidth"
      :prop="rule.field"
      :value="displayValue"
      :placeholder="placeholder"
      :is-link="!disabled"
      @click="open"
    />

    <wd-select-picker
      ref="pickerRef"
      v-model="pickerValue"
      :title="rule.title || '选择选项'"
      :columns="options"
      :type="isMultiple ? 'checkbox' : 'radio'"
      :show-confirm="isMultiple"
      :loading="loading"
      :filter-placeholder="rule.props?.filterPlaceholder || '搜索选项'"
      custom-content-class="fc-custom-select__content"
      filterable
      label-key="label"
      value-key="value"
      @open="emit('open')"
      @close="emit('close')"
      @cancel="emit('cancel')"
      @confirm="handleConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { NormalizedFormCreateRule } from '../../../../../types/typing'
import { computed, nextTick, ref, watch } from 'vue'
import { getPlaceholder } from '../../core/utils'
import { loadApiSelectOptions } from './api'
import { formatSelectedSummary, isMultipleSelect, normalizeSelectValue } from './utils'

const props = defineProps<{
  disabled?: boolean
  modelValue?: any
  rule: NormalizedFormCreateRule
  titleWidth?: string | number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'cancel': []
  'change': [value: any]
  'close': []
  'confirm': [value: any]
  'open': []
}>()

const loading = ref(false)
const loadError = ref('')
const emptyMessage = ref('')
const options = ref<any[]>([])
const loaded = ref(false)
const pickerValue = ref<any>([])
const pickerRef = ref<SelectPickerInstance>() // API 选择器

const isMultiple = computed(() => isMultipleSelect(props.rule))
const placeholder = computed(() => getPlaceholder(props.rule, '请选择'))
const displayValue = computed(() =>
  formatSelectedSummary(props.modelValue, options.value, isMultiple.value, '项'),
)

watch(
  () => [props.modelValue, isMultiple.value],
  () => {
    pickerValue.value = normalizeSelectValue(props.modelValue, isMultiple.value)
  },
  { deep: true, immediate: true },
)

watch(
  () => props.rule.props,
  () => loadOptions(),
  { deep: true, immediate: true },
)

async function open() {
  if (props.disabled) {
    return
  }
  if ((loadError.value || !loaded.value) && !loading.value) {
    await loadOptions()
  }
  if (loadError.value && !loading.value) {
    showLoadError(loadError.value)
    return
  }
  if (options.value.length === 0) {
    showLoadError(emptyMessage.value || '暂无可选项')
    return
  }
  pickerValue.value = normalizeSelectValue(props.modelValue, isMultiple.value)
  await nextTick()
  pickerRef.value?.open()
}

function handleConfirm({ value }: { value: any }) {
  const nextValue = isMultiple.value
    ? Array.isArray(value) ? value : []
    : value === '' ? undefined : value
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
  emit('confirm', nextValue)
}

async function loadOptions() {
  const url = props.rule.props?.url
  if (!url) {
    options.value = []
    loadError.value = '未配置接口地址'
    emptyMessage.value = ''
    loaded.value = true
    return
  }

  loading.value = true
  loadError.value = ''
  emptyMessage.value = ''
  loaded.value = false
  try {
    options.value = await loadApiSelectOptions(props.rule)
    if (options.value.length === 0) {
      emptyMessage.value = '暂无可选项'
    }
    loaded.value = true
  } catch (error) {
    console.error('加载接口选项失败:', error)
    options.value = []
    emptyMessage.value = ''
    loadError.value = '接口选项加载失败，请稍后重试'
    showLoadError(loadError.value)
  } finally {
    loading.value = false
  }
}

function showLoadError(message: string) {
  uni.showToast({
    icon: 'none',
    title: `无法选择，原因：${message}`,
  })
}
</script>

<style lang="scss">
@use './style.scss';
</style>
