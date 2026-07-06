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

  <ItemPicker
    ref="pickerRef"
    :item-or-product="itemOrProduct"
    :title="title"
    :multiple="false"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { MdItem } from '@/api/mes/md/item'
import { computed, ref, watch } from 'vue'
import { getItem } from '@/api/mes/md/item'
import ItemPicker from './item-picker.vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  itemOrProduct?: string
  title?: string
}>(), {
  label: '产品',
  labelWidth: '220rpx',
  placeholder: '请选择产品',
  prop: '',
  disabled: false,
  itemOrProduct: undefined,
  title: '选择产品',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MdItem | undefined]
}>()

const pickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器
const selectedItem = ref<MdItem>() // 当前物料
const displayValue = computed(() => {
  if (selectedItem.value) {
    return `${selectedItem.value.code || '-'} / ${selectedItem.value.name || '-'}`
  }
  return props.modelValue ? `产品 #${props.modelValue}` : ''
})

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  pickerRef.value?.open()
}

/** 选择物料 */
function handleConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item || item.id == null) {
    return
  }
  selectedItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 加载物料回显 */
async function resolveItem(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getItem(id)
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
