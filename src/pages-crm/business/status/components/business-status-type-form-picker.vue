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
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { BusinessStatusType } from '@/api/crm/business/status'
import { onMounted, ref } from 'vue'
import { getBusinessStatusTypeSimpleList } from '@/api/crm/business/status'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '商机状态组',
  labelWidth: '200rpx',
  placeholder: '请选择商机状态组',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: BusinessStatusType | undefined]
}>()

const options = ref<BusinessStatusType[]>([]) // 商机状态组选项

/** 加载商机状态组选项 */
async function loadOptions() {
  options.value = (await getBusinessStatusTypeSimpleList()).filter(item => item.id != null)
}

/** 获取首个商机状态组编号 */
async function getFirstId() {
  if (options.value.length === 0) {
    await loadOptions()
  }
  return options.value[0]?.id
}

/** 更新商机状态组编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择商机状态组 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空商机状态组 */
function handleClear() {
  emit('change', undefined)
}

defineExpose({ getFirstId })

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
