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
import type { WorkItemLabel } from '@/api/pms/pm/workitem/label'
import { getWorkItemLabelList } from '@/api/pms/pm/workitem/label'

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

const labels = ref<WorkItemLabel[]>([]) // 标签选项来源

const columns = computed(() => labels.value.map(item => ({ label: item.name, value: item.id }))) // 标签选项

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value ?? [])
}

/** 刷新标签选项（标签管理后调用） */
async function reload() {
  labels.value = await getWorkItemLabelList()
}

defineExpose({ reload })

/** 初始化 */
onMounted(reload)
</script>
