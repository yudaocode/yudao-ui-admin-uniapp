<template>
  <yd-search-picker
    :model-value="modelValue"
    label="迭代"
    :columns="columns"
    all-option
    all-label="全部迭代"
    placeholder="请选择迭代"
    filterable
    :before-open="beforeOpen"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import type { Iteration } from '@/api/pms/pm/iteration'
import { getIterationPage } from '@/api/pms/pm/iteration'
import { getAllPageItems } from '@/utils/page'
import { useToast } from '@wot-ui/ui/components/wd-toast'

const props = defineProps<{
  modelValue?: number
  projectId?: number // 所属项目编号，为空时提示先选项目
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: Iteration | undefined] // 选中项变化，供父级拼接搜索文案
}>()

const toast = useToast()
const iterations = ref<Iteration[]>([]) // 迭代选项来源

const columns = computed(() => iterations.value.map(item => ({ label: item.name, value: item.id }))) // 迭代选项

/** 打开前校验：迭代从属于项目 */
function beforeOpen() {
  if (!props.projectId) {
    toast.warning('请先选择项目')
    return false
  }
}

/** 更新选中值 */
function handleUpdate(value: any) {
  emit('update:modelValue', value)
  emit('change', iterations.value.find(item => item.id === value))
}

/** 项目变化时刷新迭代选项 */
watch(() => props.projectId, async (projectId) => {
  iterations.value = projectId
    ? await getAllPageItems((pageNo, pageSize) => getIterationPage({ pageNo, pageSize, projectId }))
    : []
}, { immediate: true })
</script>
