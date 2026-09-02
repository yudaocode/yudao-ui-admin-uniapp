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
import type { Project } from '@/api/pms/pm/project'
import { getProjectPage } from '@/api/pms/pm/project'
import { getAllPageItems } from '@/utils/page'

const props = withDefaults(defineProps<{
  modelValue?: number
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
}>(), {
  label: '所属项目',
  labelWidth: '220rpx',
  placeholder: '请选择项目',
  prop: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Project | undefined]
}>()

const projects = ref<Project[]>([]) // 项目选项来源

const columns = computed(() => projects.value.map(item => ({ label: item.name, value: item.id }))) // 项目选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
}

/** 选择确认 */
function handleConfirm(value: any) {
  emit('change', projects.value.find(item => item.id === value))
}

/** 初始化 */
onMounted(async () => {
  projects.value = await getAllPageItems((pageNo, pageSize) => getProjectPage({ pageNo, pageSize }))
})
</script>
