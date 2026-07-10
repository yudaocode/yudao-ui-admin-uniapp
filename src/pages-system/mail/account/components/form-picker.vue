<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :clearable="clearable"
    :columns="options"
    label-key="mail"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import type { MailAccount } from '@/api/system/mail/account'
import { onMounted, ref } from 'vue'
import { getSimpleMailAccountList } from '@/api/system/mail/account'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  label: '邮箱账号',
  labelWidth: '200rpx',
  placeholder: '请选择邮箱账号',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MailAccount | undefined]
}>()

const options = ref<MailAccount[]>([]) // 邮箱账号选项

/** 加载邮箱账号选项 */
async function loadOptions() {
  if (options.value.length > 0) {
    return
  }
  options.value = await getSimpleMailAccountList()
}

/** 更新邮箱账号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
}

/** 选择邮箱账号 */
function handleConfirm(value?: number) {
  emit('change', options.value.find(item => item.id === value))
}

/** 清空邮箱账号 */
function handleClear() {
  emit('change', undefined)
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
