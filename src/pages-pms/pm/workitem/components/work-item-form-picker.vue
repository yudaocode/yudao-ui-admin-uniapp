<template>
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :label-width="labelWidth"
    :prop="prop"
    :columns="columns"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    filterable
    @update:model-value="handleUpdate"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { WorkItem } from '@/api/pms/pm/workitem'
import { getWorkItemPage } from '@/api/pms/pm/workitem'
import { getAllPageItems } from '@/utils/page'

const props = withDefaults(defineProps<{
  modelValue?: number
  projectId?: number // 所属项目编号
  type?: number // 工作项类型
  excludeId?: number // 排除的工作项编号（编辑时排除自身）
  label?: string
  labelWidth?: string
  placeholder?: string
  prop?: string
  disabled?: boolean
  clearable?: boolean
}>(), {
  projectId: undefined,
  type: undefined,
  excludeId: undefined,
  label: '父级工作项',
  labelWidth: '220rpx',
  placeholder: '请选择工作项',
  prop: '',
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: WorkItem | undefined]
}>()

const workItems = ref<WorkItem[]>([]) // 工作项选项来源

const columns = computed(() => workItems.value.map(item => ({
  label: `#${item.serialNumber} ${item.name}`,
  value: item.id,
}))) // 工作项选项：序号 + 标题

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
}

/** 选择确认 */
function handleConfirm(value: any) {
  emit('change', workItems.value.find(item => item.id === value))
}

/** 查询条件变化时刷新工作项选项 */
watch(
  () => [props.projectId, props.type, props.excludeId],
  async () => {
    if (!props.projectId || !props.type) {
      workItems.value = []
      return
    }
    const items = await getAllPageItems((pageNo, pageSize) =>
      getWorkItemPage({ pageNo, pageSize, projectId: props.projectId, type: props.type }))
    workItems.value = items.filter(item => item.id !== props.excludeId)
  },
  { immediate: true },
)
</script>
