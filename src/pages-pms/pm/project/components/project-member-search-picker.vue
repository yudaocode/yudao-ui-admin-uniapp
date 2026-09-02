<template>
  <yd-search-picker
    :model-value="modelValue"
    :label="label"
    :columns="columns"
    all-option
    :all-label="allLabel"
    :placeholder="placeholder"
    :type="type"
    filterable
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { ProjectMember } from '@/api/pms/pm/project/member'
import { getProjectMemberList } from '@/api/pms/pm/project/member'

const props = withDefaults(defineProps<{
  modelValue?: number | number[]
  projectId?: number // 所属项目编号，为空时无选项
  type?: 'radio' | 'checkbox'
  label?: string
  allLabel?: string
  placeholder?: string
}>(), {
  projectId: undefined,
  type: 'radio',
  label: '负责人',
  allLabel: '全部',
  placeholder: '请选择项目成员',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  'change': [item: ProjectMember | undefined] // 选中项变化（单选），供父级拼接搜索文案
}>()

const members = ref<ProjectMember[]>([]) // 项目成员选项来源

const columns = computed(() => members.value.map(item => ({ label: item.nickname, value: item.userId }))) // 项目成员选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
  emit('change', members.value.find(item => item.userId === value))
}

/** 项目变化时刷新成员选项 */
watch(() => props.projectId, async (projectId) => {
  members.value = projectId ? await getProjectMemberList(projectId) : []
}, { immediate: true })
</script>
