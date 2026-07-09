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

  <UnitMeasurePicker ref="pickerRef" @confirm="handleConfirm" />
</template>

<script lang="ts" setup>
import type { MdUnitMeasure } from '@/api/mes/md/unitmeasure'
import { computed, ref, watch } from 'vue'
import { getUnitMeasure } from '@/api/mes/md/unitmeasure'
import UnitMeasurePicker from './unit-measure-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '计量单位',
  labelWidth: '220rpx',
  placeholder: '请选择计量单位',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MdUnitMeasure | undefined]
}>()

const pickerRef = ref<InstanceType<typeof UnitMeasurePicker>>() // 计量单位选择器
const selectedItem = ref<MdUnitMeasure>() // 当前计量单位
const displayValue = computed(() => {
  if (selectedItem.value) {
    return selectedItem.value.code ? `${selectedItem.value.name} (${selectedItem.value.code})` : selectedItem.value.name
  }
  return props.modelValue ? String(props.modelValue) : ''
})

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open(props.modelValue ?? undefined)
}

/** 确认计量单位 */
function handleConfirm(item: MdUnitMeasure) {
  selectedItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 加载计量单位回显 */
async function resolveItem(id?: number | null) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getUnitMeasure(id)
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
