<template>
  <view class="fc-user-select">
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
      :visible="visible"
      :title="rule.title || '选择用户'"
      :columns="options"
      :type="isMultiple ? 'checkbox' : 'radio'"
      :show-confirm="isMultiple"
      :loading="loading"
      :filter-placeholder="rule.props?.filterPlaceholder || '搜索用户'"
      custom-content-class="fc-custom-select__content"
      filterable
      label-key="label"
      value-key="value"
      @update:visible="handleVisibleChange"
      @cancel="emit('cancel')"
      @confirm="handleConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { NormalizedFormCreateRule } from '../../../../../types/typing'
import { computed, nextTick, ref, watch } from 'vue'
import { useWotSelectPicker } from '@/hooks/useWotSelectPicker'
import { getPlaceholder } from '../../core/utils'
import { loadUserOptions } from './api'
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
const options = ref<any[]>([])
const pickerValue = ref<any>([])
const { pickerRef, visible, openPicker, handleVisibleChange } = useWotSelectPicker()

const isMultiple = computed(() => isMultipleSelect(props.rule))
const placeholder = computed(() => getPlaceholder(props.rule, '请选择'))
const displayValue = computed(() =>
  formatSelectedSummary(props.modelValue, options.value, isMultiple.value, '人'),
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

watch(visible, (value) => {
  if (value) {
    emit('open')
  } else {
    emit('close')
  }
})

async function open() {
  if (props.disabled) {
    return
  }
  if (loadError.value && !loading.value) {
    await loadOptions()
  }
  if (loadError.value && options.value.length === 0) {
    return
  }
  pickerValue.value = normalizeSelectValue(props.modelValue, isMultiple.value)
  await nextTick()
  openPicker()
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
  loading.value = true
  loadError.value = ''
  try {
    options.value = await loadUserOptions()
  } catch (error) {
    console.error('加载用户选项失败:', error)
    options.value = []
    loadError.value = '用户选项加载失败，请稍后重试'
    showLoadError(loadError.value)
  } finally {
    loading.value = false
  }
}

function showLoadError(message: string) {
  uni.showToast({
    icon: 'none',
    title: message,
  })
}
</script>

<style lang="scss">
@use './style.scss';
</style>
