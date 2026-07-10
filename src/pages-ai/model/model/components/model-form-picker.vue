<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="pickerOptions"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { ModelVO } from '@/api/ai/model/model'
import { computed, ref, watch } from 'vue'
import { getModelSimpleList } from '@/api/ai/model/model'

const props = withDefaults(defineProps<{
  modelValue?: number
  modelType?: number
  options?: ModelVO[]
  excludePlatforms?: string[]
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '模型',
  labelWidth: '220rpx',
  placeholder: '请选择模型',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ModelVO | undefined]
}>()

const loadedOptions = ref<ModelVO[]>([]) // 加载的模型选项
const pickerOptions = computed(() => { // 过滤后的模型选项
  const options = props.options ?? loadedOptions.value
  if (!props.excludePlatforms?.length) {
    return options
  }
  return options.filter(item => !props.excludePlatforms?.includes(item.platform || ''))
})

/** 加载模型选项 */
async function loadOptions() {
  if (props.options) {
    return
  }
  loadedOptions.value = await getModelSimpleList(props.modelType)
}

/** 更新模型 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择模型 */
function handleConfirm(value?: number) {
  emit('change', pickerOptions.value.find(item => item.id === value))
}

/** 清空模型 */
function handleClear() {
  emit('change', undefined)
}

watch(() => props.modelType, loadOptions, { immediate: true })
</script>
