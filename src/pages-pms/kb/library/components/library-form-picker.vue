<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :columns="columns"
    :placeholder="placeholder"
    :disabled="disabled"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { KnowledgeLibrary } from '@/api/pms/kb/library'
import { getKnowledgeLibraryPage } from '@/api/pms/kb/library'
import { getAllPageItems } from '@/utils/page'

withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '知识库',
  labelWidth: '220rpx',
  placeholder: '请选择知识库',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: KnowledgeLibrary | undefined]
}>()

const libraries = ref<KnowledgeLibrary[]>([]) // 可访问的知识库列表

const columns = computed(() => libraries.value.map(item => ({ label: item.name, value: item.id }))) // 知识库选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
}

/** 选择确认 */
function handleConfirm(value: any) {
  emit('change', libraries.value.find(item => item.id === value))
}

/** 初始化 */
onMounted(async () => {
  libraries.value = await getAllPageItems((pageNo, pageSize) => getKnowledgeLibraryPage({ pageNo, pageSize }))
})
</script>
