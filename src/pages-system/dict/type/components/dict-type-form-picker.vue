<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :columns="options"
    label-key="name"
    value-key="type"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { DictType } from '@/api/system/dict/type'
import { onMounted, ref } from 'vue'
import { getSimpleDictTypeList } from '@/api/system/dict/type'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '字典类型',
  labelWidth: '200rpx',
  placeholder: '请选择字典类型',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [item: DictType | undefined]
}>()

const options = ref<DictType[]>([]) // 字典类型选项

/** 加载字典类型选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getSimpleDictTypeList()
}

/** 更新字典类型 */
function handleUpdate(value?: string) {
  emit('update:modelValue', value)
}

/** 选择字典类型 */
function handleConfirm(value?: string) {
  emit('change', options.value.find(item => item.type === value))
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
