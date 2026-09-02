<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :columns="columns"
    :placeholder="placeholder"
    :disabled="disabled || !projectId"
    :clearable="clearable"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Iteration } from '@/api/pms/pm/iteration'
import { getIterationPage } from '@/api/pms/pm/iteration'
import { getAllPageItems } from '@/utils/page'

const props = withDefaults(defineProps<{
  modelValue?: number
  projectId?: number // 所属项目编号，为空时不可选择
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  projectId: undefined,
  label: '所属迭代',
  labelWidth: '220rpx',
  placeholder: '请选择迭代',
  prop: '',
  disabled: false,
  clearable: true, // 所属迭代允许清空回「待规划」
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Iteration | undefined]
}>()

const iterations = ref<Iteration[]>([]) // 迭代选项来源

const columns = computed(() => iterations.value.map(item => ({ label: item.name, value: item.id }))) // 迭代选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
}

/** 选择确认 */
function handleConfirm(value: any) {
  emit('change', iterations.value.find(item => item.id === value))
}

/** 项目变化时刷新迭代选项 */
watch(() => props.projectId, async (projectId) => {
  iterations.value = projectId
    ? await getAllPageItems((pageNo, pageSize) => getIterationPage({ pageNo, pageSize, projectId }))
    : []
}, { immediate: true })
</script>
