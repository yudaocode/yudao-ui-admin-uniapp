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

  <ClientPicker ref="pickerRef" :title="title" :multiple="false" @confirm="handleConfirm" />
</template>

<script lang="ts" setup>
import type { MdClient } from '@/api/mes/md/client'
import { computed, ref, watch } from 'vue'
import { getClient } from '@/api/mes/md/client'
import ClientPicker from './client-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  title?: string
}>(), {
  label: '客户',
  labelWidth: '220rpx',
  placeholder: '请选择客户',
  prop: '',
  disabled: false,
  title: '选择客户',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MdClient | undefined]
}>()

const pickerRef = ref<InstanceType<typeof ClientPicker>>() // 客户选择器
const selectedClient = ref<MdClient>() // 当前客户
const displayValue = computed(() => {
  if (selectedClient.value) {
    return `${selectedClient.value.code || '-'} / ${selectedClient.value.name || '-'}`
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

/** 选择客户 */
function handleConfirm(items: MdClient[]) {
  const item = items[0]
  if (!item || item.id == null) {
    return
  }
  selectedClient.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 加载客户回显 */
async function resolveClient(id?: number) {
  if (id == null) {
    selectedClient.value = undefined
    return
  }
  if (selectedClient.value?.id === id) {
    return
  }
  try {
    selectedClient.value = await getClient(id)
  } catch {
    selectedClient.value = undefined
  }
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  value => resolveClient(value),
  { immediate: true },
)
</script>
