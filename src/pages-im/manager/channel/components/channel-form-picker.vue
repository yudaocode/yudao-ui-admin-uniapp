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
    :before-open="ensureOptions"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import { onMounted, ref } from 'vue'
import { getSimpleChannelList } from '@/api/im/manager/channel'

withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '所属频道',
  labelWidth: '180rpx',
  placeholder: '请选择频道',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ImManagerChannelVO | undefined]
}>()

const options = ref<ImManagerChannelVO[]>([]) // 频道选项

/** 加载频道选项 */
async function loadOptions() {
  try {
    options.value = await getSimpleChannelList()
  } catch {
    options.value = []
  }
}

/** 打开前确保频道选项 */
function ensureOptions() {
  if (options.value.length === 0) {
    loadOptions()
  }
}

/** 更新频道 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择频道 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空频道 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化频道选项 */
onMounted(() => {
  loadOptions()
})
</script>
