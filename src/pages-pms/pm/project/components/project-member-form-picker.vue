<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :columns="columns"
    :placeholder="placeholder"
    :disabled="disabled"
    :type="type"
    :clearable="clearable"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
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
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  projectId: undefined,
  type: 'radio',
  label: '负责人',
  labelWidth: '220rpx',
  placeholder: '请选择项目成员',
  prop: '',
  disabled: false,
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  'change': [value: number | number[] | undefined]
}>()

const members = ref<ProjectMember[]>([]) // 项目成员选项来源

const columns = computed(() => members.value.map(item => ({ label: item.nickname, value: item.userId }))) // 项目成员选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
}

/** 选择确认 */
function handleConfirm(value: any) {
  emit('change', value)
}

/** 项目变化时刷新成员选项 */
watch(() => props.projectId, async (projectId) => {
  members.value = projectId ? await getProjectMemberList(projectId) : []
}, { immediate: true })
</script>
