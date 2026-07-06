<template>
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :is-link="!disabled"
    :value="displayValue"
    :placeholder="placeholder"
    @click="handleOpen"
  />

  <ProcessPicker
    ref="pickerRef"
    :model-value="modelValue"
    :disabled="disabled"
    :clearable="clearable"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import type { ProProcess } from '@/api/mes/pro/process'
import { computed, ref, watch } from 'vue'
import { getProcess } from '@/api/mes/pro/process'
import ProcessPicker from './process-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '工序',
  labelWidth: '220rpx',
  placeholder: '请选择工序',
  prop: '',
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProProcess | undefined]
}>()

const pickerRef = ref<InstanceType<typeof ProcessPicker>>() // 工序选择器
const selectedItem = ref<ProProcess>() // 当前工序
const displayValue = computed(() => {
  if (selectedItem.value) {
    return `${selectedItem.value.code || '-'} / ${selectedItem.value.name || '-'}`
  }
  return props.modelValue ? `工序 #${props.modelValue}` : ''
})

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open(props.modelValue)
}

/** 更新工序编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择工序 */
function handleChange(item?: ProProcess) {
  selectedItem.value = item
  emit('change', item)
}

/** 加载工序回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getProcess(id)
  } catch {
    selectedItem.value = undefined
  }
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  value => resolveItem(value),
  { immediate: true },
)
</script>
