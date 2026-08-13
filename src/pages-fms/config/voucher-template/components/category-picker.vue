<template>
  <yd-form-picker
    v-model="selectedValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :columns="categoryOptions"
    :placeholder="placeholder"
    :disabled="disabled"
  />
</template>

<script lang="ts" setup>
import type { VoucherTemplateCategory } from '@/api/fms/config/voucher-template-category'

const props = withDefaults(defineProps<{
  categories: VoucherTemplateCategory[]
  modelValue?: number
  disabled?: boolean
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
}>(), {
  disabled: false,
  label: '模板分类',
  labelWidth: '180rpx',
  placeholder: '请选择模板分类',
  prop: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const categoryOptions = computed(() =>
  props.categories.map(item => ({ label: item.name, value: item.id! })),
)
const selectedValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => emit('update:modelValue', value),
})
</script>
