<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
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
import type { TmToolType } from '@/api/mes/tm/tool/type'
import { onMounted, ref } from 'vue'
import { getToolTypeSimpleList } from '@/api/mes/tm/tool/type'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '工具类型',
  labelWidth: '220rpx',
  placeholder: '请选择工具类型',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: TmToolType | undefined]
}>()

const options = ref<TmToolType[]>([]) // 工具类型选项

/** 加载工具类型选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getToolTypeSimpleList() || []
}

/** 更新工具类型编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择工具类型 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空工具类型 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
