<template>
  <yd-search-picker
    :model-value="modelValue"
    label="标签"
    :columns="columns"
    type="checkbox"
    placeholder="全部标签"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { WorkItemLabel } from '@/api/pms/pm/workitem/label'
import { getWorkItemLabelList } from '@/api/pms/pm/workitem/label'

defineProps<{
  modelValue?: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const labels = ref<WorkItemLabel[]>([]) // 标签选项来源

const columns = computed(() => labels.value.map(item => ({ label: item.name, value: item.id }))) // 标签选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value ?? [])
}

/** 初始化 */
onMounted(async () => {
  labels.value = await getWorkItemLabelList()
})
</script>
