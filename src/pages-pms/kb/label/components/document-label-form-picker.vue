<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :columns="columns"
    :placeholder="placeholder"
    :disabled="disabled"
    type="checkbox"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { KnowledgeDocumentLabel } from '@/api/pms/kb/content/document/label'
import { getKnowledgeDocumentLabelList } from '@/api/pms/kb/content/document/label'

withDefaults(defineProps<{
  modelValue?: number[]
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '标签',
  labelWidth: '220rpx',
  placeholder: '请选择标签',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const labels = ref<KnowledgeDocumentLabel[]>([]) // 标签选项来源

const columns = computed(() => labels.value.map(item => ({ label: item.name, value: item.id }))) // 标签选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value ?? [])
}

/** 初始化 */
onMounted(async () => {
  labels.value = await getKnowledgeDocumentLabelList()
})
</script>
