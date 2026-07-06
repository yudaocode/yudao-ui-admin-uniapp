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

  <WorkstationPicker
    ref="pickerRef"
    :model-value="modelValue"
    :disabled="disabled"
    :clearable="clearable"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import type { MdWorkstation } from '@/api/mes/md/workstation'
import { computed, ref, watch } from 'vue'
import { getWorkstation } from '@/api/mes/md/workstation'
import WorkstationPicker from './workstation-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '工作站',
  labelWidth: '220rpx',
  placeholder: '请选择工作站',
  prop: '',
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MdWorkstation | undefined]
}>()

const pickerRef = ref<InstanceType<typeof WorkstationPicker>>() // 工作站选择器
const selectedItem = ref<MdWorkstation>() // 当前工作站
const displayValue = computed(() => {
  if (selectedItem.value) {
    return `${selectedItem.value.code || '-'} / ${selectedItem.value.name || '-'}`
  }
  return props.modelValue ? `工作站 #${props.modelValue}` : ''
})

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open(props.modelValue)
}

/** 更新工作站编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择工作站 */
function handleChange(item?: MdWorkstation) {
  selectedItem.value = item
  emit('change', item)
}

/** 加载工作站回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getWorkstation(id)
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
