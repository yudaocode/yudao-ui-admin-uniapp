<template>
  <yd-form-picker
    ref="pickerRef"
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :disabled="disabled"
    :columns="options"
    label-key="name"
    value-key="code"
    :placeholder="placeholder"
    :before-open="ensureOptions"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { MailTemplate } from '@/api/system/mail/template'
import type { YdFormPickerExpose } from '@/components/yudao-ui'
import { onMounted, ref } from 'vue'
import { getSimpleMailTemplateList } from '@/api/system/mail/template'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '邮件模板',
  labelWidth: '220rpx',
  placeholder: '请选择邮件模板',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const pickerRef = ref<YdFormPickerExpose>() // 通用表单选择器
const options = ref<MailTemplate[]>([]) // 邮件模板选项

/** 加载邮件模板选项 */
async function loadOptions() {
  try {
    options.value = await getSimpleMailTemplateList()
  } catch {
    options.value = []
  }
}

/** 打开前确保模板选项 */
function ensureOptions() {
  if (options.value.length === 0) {
    loadOptions()
  }
}

/** 更新模板编码 */
function handleUpdate(value?: string) {
  emit('update:modelValue', value)
}

/** 格式化模板编码 */
function format(value?: string) {
  return pickerRef.value?.format(value) || (value || '')
}

defineExpose({ format })

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
