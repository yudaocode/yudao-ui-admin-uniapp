<template>
  <yd-form-picker
    :model-value="modelValue ?? undefined"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="pickerOptions"
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
import type { Contact } from '@/api/crm/contact'
import { computed, onMounted, ref } from 'vue'
import { getSimpleContactList } from '@/api/crm/contact'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  customerId?: number | null
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
  optionFilter?: (item: Contact) => boolean
}>(), {
  label: '联系人',
  labelWidth: '200rpx',
  placeholder: '请选择联系人',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Contact | undefined]
}>()

const options = ref<Contact[]>([]) // 联系人选项
const pickerOptions = computed(() => { // 当前客户下的可选联系人
  return options.value.filter((item) => {
    if (props.customerId && item.customerId !== props.customerId) {
      return false
    }
    return !props.optionFilter || props.optionFilter(item)
  })
})

/** 加载联系人选项 */
async function loadOptions() {
  options.value = (await getSimpleContactList()).filter(item => item.id != null)
}

/** 更新联系人编号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择联系人 */
function handleConfirm(value?: number) {
  emit('change', pickerOptions.value.find(item => item.id === value))
}

/** 清空联系人 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
