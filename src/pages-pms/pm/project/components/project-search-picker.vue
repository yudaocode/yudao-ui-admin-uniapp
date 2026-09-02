<template>
  <yd-search-picker
    :model-value="modelValue"
    label="项目"
    :columns="columns"
    all-option
    all-label="全部项目"
    placeholder="请选择项目"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { Project } from '@/api/pms/pm/project'
import { getProjectPage } from '@/api/pms/pm/project'
import { getAllPageItems } from '@/utils/page'

defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Project | undefined] // 选中项变化，供父级拼接搜索文案
}>()

const projects = ref<Project[]>([]) // 项目选项来源

const columns = computed(() => projects.value.map(item => ({ label: item.name, value: item.id }))) // 项目选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
  emit('change', projects.value.find(item => item.id === value))
}

/** 初始化 */
onMounted(async () => {
  projects.value = await getAllPageItems((pageNo, pageSize) => getProjectPage({ pageNo, pageSize }))
})
</script>
