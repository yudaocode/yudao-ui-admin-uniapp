<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="name"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { ApiKey } from '@/api/ai/model/apiKey'
import { onMounted, ref } from 'vue'
import { getApiKeySimpleList } from '@/api/ai/model/apiKey'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: 'API 密钥',
  labelWidth: '200rpx',
  placeholder: '请选择 API 密钥',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ApiKey | undefined]
}>()

const options = ref<ApiKey[]>([]) // API 密钥选项

/** 加载 API 密钥选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getApiKeySimpleList()
}

/** 更新 API 密钥 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择 API 密钥 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空 API 密钥 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
