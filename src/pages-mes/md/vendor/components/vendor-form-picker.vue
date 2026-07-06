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

  <VendorPicker ref="pickerRef" :title="title" :multiple="false" @confirm="handleConfirm" />
</template>

<script lang="ts" setup>
import type { MdVendor } from '@/api/mes/md/vendor'
import { computed, ref, watch } from 'vue'
import { getVendor } from '@/api/mes/md/vendor'
import VendorPicker from './vendor-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  title?: string
}>(), {
  label: '供应商',
  labelWidth: '220rpx',
  placeholder: '请选择供应商',
  prop: '',
  disabled: false,
  title: '选择供应商',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MdVendor | undefined]
}>()

const pickerRef = ref<InstanceType<typeof VendorPicker>>() // 供应商选择器
const selectedVendor = ref<MdVendor>() // 当前供应商
const displayValue = computed(() => {
  if (selectedVendor.value) {
    return `${selectedVendor.value.code || '-'} / ${selectedVendor.value.name || '-'}`
  }
  return props.modelValue ? String(props.modelValue) : ''
})

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open()
}

/** 选择供应商 */
function handleConfirm(items: MdVendor[]) {
  const item = items[0]
  if (!item || item.id == null) {
    return
  }
  selectedVendor.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 加载供应商回显 */
async function resolveVendor(id?: number) {
  if (id == null) {
    selectedVendor.value = undefined
    return
  }
  if (selectedVendor.value?.id === id) {
    return
  }
  try {
    selectedVendor.value = await getVendor(id)
  } catch {
    selectedVendor.value = undefined
  }
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  value => resolveVendor(value),
  { immediate: true },
)
</script>
