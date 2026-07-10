<template>
  <yd-search-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :columns="options"
    label-key="mail"
    value-key="id"
    :placeholder="placeholder"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { YdSearchPickerExpose } from '@/components/yudao-ui'
import type { MailAccount } from '@/api/system/mail/account'
import { onMounted, ref } from 'vue'
import { getSimpleMailAccountList } from '@/api/system/mail/account'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  placeholder?: string
}>(), {
  label: '邮箱账号',
  placeholder: '请选择邮箱账号',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: MailAccount | undefined]
}>()

const pickerRef = ref<YdSearchPickerExpose>() // 通用搜索选择器
const options = ref<MailAccount[]>([]) // 邮箱账号选项

/** 更新邮箱账号 */
function handleUpdate(value?: number) {
  emit('update:modelValue', value)
  emit('change', options.value.find(item => item.id === value))
}

/** 格式化邮箱账号 */
function format(value?: number) {
  return pickerRef.value?.format(value) || (value == null ? '' : String(value))
}

defineExpose({ format })

/** 初始化 */
onMounted(async () => {
  options.value = await getSimpleMailAccountList()
})
</script>
