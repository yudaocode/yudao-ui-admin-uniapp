<template>
  <yd-search-picker
    :model-value="modelValue"
    label="知识库"
    :columns="columns"
    :all-option="allOption"
    all-label="全部知识库"
    placeholder="请选择知识库"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { KnowledgeLibrary } from '@/api/pms/kb/library'
import { getKnowledgeLibraryPage } from '@/api/pms/kb/library'
import { getAllPageItems } from '@/utils/page'

withDefaults(defineProps<{
  modelValue?: number
  allOption?: boolean // 是否提供「全部知识库」选项；回收站等后端必选库的场景关闭
}>(), {
  allOption: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: KnowledgeLibrary | undefined] // 选中项变化，供父级拼接搜索文案
}>()

const libraries = ref<KnowledgeLibrary[]>([]) // 知识库选项来源

const columns = computed(() => libraries.value.map(item => ({ label: item.name, value: item.id }))) // 知识库选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
  emit('change', libraries.value.find(item => item.id === value))
}

/** 初始化 */
onMounted(async () => {
  libraries.value = await getAllPageItems((pageNo, pageSize) => getKnowledgeLibraryPage({ pageNo, pageSize }))
})
</script>
